import api from './axios';

/**
 * POST /api/chats
 * @param {string} [title]
 * @returns {{ chat: ChatObject }}
 */
export async function createChat(title) {
  const res = await api.post('/chats', title ? { title } : {});
  return res.data;
}

/**
 * GET /api/chats  — sorted updatedAt desc
 * @returns {{ chats: ChatObject[] }}
 */
export async function listChats() {
  const res = await api.get('/chats');
  return res.data;
}

/**
 * GET /api/chats/:chatId  — includes messages[]
 * @returns {{ chat: ChatObject, messages: MessageObject[] }}
 */
export async function getChat(chatId) {
  const res = await api.get(`/chats/${chatId}`);
  return res.data;
}

/**
 * PATCH /api/chats/:chatId
 * @param {string} chatId
 * @param {string} title
 * @returns {{ chat: ChatObject }}
 */
export async function renameChat(chatId, title) {
  const res = await api.patch(`/chats/${chatId}`, { title });
  return res.data;
}

/**
 * DELETE /api/chats/:chatId
 */
export async function deleteChat(chatId) {
  const res = await api.delete(`/chats/${chatId}`);
  return res.data;
}
