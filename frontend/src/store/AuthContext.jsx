import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  const authenticate = async (action, details) => {
    const response = await action(details);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const value = useMemo(() => ({
    user,
    loading,
    login: (details) => authenticate(api.login, details),
    signup: (details) => authenticate(api.signup, details),
    logout: async () => {
      try { await api.logout(); } finally { clearToken(); setUser(null); }
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
