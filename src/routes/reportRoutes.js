const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const verifyToken = require('../middlewares/verifyTokenMiddleware');

router.use(verifyToken);

router.get('/completed', reportController.getCompletedTasksReport);
router.get('/pending', reportController.getPendingTasksReport);
router.get('/summary', reportController.getSummaryReport);

module.exports = router;