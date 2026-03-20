require('dotenv').config();

const express = require('express');
const { initializeDatabase } = require('./config/database');
const logger = require('./config/logger');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const port = 3000;

app.use(express.json());


app.use('/jobs', jobRoutes);
app.use('/admin', adminRoutes);


app.use((error, _req, res, _next) => {
  logger.error('Unhandled API error', { message: error.message, stack: error.stack });
  res.status(500).json({ message: 'Internal server error' });
});

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      logger.info('AsyncFlow API started', { port });
    });
  } catch (error) {
    logger.error('Unable to start AsyncFlow API', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();

module.exports = app;
