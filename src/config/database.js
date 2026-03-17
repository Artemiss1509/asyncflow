const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize('testDB', 'rohan', '', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432,
    logging: false, 
});

let initialized = false;

async function initializeDatabase() {
  if (initialized) {
    return sequelize;
  }

  await sequelize.authenticate();
  await sequelize.sync();
  initialized = true;

  logger.info('Connected to PostgreSQL and synchronized models');
  return sequelize;
}

module.exports = sequelize;
module.exports.initializeDatabase = initializeDatabase;
