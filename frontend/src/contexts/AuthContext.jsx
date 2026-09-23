import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

/**
 * Generates a throwaway identity so the app can create a session
 * automatically, with no login/signup screen in the way.
 */
function generateGuestCredentials() {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: 'Guest',
    email: `guest_${id}@nexus.local`,
    password: `Guest_${id}!`,
    confirmPassword: `Guest_${id}!`,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // bootstrapping the session
  const [bootError, setBootError] = useState('');

  const provisionGuest = useCallback(async () => {
    const data = await authApi.signup(generateGuestCredentials());
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setBootError('');
    const token = localStorage.getItem('token');

    try {
      if (token) {
        // Try to restore the existing (guest) session first.
        const { user } = await authApi.getMe();
        setUser(user);
      } else {
        // No session yet — silently create one so the chat opens directly.
        await provisionGuest();
      }
    } catch {
      // Stored token was invalid/expired — clear it and start a fresh guest session.
      localStorage.removeItem('token');
      try {
        await provisionGuest();
      } catch (err) {
        setBootError(err.message || 'Could not start a session. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [provisionGuest]);

  // On mount, restore or silently create a session.
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem('token');
    setUser(null);
    // Immediately start a brand-new guest session — there's no login page to send the user to.
    await bootstrap();
  }, [bootstrap]);

  return (
    <AuthContext.Provider value={{ user, loading, bootError, retry: bootstrap, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
