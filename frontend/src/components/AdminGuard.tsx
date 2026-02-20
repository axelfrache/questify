import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'ADMIN') {
      alert("Access Denied: You don't have permission to view admin settings.");
    }
  }, [isLoading, user]);

  if (isLoading) {
    return <div className="flex min-h-svh items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/settings" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
