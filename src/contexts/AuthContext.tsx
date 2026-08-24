'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing tokens on mount
    const storedToken = localStorage.getItem('accessToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (storedToken && storedUserData) {
      try {
        // Check if token is expired
        const expiresAt = localStorage.getItem('accessTokenExpiresAt');
        if (expiresAt && new Date(expiresAt) > new Date()) {
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUserData));
          setIsAuthenticated(true);
        } else {
          // Token expired, clear storage
          clearAuthData();
        }
      } catch {
        clearAuthData();
      }
    }
  }, []);

  // Periodically check if token has expired
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiration = () => {
      const expiresAt = localStorage.getItem('accessTokenExpiresAt');
      if (expiresAt && new Date(expiresAt) <= new Date()) {
        // Token expired, log out
        clearAuthData();
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiration, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessTokenExpiresAt');
    localStorage.removeItem('refreshTokenExpiresAt');
    localStorage.removeItem('userId');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userData');
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const login = () => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (storedToken && storedUserData) {
      try {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUserData));
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
    <AuthContext.Provider value={{ isAuthenticated, user, accessToken, login, logout }}>
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
