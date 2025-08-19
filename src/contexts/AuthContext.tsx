// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { socketManager } from '@/lib/socket';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  permissions: string[];
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  walletAddress?: string;
  isWalletLinked: boolean;
  isBlockchainRegistered: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string } | { walletAddress: string; signature: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        setLoading(false);
        return;
      }

      apiClient.setToken(token);
      const response = await apiClient.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data as User);
        
        // Connect to Socket.IO for real-time features
        socketManager.connect(token);
        socketManager.subscribeToAlerts();
        socketManager.subscribeToThreats();
        socketManager.subscribeToLogs();
      } else {
        // Invalid token, clear it
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear invalid tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string } | { walletAddress: string; signature: string }) => {
    setLoading(true);
    try {
      const response = await apiClient.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        
        // Connect to Socket.IO
        socketManager.connect(response.data.tokens.accessToken);
        socketManager.subscribeToAlerts();
        socketManager.subscribeToThreats();
        socketManager.subscribeToLogs();
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.logout();
      socketManager.disconnect();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const response = await apiClient.register(userData);
      
      if (response.success && response.data) {
        setUser((response.data as any).user);
        
        // Connect to Socket.IO
        socketManager.connect((response.data as any).tokens.accessToken);
        socketManager.subscribeToAlerts();
        socketManager.subscribeToThreats();
        socketManager.subscribeToLogs();
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      const response = await apiClient.updateProfile(profileData);
      
      if (response.success && response.data) {
        setUser(response.data as User);
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
