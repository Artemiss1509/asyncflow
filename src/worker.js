require('dotenv').config();

const { Worker } = require('bullmq');
const { Op } = require('sequelize');
const logger = require('./config/logger');
const { initializeDatabase } = require('./config/database');
const redisConnection = require('./config/redis');
const Job = require('./models/jobModel');
const failedQueue = require('./queues/failedQueue');
const { queueName } = require('./queues/jobQueue');
const { observeJobDuration, incrementFailedJobs, incrementProcessedJobs } = require('./metrics/jobMetrics');
const emailService = require('./services/emailService');
const reportService = require('./services/reportService');
const imageService = require('./services/imageService');

const taskHandlers = {
  send_email: emailService.sendEmail,
  generate_report: reportService.generateReport,
  resize_image: imageService.resizeImage,
};

async function processTask(job) {
  const handler = taskHandlers[job.name];
  const dbJobId = Number(job.data.dbJobId);

  if (!handler) {
    throw new Error(`Unsupported task type: ${job.name}`);
  }

  await Job.update(
    { status: 'processing' },
    { where: { id: dbJobId } }
  );

  const startedAt = Date.now();

  try {
    const result = await handler(job.data.payload);

    await Job.update(
      { status: 'completed', completed_at: new Date() },
      { where: { id: dbJobId } }
    );

    incrementProcessedJobs();
    observeJobDuration(Date.now() - startedAt);
    logger.info('Job completed', { jobId: job.id, taskType: job.name });

    return result;
  } catch (error) {
    const attemptsAllowed = job.opts.attempts || 1;
    const nextAttempt = job.attemptsMade + 1;
    const hasRetriesRemaining = nextAttempt < attemptsAllowed;

    await Job.update(
      { status: hasRetriesRemaining ? 'pending' : 'failed' },
      { where: { id: dbJobId } }
    );

    logger.error('Job execution failed', {
      jobId: job.id,
      taskType: job.name,
      attempt: nextAttempt,
      attemptsAllowed,
      message: error.message,
    });

    throw error;
  }
}

async function startWorker() {
  await initializeDatabase();

  const worker = new Worker(queueName, processTask, {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: Number(process.env.JOB_RATE_LIMIT_MAX || 10),
      duration: Number(process.env.JOB_RATE_LIMIT_DURATION || 1000),
    },
  });

  worker.on('completed', (job) => {
    logger.info('Worker acknowledged completion', { jobId: job.id, taskType: job.name });
  });

  worker.on('failed', async (job, error) => {
    if (!job) {
      logger.error('Worker received a failure event without a job', { message: error.message });
      return;
    }

    const attemptsAllowed = job.opts.attempts || 1;
    const exhaustedRetries = job.attemptsMade >= attemptsAllowed;

    if (exhaustedRetries) {
      await Job.update(
        { status: 'failed' },
        { where: { id: Number(job.data.dbJobId), status: { [Op.ne]: 'completed' } } }
      );

      await failedQueue.add('failed-task', {
        originalJobId: job.id,
        dbJobId: job.data.dbJobId,
        taskType: job.name,
        payload: job.data.payload,
        error: error.message,
        failedAt: new Date().toISOString(),
      });

      incrementFailedJobs();
      logger.error('Job moved to dead letter queue', {
        jobId: job.id,
        taskType: job.name,
        message: error.message,
      });
    }
  });

  logger.info('AsyncFlow worker started', { queueName });
}

startWorker().catch((error) => {
  logger.error('Unable to start worker', { message: error.message, stack: error.stack });
  process.exit(1);
});
