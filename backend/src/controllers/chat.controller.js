const chatService = require('../services/chat.service');
const { asyncHandler } = require('../middleware/error.middleware');

// POST /api/chats
const createChat = asyncHandler(async (req, res) => {
  const { title } = req.body || {};
  const chat = await chatService.createChat(req.userId, title);

  res.status(201).json({ success: true, chat });
});

// GET /api/chats
const listChats = asyncHandler(async (req, res) => {
  const chats = await chatService.listChats(req.userId);
  res.status(200).json({ success: true, chats });
});

// GET /api/chats/:chatId
const getChat = asyncHandler(async (req, res) => {
  const { chat, messages } = await chatService.getChatWithMessages(req.userId, req.params.chatId);
  res.status(200).json({ success: true, chat, messages });
});

// PATCH /api/chats/:chatId
const renameChat = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const chat = await chatService.renameChat(req.userId, req.params.chatId, title);
  res.status(200).json({ success: true, chat });
});

// DELETE /api/chats/:chatId
const deleteChat = asyncHandler(async (req, res) => {
  await chatService.deleteChat(req.userId, req.params.chatId);
  res.status(200).json({ success: true, message: 'Chat deleted successfully.' });
});

module.exports = { createChat, listChats, getChat, renameChat, deleteChat };
