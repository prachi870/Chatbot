const gemini = require('./gemini.service');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const HISTORY_LIMIT = 10;

// In-memory storage
const chatsDb = new Map();
const messagesDb = new Map();
let chatIdCounter = 1;
let messageIdCounter = 1;

/**
 * Creates a new chat (in-memory).
 */
async function createChat(userId, title) {
  const chat = {
    _id: (chatIdCounter++).toString(),
    userId,
    title: title && title.trim() ? title.trim() : 'New Conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  chatsDb.set(chat._id, chat);
  return chat;
}

/**
 * Returns all chats for a user.
 */
async function listChats(userId) {
  const userChats = [];
  for (const chat of chatsDb.values()) {
    if (chat.userId === userId) {
      userChats.push(chat);
    }
  }
  return userChats.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Fetches one chat with messages.
 */
async function getChatWithMessages(userId, chatId) {
  const chat = await findOwnedChat(userId, chatId);
  const messages = [];
  for (const msg of messagesDb.values()) {
    if (msg.chatId === chatId) {
      messages.push(msg);
    }
  }
  messages.sort((a, b) => a.createdAt - b.createdAt);
  return { chat, messages };
}

/**
 * Renames a chat.
 */
async function renameChat(userId, chatId, title) {
  const chat = await findOwnedChat(userId, chatId);
  chat.title = title.trim();
  chat.updatedAt = new Date();
  return chat;
}

/**
 * Deletes a chat and its messages.
 */
async function deleteChat(userId, chatId) {
  const chat = await findOwnedChat(userId, chatId);
  // Delete all messages
  for (const [msgId, msg] of messagesDb.entries()) {
    if (msg.chatId === chatId) {
      messagesDb.delete(msgId);
    }
  }
  chatsDb.delete(chatId);
}

/**
 * Send message and get AI response.
 */
async function sendMessage(userId, chatId, content, fileData) {
  const chat = await findOwnedChat(userId, chatId);

  // Get history
  const allMessages = [];
  for (const msg of messagesDb.values()) {
    if (msg.chatId === chatId) {
      allMessages.push(msg);
    }
  }
  allMessages.sort((a, b) => b.createdAt - a.createdAt);
  const priorMessages = allMessages.slice(0, HISTORY_LIMIT).reverse();
  const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));

  const aiText = await gemini.generateResponse(history, content, fileData);

  const userMessage = {
    _id: (messageIdCounter++).toString(),
    chatId: chat._id,
    userId,
    role: 'user',
    content,
    createdAt: new Date(),
  };
  messagesDb.set(userMessage._id, userMessage);

  const assistantMessage = {
    _id: (messageIdCounter++).toString(),
    chatId: chat._id,
    userId,
    role: 'assistant',
    content: aiText,
    createdAt: new Date(),
  };
  messagesDb.set(assistantMessage._id, assistantMessage);

  if (chat.title === 'New Conversation') {
    chat.title = content.slice(0, 60).trim() || chat.title;
  }
  chat.updatedAt = new Date();

  return { userMessage, assistantMessage };
}

/**
 * Streaming message.
 */
async function* sendMessageStream(userId, chatId, content, fileData) {
  const chat = await findOwnedChat(userId, chatId);

  // Get history
  const allMessages = [];
  for (const msg of messagesDb.values()) {
    if (msg.chatId === chatId) {
      allMessages.push(msg);
    }
  }
  allMessages.sort((a, b) => b.createdAt - a.createdAt);
  const priorMessages = allMessages.slice(0, HISTORY_LIMIT).reverse();
  const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));

  const displayContent = content || (fileData ? `[File: ${fileData.originalName}]` : '');

  const userMessage = {
    _id: (messageIdCounter++).toString(),
    chatId: chat._id,
    userId,
    role: 'user',
    content: displayContent,
    createdAt: new Date(),
  };
  messagesDb.set(userMessage._id, userMessage);

  let fullText = '';
  try {
    for await (const chunk of gemini.streamResponse(history, content, fileData)) {
      fullText += chunk;
      yield chunk;
    }
  } finally {
    if (fullText.trim().length > 0) {
      const assistantMessage = {
        _id: (messageIdCounter++).toString(),
        chatId: chat._id,
        userId,
        role: 'assistant',
        content: fullText,
        createdAt: new Date(),
      };
      messagesDb.set(assistantMessage._id, assistantMessage);

      if (chat.title === 'New Conversation') {
        chat.title = displayContent.slice(0, 60).trim() || chat.title;
      }
      chat.updatedAt = new Date();
    }
  }

  return { userMessageId: userMessage._id };
}

/**
 * Find owned chat.
 */
async function findOwnedChat(userId, chatId) {
  const chat = chatsDb.get(chatId);
  if (!chat || chat.userId !== userId) {
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
