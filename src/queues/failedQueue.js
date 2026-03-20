const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const failedQueueName = 'failed-jobs';

const failedQueue = new Queue(failedQueueName, {
  connection: redisConnection,
});

async function getFailedQueueCounts() {
  return failedQueue.getJobCounts();
}

module.exports = failedQueue;
module.exports.failedQueueName = failedQueueName;
module.exports.getFailedQueueCounts = getFailedQueueCounts;
