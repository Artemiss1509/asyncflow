const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/queues', adminController.getQueueDashboard);

module.exports = router;
