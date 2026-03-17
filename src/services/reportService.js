const logger = require('../config/logger');

exports.generateReport = async (payload) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  if (payload.shouldFail) {
    throw new Error('Report generation failed while aggregating data');
  }

  logger.info('Report task simulated', { reportId: payload.reportId || 'unknown' });

  return {
    generated: true,
    reportId: payload.reportId || `report-${Date.now()}`,
  };
};
