import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);
const USER_CACHE_KEY = 'vfinance_user_cache';

const getStoredToken = () => localStorage.getItem('vfinance_token') || sessionStorage.getItem('vfinance_token');

const loadCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY) || sessionStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_error) {
    return null;
  }
};

const saveCachedUser = (user, remember = true) => {
  const payload = JSON.stringify(user || null);
  if (remember) {
    localStorage.setItem(USER_CACHE_KEY, payload);
    sessionStorage.removeItem(USER_CACHE_KEY);
  } else {
    sessionStorage.setItem(USER_CACHE_KEY, payload);
    localStorage.removeItem(USER_CACHE_KEY);
  }
};

const clearCachedUser = () => {
  localStorage.removeItem(USER_CACHE_KEY);
  sessionStorage.removeItem(USER_CACHE_KEY);
};

const extractUserPayload = (responseData) => {
  if (!responseData || typeof responseData !== 'object') return null;

  // Support both shapes:
  // 1) { user: {...} } and 2) {...userFields}
  if (responseData.user && typeof responseData.user === 'object') {
    return responseData.user;
  }

  if (responseData.id || responseData._id || responseData.email) {
    return responseData;
  }

  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => loadCachedUser());
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    const response = await api.get('/auth/me');
    const payload = extractUserPayload(response.data);
    if (!payload) {
      throw new Error('Unable to parse authenticated user payload');
    }
    setUser(payload);

    const remember = Boolean(localStorage.getItem('vfinance_token'));
    saveCachedUser(payload, remember);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        clearCachedUser();
        setLoading(false);
        return;
      }

      try {
        await refreshMe();
      } catch (requestError) {
        const status = requestError?.response?.status;

        // Only force logout when token is actually invalid/expired.
        if (status === 401 || status === 403) {
          localStorage.removeItem('vfinance_token');
          sessionStorage.removeItem('vfinance_token');
          clearCachedUser();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email, password, remember = true, role = null) => {
    const response = await api.post('/auth/login', {
      email,
      password,
      ...(role ? { role } : {}),
    });
    const payload = extractUserPayload(response.data);

    if (remember) {
      localStorage.setItem('vfinance_token', response.data.token);
      sessionStorage.removeItem('vfinance_token');
      saveCachedUser(payload, true);
    } else {
      sessionStorage.setItem('vfinance_token', response.data.token);
      localStorage.removeItem('vfinance_token');
      saveCachedUser(payload, false);
    }
    setUser(payload);
    return payload;
  };

  const register = async (name, email, password, role = 'student', remember = true) => {
    const response = await api.post('/auth/register', { name, email, password, role });
    const payload = extractUserPayload(response.data);

    if (remember) {
      localStorage.setItem('vfinance_token', response.data.token);
      sessionStorage.removeItem('vfinance_token');
      saveCachedUser(payload, true);
    } else {
      sessionStorage.setItem('vfinance_token', response.data.token);
      localStorage.removeItem('vfinance_token');
      saveCachedUser(payload, false);
    }
    setUser(payload);
    return payload;
  };

  const logout = () => {
    localStorage.removeItem('vfinance_token');
    sessionStorage.removeItem('vfinance_token');
    clearCachedUser();
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
