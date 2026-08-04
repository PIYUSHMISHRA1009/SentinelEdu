/**
 * Authentication context provider
 * Manages user authentication state, login/logout, and role-based access
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { User, UserRole } from '@/api/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, role: UserRole) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const clearQueryCache = () => {
    try {
      queryClient.clear();
    } catch (cacheError) {
      console.warn('Unable to clear cached queries on auth transition', cacheError);
    }
  };

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedRole = localStorage.getItem('user_role') as UserRole | null;
    const storedUser = localStorage.getItem('user_data');

    if (storedToken && storedRole && storedUser) {
      setToken(storedToken);
      setRole(storedRole);
      setUser(JSON.parse(storedUser));
      // Validate token with backend; if invalid, clear auth
      axiosClient
        .get(API_ENDPOINTS.VALIDATE)
        .catch(() => {
          setToken(null);
          setRole(null);
          setUser(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_data');
        })
        .finally(() => setIsLoading(false));
      return;
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, newRole: UserRole) => {
    // Clear any prior cache tied to a different identity
  clearQueryCache();
    setToken(newToken);
    setUser(newUser);
    setRole(newRole);

    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user_role', newRole);
    localStorage.setItem('user_data', JSON.stringify(newUser));
  };

  const logout = () => {
  clearQueryCache();
    setToken(null);
    setUser(null);
    setRole(null);

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_data');
  };

  const value: AuthContextType = {
    user,
    token,
    role,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
