import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeOidcLogin } from '@/lib/oidc';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    completeOidcLogin()
      .then((returnTo) => navigate(returnTo, { replace: true }))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      });
  }, [navigate]);

  if (error) {
    return <div className="flex min-h-svh items-center justify-center">{error}</div>;
  }

  return <div className="flex min-h-svh items-center justify-center">Signing you in...</div>;
}
