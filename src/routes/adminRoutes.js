const express = require('express');
const adminController = require('../controllers/adminController');


const router = express.Router();

router.get('/queues', adminController.getQueueDashboard);
router.get('/failed-jobs', adminController.getFailedJobs);

module.exports = router;
