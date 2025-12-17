import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app start
    const storedToken = localStorage.getItem('netflow_token');
    const storedUser = localStorage.getItem('netflow_user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Verify the token is still valid by making a test API call
        verifyToken(storedToken, userData);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        clearInvalidAuth();
      }
    }
    
    setIsLoading(false);
  }, []);

  const verifyToken = async (token: string, userData: User) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setToken(token);
        setUser(userData);
      } else {
        clearInvalidAuth();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      clearInvalidAuth();
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Login failed');
        return false;
      }

      const data = await response.json();
      
      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        
        // Store in localStorage
        localStorage.setItem('netflow_token', data.token);
        localStorage.setItem('netflow_user', JSON.stringify(data.user));
        
        toast.success('Login successful');
        return true;
      } else {
        toast.error('Invalid response from server');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Please check if the backend server is running.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('netflow_token');
    localStorage.removeItem('netflow_user');
    toast.success('Logged out successfully');
  };

  // Add a function to clear invalid tokens
  const clearInvalidAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('netflow_token');
    localStorage.removeItem('netflow_user');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};