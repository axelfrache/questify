import { createContext, useCallback, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, type UserDto } from '@/lib/api';
import { clearOidcSession, isOidcEnabled, loginWithOidcPassword } from '@/lib/oidc';
import { queryKeys } from '@/hooks/use-api';

interface User {
  id: string;
  email: string;
  username: string;
  bio?: string | null;
  profilePictureUrl: string | null;
  role: 'USER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfilePicture: (url: string | null) => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toAuthUser(userDto: UserDto | null | undefined): User | null {
  if (!userDto) return null;
  return {
    id: userDto.id,
    email: userDto.email,
    username: userDto.username,
    bio: userDto.bio,
    profilePictureUrl: userDto.profilePictureUrl,
    role: userDto.role,
  };
}

function isAccountAlreadyRegistered(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 400 &&
    error.message.toLowerCase().includes('already in use')
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const clearSessionQueries = useCallback(() => {
    queryClient.setQueryData(queryKeys.auth.me, null);
    queryClient.removeQueries({
      predicate: ({ queryKey }) => queryKey[0] !== 'auth',
    });
  }, [queryClient]);

  const { data: currentUser, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.getCurrentUser(),
    enabled: !isOidcEnabled() || typeof window !== 'undefined',
    retry: false,
  });

  useEffect(() => {
    api.setOnUnauthorized(() => {
      clearSessionQueries();
    });
  }, [clearSessionQueries]);

  const refreshCurrentUser = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    await queryClient.fetchQuery({
      queryKey: queryKeys.auth.me,
      queryFn: () => api.getCurrentUser(),
      retry: false,
    });
  };

  const login = async (email: string, password: string) => {
    if (isOidcEnabled()) {
      queryClient.removeQueries({
        predicate: ({ queryKey }) => queryKey[0] !== 'auth',
      });
      await loginWithOidcPassword(email, password);
      await refreshCurrentUser();
      return;
    }
    queryClient.removeQueries({
      predicate: ({ queryKey }) => queryKey[0] !== 'auth',
    });
    await api.login({ email, password });
    await refreshCurrentUser();
  };

  const register = async (username: string, email: string, password: string, firstName: string, lastName: string) => {
    if (isOidcEnabled()) {
      queryClient.removeQueries({
        predicate: ({ queryKey }) => queryKey[0] !== 'auth',
      });
      let accountAlreadyExists = false;
      try {
        await api.register({ username, email, password, firstName, lastName });
      } catch (err) {
        if (isAccountAlreadyRegistered(err)) {
          accountAlreadyExists = true;
        } else {
          throw err;
        }
      }
      try {
        await loginWithOidcPassword(email, password);
      } catch (err) {
        if (accountAlreadyExists) {
          throw new Error('An account already exists with this email. Please log in.');
        }
        throw err;
      }
      await refreshCurrentUser();
      return;
    }
    queryClient.removeQueries({
      predicate: ({ queryKey }) => queryKey[0] !== 'auth',
    });
    await api.register({ username, email, password, firstName, lastName });
    await refreshCurrentUser();
  };

  const logout = async () => {
    if (isOidcEnabled()) {
      clearOidcSession();
      clearSessionQueries();
      return;
    }
    clearOidcSession();
    await api.logout();
    clearSessionQueries();
  };

  const updateProfilePicture = (url: string | null) => {
    queryClient.setQueryData<UserDto | null>(queryKeys.auth.me, (prev) =>
      prev ? { ...prev, profilePictureUrl: url } : prev
    );
  };

  const updateUser = (data: Partial<User>) => {
    queryClient.setQueryData<UserDto | null>(queryKeys.auth.me, (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        email: data.email ?? prev.email,
        username: data.username ?? prev.username,
        bio: data.bio ?? prev.bio,
        profilePictureUrl: data.profilePictureUrl ?? prev.profilePictureUrl,
        role: data.role ?? prev.role,
      };
    });
  };

  const user = toAuthUser(currentUser);

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
        updateUser,
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
