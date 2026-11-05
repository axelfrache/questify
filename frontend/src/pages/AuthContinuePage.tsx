import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { startOidcLogin } from '@/lib/oidc';

export function AuthContinuePage() {
  const { t } = useTranslation();
  const [hasError, setHasError] = useState(false);
  const redirect = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let active = true;
    redirect.current ??= startOidcLogin('/inbox');
    redirect.current.catch(() => {
      if (active) setHasError(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <p>{t(hasError ? 'login.redirect_failed' : 'login.redirecting')}</p>
      {hasError && (
        <Link to="/login" className="underline">
          {t('login.back_to_login')}
        </Link>
      )}
    </div>
  );
}
