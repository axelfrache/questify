import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { completeOidcLogin, OidcContextMissingError, startOidcLogin } from '@/lib/oidc';
import { queryKeys } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [error, setError] = useState<'context' | 'authentication' | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const completion = useRef<Promise<string> | null>(null);

  useEffect(() => {
    let active = true;
    completion.current ??= completeOidcLogin().then(async (returnTo) => {
      await queryClient.fetchQuery({
        queryKey: queryKeys.auth.me,
        queryFn: () => api.getCurrentUser(),
        staleTime: 0,
        retry: false,
      });
      return returnTo;
    });
    completion.current
      .then((returnTo) => {
        if (active) navigate(returnTo, { replace: true });
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof OidcContextMissingError ? 'context' : 'authentication');
        }
      });
    return () => {
      active = false;
    };
  }, [navigate, queryClient]);

  const resumeLogin = async () => {
    setIsRedirecting(true);
    try {
      await startOidcLogin('/inbox');
    } catch {
      setIsRedirecting(false);
      setError('authentication');
    }
  };

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <p role="alert">
          {t(error === 'context' ? 'login.context_missing' : 'login.callback_failed')}
        </p>
        {error === 'context' && (
          <Button onClick={resumeLogin} disabled={isRedirecting}>
            {t(isRedirecting ? 'login.redirecting' : 'login.continue_sign_in')}
          </Button>
        )}
        <Link to="/login" className="underline">
          {t('login.back_to_login')}
        </Link>
      </div>
    );
  }

  return <div className="flex min-h-svh items-center justify-center">{t('login.signing_in')}</div>;
}
