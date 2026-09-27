import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('safevoyage_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('safevoyage_token') && localStorage.getItem('safevoyage_auth_user'));
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('safevoyage_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('safevoyage_auth_user');
      localStorage.removeItem('safevoyage_token');
    }
  }, [user]);

  // Requirement 1: Strict User Login (No demo accounts, no bypasses)
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.token) {
        localStorage.setItem('safevoyage_token', res.token);
      }
      if (res.user) {
        localStorage.setItem('safevoyage_auth_user', JSON.stringify(res.user));
        setUser(res.user);
        setIsAuthenticated(true);
      }
      return { success: true };
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('safevoyage_token');
      localStorage.removeItem('safevoyage_auth_user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Requirement 1: Registration does NOT automatically log in
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.register(userData);
      return {
        success: true,
        message: res.message || 'Registration successful. Please log in to continue.'
      };
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('safevoyage_token');
    localStorage.removeItem('safevoyage_auth_user');
  };

  const updateProfile = async (updates) => {
    try {
      const res = await api.updateProfile(updates);
      const updatedUser = res.user || res.profile || (user ? { ...user, ...updates } : updates);
      setUser(updatedUser);
      localStorage.setItem('safevoyage_auth_user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser, message: res.message || 'Profile updated successfully.' };
    } catch (err) {
      console.warn('updateProfile API error:', err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
