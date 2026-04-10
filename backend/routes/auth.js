const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validate');

router.post('/login', validateLogin, login);
router.post('/register', protect, authorize('admin'), validateRegister, register);
router.get('/me', protect, getMe);

module.exports = router;
