let logger;

try {
  const { createLogger, format, transports } = require('winston');

  logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    ),
    transports: [new transports.Console()],
  });
} catch (_error) {
  const wrap = (level) => (message, meta = {}) => {
    const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console[level](`${message}${payload}`);
  };

  logger = {
    info: wrap('log'),
    warn: wrap('warn'),
    error: wrap('error'),
  };
}

module.exports = logger;
