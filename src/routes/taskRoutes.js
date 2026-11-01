const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const verifyTask = require('../middlewares/verifyTaskMiddleware');
const verifyToken = require('../middlewares/verifyTokenMiddleware');

router.use(verifyToken);

router.post('/', verifyTask, taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/search', taskController.searchTasks);
router.get('/assignee/:name', taskController.getTasksByAssignee);
router.get('/:id', taskController.getTaskById);
router.put('/:id', verifyTask, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;