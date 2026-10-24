import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booted, setBooted] = useState(false);
  async function refresh() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
      setBooted(true);
    }
  }
  useEffect(() => {
    refresh();
    const onUnauthorized = () => setUser(null);
    window.addEventListener('sfwr:unauthorized', onUnauthorized);
    return () => window.removeEventListener('sfwr:unauthorized', onUnauthorized);
  }, []);
  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };
  return (
    <Context.Provider value={{ user, setUser, loading, refresh, signOut, booted }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
