'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

function getBaseApiUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API || '';
  if (!rawBaseUrl) {
    return '';
  }
  return rawBaseUrl.replace(/\/+$/, '');
}

interface UserData {
  userId: string;
  companyId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailVerified: boolean;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  accessToken: string | null;
  role: string | null;
  login: () => void;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Check for existing tokens on mount
      const storedToken = localStorage.getItem('accessToken');
      const storedUserData = localStorage.getItem('userData');
      const storedRole = localStorage.getItem('userRole');

      if (storedToken && storedUserData) {
        try {
          // Check if token is expired
          const expiresAt = localStorage.getItem('accessTokenExpiresAt');
          if (expiresAt && new Date(expiresAt) > new Date()) {
            setAccessToken(storedToken);
            setUser(JSON.parse(storedUserData));
            setRole(storedRole || 'exporter');
            setIsAuthenticated(true);
          } else {
            // Token expired, try to refresh
            const refreshSuccess = await refreshAccessToken();
            if (refreshSuccess) {
              const newToken = localStorage.getItem('accessToken');
              const newUserData = localStorage.getItem('userData');
              const newRole = localStorage.getItem('userRole');
              if (newToken && newUserData) {
                setAccessToken(newToken);
                setUser(JSON.parse(newUserData));
                setRole(newRole || 'exporter');
                setIsAuthenticated(true);
              }
            }
          }
        } catch {
          clearAuthData();
        }
      }
    };

    checkAuth();
  }, []);

  // Periodically check if token has expired
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiration = async () => {
      const expiresAt = localStorage.getItem('accessTokenExpiresAt');
      if (expiresAt && new Date(expiresAt) <= new Date()) {
        // Token expired, try to refresh
        const refreshSuccess = await refreshAccessToken();
        if (!refreshSuccess) {
          // Refresh failed, redirect to login
          clearAuthData(true);
        }
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiration, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const clearAuthData = (redirectToLogin = false) => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessTokenExpiresAt');
    localStorage.removeItem('refreshTokenExpiresAt');
    localStorage.removeItem('userId');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    setAccessToken(null);
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);

    if (redirectToLogin) {
      window.location.href = '/login';
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    if (isRefreshing) return false;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      clearAuthData(true);
      return false;
    }

    setIsRefreshing(true);
    try {
      const baseUrl = getBaseApiUrl();
      if (!baseUrl) {
        clearAuthData(true);
        return false;
      }

      const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        // Store new tokens
        localStorage.setItem('accessToken', result.data.accessToken);
        localStorage.setItem('refreshToken', result.data.refreshToken);
        localStorage.setItem('accessTokenExpiresAt', result.data.accessTokenExpiresAt);
        localStorage.setItem('refreshTokenExpiresAt', result.data.refreshTokenExpiresAt);
        
        setAccessToken(result.data.accessToken);
        return true;
      } else {
        // Refresh failed, clear auth and redirect
        clearAuthData(true);
        return false;
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
      clearAuthData(true);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const login = () => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUserData = localStorage.getItem('userData');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedToken && storedUserData) {
      try {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUserData));
        setRole(storedRole || 'exporter');
        setIsAuthenticated(true);
      } catch {
        clearAuthData();
      }
    }
  };

  const logout = () => {
    clearAuthData();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, accessToken, role, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
