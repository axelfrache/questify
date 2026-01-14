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

  const clearAuthState = () => {
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userDto = await api.getCurrentUser();
        setUser({
          id: userDto.id,
          email: userDto.email,
          username: userDto.username,
          profilePictureUrl: userDto.profilePictureUrl,
        });
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    api.setOnUnauthorized(() => {
      clearAuthState();
    });

    initAuth();
  }, []);

  const handleAuthResponse = (response: AuthResponse, email: string) => {
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
    await api.logout();
    clearAuthState();
  };

  const updateProfilePicture = (url: string | null) => {
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
