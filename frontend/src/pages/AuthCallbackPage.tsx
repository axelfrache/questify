import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { completeOidcLogin } from '@/lib/oidc';
import { queryKeys } from '@/hooks/use-api';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    completeOidcLogin()
      .then(async (returnTo) => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
        navigate(returnTo, { replace: true });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      });
  }, [navigate, queryClient]);

  if (error) {
    return <div className="flex min-h-svh items-center justify-center">{error}</div>;
  }

  return <div className="flex min-h-svh items-center justify-center">Signing you in...</div>;
}
