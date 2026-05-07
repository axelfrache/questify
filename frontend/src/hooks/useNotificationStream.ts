import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-api';
import { useAuth } from '@/contexts/AuthContext';
import { isOidcEnabled } from '@/lib/oidc';

export function useNotificationStream() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isOidcEnabled()) return;

    const apiBase = import.meta.env.VITE_API_URL || '';
    const source = new EventSource(`${apiBase}/api/notifications/stream`, {
      withCredentials: true,
    });

    source.addEventListener('notification', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    });

    return () => {
      source.close();
    };
  }, [isAuthenticated, queryClient]);
}
