import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dental_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('dental_token');
      if (token) {
        try {
          const res = await authAPI.me();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('dental_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.error('[Auth check failed]:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password });
    if (res.success && res.data) {
      localStorage.setItem('dental_token', res.data.token);
      localStorage.setItem('dental_user', JSON.stringify(res.data));
      setUser(res.data);
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.success && res.data) {
      localStorage.setItem('dental_token', res.data.token);
      localStorage.setItem('dental_user', JSON.stringify(res.data));
      setUser(res.data);
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('dental_token');
    localStorage.removeItem('dental_user');
    setUser(null);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
