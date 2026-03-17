const Job = require('../models/jobModel');
const jobQueue = require('../queues/jobQueue');
const logger = require('../config/logger');

exports.createJob = async (req, res, next) => {
  try {
    const { task_type: taskType, payload, priority = 3 } = req.body;

    if (!taskType || !payload) {
      return res.status(400).json({
        message: 'task_type and payload are required',
      });
    }

    const dbJob = await Job.create({
      task_type: taskType,
      payload,
      status: 'pending',
    });

    await jobQueue.add(taskType, { payload, dbJobId: dbJob.id }, {
      jobId: `job-${dbJob.id}`,
      priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 1000,
      removeOnFail: false,
    });

    logger.info('Job stored and queued', { jobId: dbJob.id, taskType, priority });

    return res.status(201).json({
      jobId: dbJob.id,
      status: dbJob.status,
      message: 'Job created successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getJobStatus = async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    return res.json({
      id: job.id,
      status: job.status,
      task_type: job.task_type,
      payload: job.payload,
      created_at: job.created_at,
      completed_at: job.completed_at,
    });
  } catch (error) {
    next(error);
  }
};
