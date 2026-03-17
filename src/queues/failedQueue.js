const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const failedQueueName = process.env.FAILED_QUEUE_NAME || 'failed-jobs';

const failedQueue = new Queue(failedQueueName, {
  connection: redisConnection,
});

async function getFailedQueueCounts() {
  return failedQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
}

module.exports = failedQueue;
module.exports.failedQueueName = failedQueueName;
module.exports.getFailedQueueCounts = getFailedQueueCounts;
