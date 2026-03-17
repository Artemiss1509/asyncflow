const { getQueueMetricsSnapshot } = require('../metrics/jobMetrics');
const { getQueueCounts } = require('../queues/jobQueue');
const { getFailedQueueCounts } = require('../queues/failedQueue');

exports.getQueueDashboard = async (_req, res, next) => {
  try {
    const [jobQueueCounts, failedQueueCounts, metrics] = await Promise.all([
      getQueueCounts(),
      getFailedQueueCounts(),
      getQueueMetricsSnapshot(),
    ]);

    res.json({
      queues: {
        jobs: jobQueueCounts,
        failed: failedQueueCounts,
      },
      metrics,
    });
  } catch (error) {
    next(error);
  }
};
