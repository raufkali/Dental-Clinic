import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const DEFAULT_DOCTOR = {
  name: 'Clinic Doctor',
  username: 'doctor',
  email: 'doctor@clinic.local',
  role: 'Admin'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dental_user');
      return saved ? JSON.parse(saved) : DEFAULT_DOCTOR;
    } catch (e) {
      return DEFAULT_DOCTOR;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setUser(DEFAULT_DOCTOR);
      localStorage.setItem('dental_user', JSON.stringify(DEFAULT_DOCTOR));
    }
    if (!localStorage.getItem('dental_token')) {
      localStorage.setItem('dental_token', 'offline_doctor_token');
    }
  }, [user]);

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
