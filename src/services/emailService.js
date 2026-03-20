const logger = require('../config/logger');

exports.sendEmail = async (payload) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (payload.shouldFail) {
    incrementFailedJobs();
    throw new Error('Email delivery provider rejected the request');
  }

  logger.info('Email task simulated', {
    to: payload.to,
    subject: payload.subject,
  });

  return {
    delivered: true,
    provider: 'simulated-email-provider',
  };
};
