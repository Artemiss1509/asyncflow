const logger = require('../config/logger');

exports.resizeImage = async (payload) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (payload.shouldFail) {
    throw new Error('Image resize pipeline failed on source validation');
  }

  logger.info('Image task simulated', {
    imageId: payload.imageId || 'unknown',
    size: payload.size || '1024x768',
  });

  return {
    resized: true,
    imageId: payload.imageId || `image-${Date.now()}`,
  };
};
