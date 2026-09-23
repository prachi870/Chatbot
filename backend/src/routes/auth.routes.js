const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validateSignupBody,
  validateLoginBody,
} = require('../middleware/validation.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/signup', authLimiter, validateSignupBody, authController.signup);
router.post('/login', authLimiter, validateLoginBody, authController.login);
router.get('/me', requireAuth, authController.getMe);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
