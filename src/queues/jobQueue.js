const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const queueName = process.env.QUEUE_NAME || 'jobs';

const jobQueue = new Queue(queueName, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

async function getQueueCounts() {
  return jobQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
}

module.exports = jobQueue;
module.exports.queueName = queueName;
module.exports.getQueueCounts = getQueueCounts;
