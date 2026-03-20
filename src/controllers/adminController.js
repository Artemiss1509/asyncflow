const { getQueueCounts } = require('../queues/jobQueue');
const { getFailedQueueCounts } = require('../queues/failedQueue');
const Job = require('../models/jobModel');
const { stat } = require('node:fs');

exports.getQueueDashboard = async (req, res, next) => {
  try {
    const [jobQueueCounts, failedQueueCounts, metrics] = await Promise.all([
      getQueueCounts(),
      getFailedQueueCounts(),
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

exports.getFailedJobs = async (req, res, next) => {
  try {
    const failedJobs = await Job.findAll({
      where: { status: 'failed' },
      order: [['completed_at', 'DESC']],
      limit: 100,
    });

    res.json({
      failedJobs: failedJobs.map(job => ({
        id: job.id,
        status: job.status,
        task_type: job.task_type,
        payload: job.payload,
        created_at: job.created_at,
        completed_at: job.completed_at
      })),
    });
  } catch (error) {
    next(error);
  }
};