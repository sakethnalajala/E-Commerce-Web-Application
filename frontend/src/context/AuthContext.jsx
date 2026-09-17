import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/api';
import { onUnauthorized, invalidateGetCache } from '@/api/client';
import { STORAGE_KEYS, ROLES } from '@/constants';
import { readJson, writeJson, writeString, remove } from '@/utils/storage';
import { useToastContext } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { toast } = useToastContext();
  const [user, setUser] = useState(() => readJson(STORAGE_KEYS.user));
  // `initializing` covers the first token revalidation, so protected routes do
  // not bounce a logged-in user to /login on a hard refresh.
  const [initializing, setInitializing] = useState(true);

  const persistSession = useCallback((token, nextUser) => {
    // A new token changes what every user-scoped GET returns (cart, orders…).
    if (token) invalidateGetCache();
    if (token) writeString(STORAGE_KEYS.token, token);
    writeJson(STORAGE_KEYS.user, nextUser);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    remove(STORAGE_KEYS.token);
    remove(STORAGE_KEYS.user);
    invalidateGetCache();
    setUser(null);
  }, []);

  /* Revalidate the stored token against the API on mount. */
  useEffect(() => {
    let cancelled = false;

    const revalidate = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const response = await authApi.me();
        if (!cancelled) persistSession(null, response.data.user);
      } catch {
        // An expired or revoked token — drop the stale session silently.
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    revalidate();
    return () => {
      cancelled = true;
    };
  }, [persistSession, clearSession]);

  /* The API layer signals a rejected token from anywhere in the app. */
  useEffect(
    () =>
      onUnauthorized(() => {
        const hadSession = Boolean(localStorage.getItem(STORAGE_KEYS.token));
        clearSession();
        if (hadSession) toast.warning('Your session has expired. Please log in again.');
      }),
    [clearSession, toast]
  );

  /**
   * `requireRole` lets a role-specific sign-in page (the admin console) refuse
   * an otherwise valid login before anything is stored. The token is simply
   * discarded, so no session ever exists and guards never redirect mid-check.
   */
  const login = useCallback(
    async (credentials, { requireRole, roleError } = {}) => {
      const response = await authApi.login(credentials);
      if (requireRole && response.data.user.role !== requireRole) {
        throw new Error(roleError ?? 'This account does not have access to this area.');
      }
      persistSession(response.data.token, response.data.user);
      return response.data.user;
    },
    [persistSession]
  );

  /**
   * Social sign-in. The browser only ever forwards the provider's token; the
   * server verifies it and answers with the same JWT + user as /auth/login.
   */
  const loginWithProvider = useCallback(
    async (provider, payload) => {
      const request = provider === 'google' ? authApi.google : authApi.apple;
      const response = await request(payload);
      persistSession(response.data.token, response.data.user);
      return response.data.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      const response = await authApi.register(payload);
      persistSession(response.data.token, response.data.user);
      return response.data.user;
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout is best-effort: the client session is cleared either way.
    }
    clearSession();
  }, [clearSession]);

  const updateUser = useCallback((nextUser) => {
    writeJson(STORAGE_KEYS.user, nextUser);
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === ROLES.ADMIN,
      login,
      loginWithProvider,
      register,
      logout,
      updateUser,
    }),
    [user, initializing, login, loginWithProvider, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};

export default AuthContext;
