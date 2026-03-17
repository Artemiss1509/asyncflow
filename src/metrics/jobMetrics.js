const { getQueueCounts } = require('../queues/jobQueue');

const metrics = {
  processedJobs: 0,
  failedJobs: 0,
  totalProcessingDurationMs: 0,
  lastProcessingDurationMs: 0,
};

function incrementProcessedJobs() {
  metrics.processedJobs += 1;
}

function incrementFailedJobs() {
  metrics.failedJobs += 1;
}

function observeJobDuration(durationMs) {
  metrics.totalProcessingDurationMs += durationMs;
  metrics.lastProcessingDurationMs = durationMs;
}

async function getQueueMetricsSnapshot() {
  const counts = await getQueueCounts();
  const averageProcessingDurationMs = metrics.processedJobs
    ? Number((metrics.totalProcessingDurationMs / metrics.processedJobs).toFixed(2))
    : 0;

  return {
    processedJobs: metrics.processedJobs,
    failedJobs: metrics.failedJobs,
    queueLength: counts.waiting + counts.active + counts.delayed,
    lastProcessingDurationMs: metrics.lastProcessingDurationMs,
    averageProcessingDurationMs,
  };
}

async function getPrometheusMetrics() {
  const snapshot = await getQueueMetricsSnapshot();

  return [
    '# HELP asyncflow_processed_jobs_total Total number of completed jobs',
    '# TYPE asyncflow_processed_jobs_total counter',
    `asyncflow_processed_jobs_total ${snapshot.processedJobs}`,
    '# HELP asyncflow_failed_jobs_total Total number of failed jobs',
    '# TYPE asyncflow_failed_jobs_total counter',
    `asyncflow_failed_jobs_total ${snapshot.failedJobs}`,
    '# HELP asyncflow_queue_length Current queue length',
    '# TYPE asyncflow_queue_length gauge',
    `asyncflow_queue_length ${snapshot.queueLength}`,
    '# HELP asyncflow_job_processing_last_duration_ms Duration of the most recent completed job in milliseconds',
    '# TYPE asyncflow_job_processing_last_duration_ms gauge',
    `asyncflow_job_processing_last_duration_ms ${snapshot.lastProcessingDurationMs}`,
    '# HELP asyncflow_job_processing_avg_duration_ms Average completed job duration in milliseconds',
    '# TYPE asyncflow_job_processing_avg_duration_ms gauge',
    `asyncflow_job_processing_avg_duration_ms ${snapshot.averageProcessingDurationMs}`,
  ].join('\n');
}

module.exports = {
  incrementProcessedJobs,
  incrementFailedJobs,
  observeJobDuration,
  getQueueMetricsSnapshot,
  getPrometheusMetrics,
};
