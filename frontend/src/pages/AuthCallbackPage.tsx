import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { completeOidcLogin } from '@/lib/oidc';
import { queryKeys } from '@/hooks/use-api';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [hasError, setHasError] = useState(false);
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
      .catch(() => {
        if (active) setHasError(true);
      });
    return () => {
      active = false;
    };
  }, [navigate, queryClient]);

  if (hasError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <p role="alert">{t('login.callback_failed')}</p>
        <Link to="/login" className="underline">
          {t('login.back_to_login')}
        </Link>
      </div>
    );
  }

  return <div className="flex min-h-svh items-center justify-center">{t('login.signing_in')}</div>;
}
