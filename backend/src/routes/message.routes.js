const express = require('express');
const { sendMessage, sendMessageStream, uploadMiddleware } = require('../controllers/message.controller');
const { messageLimiter } = require('../middleware/rateLimit.middleware');

// mergeParams so we can read :chatId from the parent router
const router = express.Router({ mergeParams: true });

// Validation is now handled inside the controller (supports both JSON and multipart)
// uploadMiddleware runs multer — parses multipart/form-data and attaches req.file

// POST /api/chats/:chatId/messages
router.post('/',       messageLimiter, uploadMiddleware, sendMessage);

// POST /api/chats/:chatId/messages/stream
router.post('/stream', messageLimiter, uploadMiddleware, sendMessageStream);

module.exports = router;
