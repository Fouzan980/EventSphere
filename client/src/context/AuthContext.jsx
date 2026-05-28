import React, { createContext, useState } from 'react';
import axios from 'axios';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return null;
    try {
      return JSON.parse(userInfo);
    } catch (err) {
      console.error('Failed to parse userInfo from localStorage:', err);
      localStorage.removeItem('userInfo');
      return null;
    }
  });

  const getApiUrl = (path) => {
    const base = window.location.pathname.startsWith('/projects/eventsphere') ? '/projects/eventsphere/api' : '/api';
    return `${base}${path}`;
  };

  const login = async (email, password) => {
    const { data } = await axios.post(getApiUrl('/auth/login'), { email, password });
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  };

  const register = async (userData) => {
    const { data } = await axios.post(getApiUrl('/auth/register'), userData);
    // Removed auto-login logic to increase security as per user request
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
    window.location.href = window.location.pathname.startsWith('/projects/eventsphere') ? '/projects/eventsphere' : '/';
  };

  // Call this after a successful profile update to keep UI in sync
  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('userInfo', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};
