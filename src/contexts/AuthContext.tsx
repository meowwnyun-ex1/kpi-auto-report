import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/shared/utils';
import { getApiUrl } from '../config/api';
import { createSessionTimeoutChecker } from '@/shared/utils/session-manager';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationAttempted, setValidationAttempted] = useState(false);

  const validateToken = async (token: string, isRefresh = false) => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Server returns { success: true, data: user }
        const userData = data.data || data.user;
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          // Store user data in localStorage for offline access
          storage.setUserData(userData);
        } else {
          console.warn('Auth validation: No user data in response');
          // Don't logout immediately, only if it's not a refresh scenario
          if (!isRefresh) {
            storage.clearAuthData();
            setIsAuthenticated(false);
          }
        }
      } else {
        // Handle different error statuses
        if (response.status === 401) {
          console.warn('Auth validation: Token expired or invalid');
          // Only logout on 401 if it's not a refresh scenario
          if (!isRefresh) {
            storage.clearAuthData();
            setIsAuthenticated(false);
          }
        } else if (response.status === 500) {
          console.error('Auth validation: Server error - check JWT_SECRET configuration');
          // Don't logout on server errors, especially during refresh
          if (!isRefresh) {
            storage.clearAuthData();
            setIsAuthenticated(false);
          }
        } else {
          console.warn('Auth validation: Unexpected error status:', response.status);
          // Don't logout on other errors during refresh
          if (!isRefresh) {
            storage.clearAuthData();
            setIsAuthenticated(false);
          }
        }
      }
    } catch (error) {
      console.error('Auth validation: Network or fetch error:', error);
      // During refresh, don't logout on network errors - allow user to continue
      if (!isRefresh) {
        storage.clearAuthData();
        setIsAuthenticated(false);
      } else {
        // On refresh network error, keep user logged in if token exists
        console.log('Network error during refresh - keeping user logged in');
        // Try to load user data from localStorage
        try {
          const userData = storage.getUserData();
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          }
        } catch (e) {
          console.warn('Failed to parse stored user data');
          // Keep authenticated state even without user data
          setIsAuthenticated(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = storage.getAuthToken();

    // If no token at all, set unauthenticated state
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      setValidationAttempted(false);
      return;
    }

    // If token exists, try to load user data and validate in background
    try {
      const userData = storage.getUserData();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);

        // Validate token in background without blocking UI
        if (!validationAttempted) {
          setValidationAttempted(true);
          validateToken(token, true).catch((error) => {
            // If validation fails, check if it's a network error vs auth error
            if (error.message.includes('fetch') || error.message.includes('network')) {
              console.warn('Network error during token validation - keeping user logged in');
              // Keep user logged in on network errors
            } else {
              console.warn('Token validation failed, clearing invalid token:', error);
              storage.clearAuthData();
              setUser(null);
              setIsAuthenticated(false);
              setValidationAttempted(false);
            }
          });
        }
      } else {
        // No stored user data, set basic authenticated state
        setIsAuthenticated(true);
        setLoading(false);
      }
    } catch (e) {
      console.warn('Failed to parse stored user data, setting basic auth state');
      setIsAuthenticated(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const onTimeout = () => {
      console.warn('Session timeout reached - checking token validity');
      // Instead of immediate logout, validate token first
      const token = storage.getAuthToken();
      if (token) {
        validateToken(token, false).catch((error) => {
          // Only logout if it's actually an auth error, not network error
          if (!error.message.includes('fetch') && !error.message.includes('network')) {
            console.warn('Session truly expired - logging out user');
            storage.clearAuthData();
            setUser(null);
            setIsAuthenticated(false);
          }
        });
      } else {
        // No token, logout
        storage.clearAuthData();
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    const cleanup = createSessionTimeoutChecker(onTimeout);

    return cleanup;
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

  const extendSession = () => {
    // Extend the session by updating the login time
    if (isAuthenticated) {
      storage.extendSession();
      console.log('Session extended for another 16 hours');
    }
  };

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
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, extendSession }}>
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
