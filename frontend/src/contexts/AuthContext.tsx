import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';
import type { AuthResponse } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  profilePictureUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfilePicture: (url: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const username = localStorage.getItem('username');
    const profilePictureUrl = localStorage.getItem('profilePictureUrl');
    if (accessToken && userEmail && username && userId) {
      setUser({
        id: userId,
        email: userEmail,
        username,
        profilePictureUrl: profilePictureUrl || null,
      });
    }
    setIsLoading(false);
  }, []);

  const handleAuthResponse = (response: AuthResponse, email: string) => {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('userId', response.userId);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('username', response.username);
    if (response.profilePictureUrl) {
      localStorage.setItem('profilePictureUrl', response.profilePictureUrl);
    } else {
      localStorage.removeItem('profilePictureUrl');
    }
    setUser({
      id: response.userId,
      email,
      username: response.username,
      profilePictureUrl: response.profilePictureUrl,
    });
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
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('profilePictureUrl');
    setUser(null);
  };

  const updateProfilePicture = (url: string | null) => {
    if (url) {
      localStorage.setItem('profilePictureUrl', url);
    } else {
      localStorage.removeItem('profilePictureUrl');
    }
    setUser((prev) => (prev ? { ...prev, profilePictureUrl: url } : null));
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
        updateProfilePicture,
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
