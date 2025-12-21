import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';
import type { AuthResponse } from '@/lib/api';

interface User {
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userEmail = localStorage.getItem('userEmail');
    const username = localStorage.getItem('username');
    if (accessToken && userEmail && username) {
      setUser({ email: userEmail, username });
    }
    setIsLoading(false);
  }, []);

  const handleAuthResponse = (response: AuthResponse, email: string) => {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('username', response.username);
    setUser({ email, username: response.username });
  };

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    handleAuthResponse(response, email);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await api.register({ username, email, password });
    handleAuthResponse(response, email);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch {
        // Ignore logout errors
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
