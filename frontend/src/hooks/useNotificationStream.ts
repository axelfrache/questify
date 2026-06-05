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

    const apiBase = import.meta.env.VITE_API_URL || '';
    let streamUrl = `${apiBase}/api/notifications/stream`;

    if (isOidcEnabled()) {
      const token = sessionStorage.getItem('questify.oidc.access_token');
      if (!token) return;
      streamUrl = `${streamUrl}?token=${encodeURIComponent(token)}`;
    }

    const source = new EventSource(streamUrl, { withCredentials: true });

    source.addEventListener('notification', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    });

    return () => {
      source.close();
    };
  }, [isAuthenticated, queryClient]);
}
