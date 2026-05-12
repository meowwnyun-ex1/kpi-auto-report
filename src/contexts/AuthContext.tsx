import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/shared/utils';
import { getApiUrl } from '../config/api';
import { createSessionTimeoutChecker } from '@/shared/utils';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  name: string;
  role: string;
  avatar?: string;
  department_id?: string;
  department_name?: string;
  company_name?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  extendSession: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const validateToken = useCallback(async (token: string, isRefresh = false, retryCount = 0) => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data.user;
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          storage.setUserData(userData);
        } else {
          // Only clear auth on non-refresh validation
          if (!isRefresh) {
            storage.clearAuthData();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        // For background refresh, don't clear auth on 401 - let user continue with cached data
        if (isRefresh) {
          console.warn('Background token validation failed, keeping session:', response.status);
          return;
        }

        // For blocking validation, handle 401 by clearing auth
        if (response.status === 401) {
          storage.clearAuthData();
          setUser(null);
          setIsAuthenticated(false);
          setValidationAttempted(false);
          const currentPath = window.location.pathname;
          const loginPath = import.meta.env.PROD ? '/kpi-auto-report/login' : '/login';
          if (currentPath !== loginPath) {
            navigateRef.current('/login');
          }
          return;
        } else if (response.status === 500) {
          if (retryCount < 2) {
            const delay = 1000 * (retryCount + 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return validateToken(token, isRefresh, retryCount + 1);
          }
          storage.clearAuthData();
          setUser(null);
          setIsAuthenticated(false);
        } else {
          storage.clearAuthData();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      // For background refresh, don't clear auth on network errors
      if (isRefresh) {
        console.warn('Background token validation network error:', error);
        return;
      }

      // For blocking validation, clear auth on errors
      storage.clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = storage.getAuthToken();

    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // Simply restore from localStorage without validation
    // This prevents logout on refresh when API is temporarily unavailable
    try {
      const userData = storage.getUserData();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (e) {
      // Ignore storage errors
      storage.clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const onTimeout = () => {
      console.warn('Session timeout reached - checking token validity');
      const token = storage.getAuthToken();
      if (token) {
        validateToken(token, false).catch((error) => {
          if (!error.message.includes('fetch') && !error.message.includes('network')) {
            console.warn('Session truly expired - logging out user');
            storage.clearAuthData();
            setUser(null);
            setIsAuthenticated(false);
          }
        });
      } else {
        storage.clearAuthData();
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    const sessionChecker = createSessionTimeoutChecker(onTimeout);
    sessionChecker.start();

    return () => {
      sessionChecker.stop();
    };
  }, [isAuthenticated]);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        storage.setAuthToken(data.data.token);
        storage.setLoginTime();
        storage.setUserData(data.data.user);
        setUser(data.data.user);
        setIsAuthenticated(true);
        setValidationAttempted(false); // Reset validation flag on successful login
        return { success: true };
      } else {
        try {
          await response.json();
          if (response.status === 401) {
            return { success: false, error: 'Invalid credentials' };
          } else if (response.status === 400) {
            return { success: false, error: 'Missing credentials' };
          } else if (response.status === 500) {
            return { success: false, error: 'Server error' };
          } else {
            return { success: false, error: 'Login failed' };
          }
        } catch {
          if (response.status === 401) {
            return { success: false, error: 'Invalid credentials' };
          }
          return { success: false, error: 'Login failed' };
        }
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    storage.clearAuthData();
    setUser(null);
    setIsAuthenticated(false);
    setValidationAttempted(false); // Reset validation flag on logout
  };

  const extendSession = useCallback(() => {
    // Extend the session by updating the login time
    if (isAuthenticated) {
      storage.extendSession();
      console.log('Session extended for another 16 hours');
    }
  }, [isAuthenticated]);

  const refreshUser = useCallback(async () => {
    const token = storage.getAuthToken();
    if (!token) {
      storage.clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    await validateToken(token, false);
  }, [validateToken]);

  // Auto-extend session on user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastActivityTime = Date.now();
    const ACTIVITY_THROTTLE = 15 * 60 * 1000; // 15 minutes

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityTime >= ACTIVITY_THROTTLE) {
        extendSession();
        lastActivityTime = now;
      }
    };

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, logout, extendSession, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
