import { createContext, useContext, useState } from 'react';
import { api } from '../api/axios';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (username, password) => {
    const { data } = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

// Keep this hook export alongside AuthProvider for compatibility with existing imports.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx);