import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    const response = await api.get('/auth/me');
    setUser(response.data.user);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('vfinance_token') || sessionStorage.getItem('vfinance_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await refreshMe();
      } catch (_error) {
        localStorage.removeItem('vfinance_token');
        sessionStorage.removeItem('vfinance_token');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email, password, remember = true) => {
    const response = await api.post('/auth/login', { email, password });
    if (remember) {
      localStorage.setItem('vfinance_token', response.data.token);
      sessionStorage.removeItem('vfinance_token');
    } else {
      sessionStorage.setItem('vfinance_token', response.data.token);
      localStorage.removeItem('vfinance_token');
    }
    setUser(response.data.user);
  };

  const register = async (name, email, password, remember = true) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (remember) {
      localStorage.setItem('vfinance_token', response.data.token);
      sessionStorage.removeItem('vfinance_token');
    } else {
      sessionStorage.setItem('vfinance_token', response.data.token);
      localStorage.removeItem('vfinance_token');
    }
    setUser(response.data.user);
  };

  const logout = () => {
    localStorage.removeItem('vfinance_token');
    sessionStorage.removeItem('vfinance_token');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, register, logout, refreshMe }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
