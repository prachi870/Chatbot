const express = require('express');
const chatController = require('../controllers/chat.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validateChatTitleBody,
  validateChatTitleRequiredBody,
} = require('../middleware/validation.middleware');
const messageRoutes = require('./message.routes');

const router = express.Router();

// Every chat route requires authentication.
router.use(requireAuth);

router.post('/', validateChatTitleBody, chatController.createChat);
router.get('/', chatController.listChats);
router.get('/:chatId', chatController.getChat);
router.patch('/:chatId', validateChatTitleRequiredBody, chatController.renameChat);
router.delete('/:chatId', chatController.deleteChat);

// Nested message routes: /api/chats/:chatId/messages
router.use('/:chatId/messages', messageRoutes);

module.exports = router;
