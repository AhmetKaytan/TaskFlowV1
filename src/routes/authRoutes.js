const express = require('express');
const router = express.Router();


const authController = require('../controllers/authController');
const verifyUser = require('../middlewares/verifyUser');
const verifyToken = require('../middlewares/verifyTokenMiddleware');

router.post('/login', authController.login);
router.post('/register', verifyUser, authController.register);
router.post('/logout',  verifyToken, authController.logout);



module.exports = router;