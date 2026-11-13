const Chat = require('../models/Chat');
const Message = require('../models/Message');
const gemini = require('./gemini.service');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const HISTORY_LIMIT = 10; // most recent messages sent as context to Gemini

/**
 * Creates a new chat owned by the given user.
 */
async function createChat(userId, title) {
  const chat = await Chat.create({
    userId,
    title: title && title.trim() ? title.trim() : 'New Conversation',
  });
  return chat;
}

/**
 * Returns all chats for a user, most recently updated first.
 */
async function listChats(userId) {
  return Chat.find({ userId }).sort({ updatedAt: -1 });
}

/**
 * Fetches one chat (with ownership check) plus all its messages, oldest first.
 * Throws AppError(404) if the chat doesn't exist or isn't owned by this user.
 */
async function getChatWithMessages(userId, chatId) {
  const chat = await findOwnedChat(userId, chatId);
  const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
  return { chat, messages };
}

/**
 * Renames a chat. Ownership enforced.
 */
async function renameChat(userId, chatId, title) {
  const chat = await findOwnedChat(userId, chatId);
  chat.title = title.trim();
  await chat.save();
  return chat;
}

/**
 * Deletes a chat and all of its messages. Ownership enforced.
 */
async function deleteChat(userId, chatId) {
  const chat = await findOwnedChat(userId, chatId);
  await Message.deleteMany({ chatId: chat._id });
  await chat.deleteOne();
}

/**
 * Core message flow (section 11 of the spec):
 * find chat -> verify ownership -> load history -> call Gemini ->
 * save user message -> save AI message -> return AI message.
 *
 * Ownership is enforced by findOwnedChat, using ONLY the authenticated
 * userId from the JWT (never a userId from the request body).
 */
async function sendMessage(userId, chatId, content, fileData) {
  const chat = await findOwnedChat(userId, chatId);

  const priorMessages = await Message.find({ chatId: chat._id })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT);
  priorMessages.reverse();

  const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));

  const aiText = await gemini.generateResponse(history, content, fileData);

  const userMessage = await Message.create({
    chatId: chat._id,
    userId,
    role: 'user',
    content,
  });

  const assistantMessage = await Message.create({
    chatId: chat._id,
    userId,
    role: 'assistant',
    content: aiText,
  });

  // Bump updatedAt so the chat sorts to the top of the sidebar; also
  // auto-title brand-new chats from the first message.
  if (chat.title === 'New Conversation') {
    chat.title = content.slice(0, 60).trim() || chat.title;
  }
  chat.updatedAt = new Date();
  await chat.save();

  return { userMessage, assistantMessage };
}

/**
 * Streaming variant of sendMessage. Persists the user message immediately,
 * then yields text chunks from Gemini, and persists the final assembled
 * assistant message once the stream completes.
 *
 * @returns {AsyncGenerator<string>} yields text chunks; the caller must
 *   also call the returned `onComplete` info via the generator's return value.
 */
async function* sendMessageStream(userId, chatId, content, fileData) {
  const chat = await findOwnedChat(userId, chatId);

  const priorMessages = await Message.find({ chatId: chat._id })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT);
  priorMessages.reverse();

  const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));

  // Use file-friendly label for the user message content
  const displayContent = content || (fileData ? `[File: ${fileData.originalName}]` : '');

  const userMessage = await Message.create({
    chatId: chat._id,
    userId,
    role: 'user',
    content: displayContent,
  });

  let fullText = '';
  try {
    for await (const chunk of gemini.streamResponse(history, content, fileData)) {
      fullText += chunk;
      yield chunk;
    }
  } finally {
    if (fullText.trim().length > 0) {
      await Message.create({
        chatId: chat._id,
        userId,
        role: 'assistant',
        content: fullText,
      });

      if (chat.title === 'New Conversation') {
        chat.title = (displayContent).slice(0, 60).trim() || chat.title;
      }
      chat.updatedAt = new Date();
      await chat.save();
    }
  }

  return { userMessageId: userMessage._id };
}

/**
 * Finds a chat by id AND verifies it belongs to userId.
 * Throws AppError(404) either way (never 403) to avoid leaking whether
 * a chat id exists at all for a different user.
 */
async function findOwnedChat(userId, chatId) {
  const chat = await Chat.findOne({ _id: chatId, userId });
  if (!chat) {
    throw new AppError('Chat not found.', 404);
  }
  return chat;
}

module.exports = {
  createChat,
  listChats,
  getChatWithMessages,
  renameChat,
  deleteChat,
  sendMessage,
  sendMessageStream,
  AppError,
};
