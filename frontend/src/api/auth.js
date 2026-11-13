import api from './axios';

/**
 * POST /api/auth/signup
 * @param {{ name: string, email: string, password: string, confirmPassword: string }} data
 * @returns {{ token: string, user: { id, name, email } }}
 */
export async function signup(data) {
  const res = await api.post('/auth/signup', data);
  return res.data; // { success, token, user, message }
}

/**
 * POST /api/auth/login
 * @param {{ email: string, password: string }} data
 * @returns {{ token: string, user: { id, name, email } }}
 */
export async function login(data) {
  const res = await api.post('/auth/login', data);
  return res.data;
}

/**
 * GET /api/auth/me  — requires token already in localStorage
 * @returns {{ user: { id, name, email } }}
 */
export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data;
}

/**
 * POST /api/auth/logout  — server is stateless; call is best-effort
 */
export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore errors — we'll clear the token client-side regardless
  }
}
