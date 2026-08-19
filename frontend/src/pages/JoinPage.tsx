import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useJoinProject } from '@/hooks/use-api';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

export function JoinPage() {
  const { token = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const joinMutation = useJoinProject();
  const [error, setError] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || !token) return;
    attempted.current = true;
    joinMutation.mutate(token, {
      onSuccess: (project) => navigate(`/projects/${project.id}`, { replace: true }),
      onError: () => setError(true),
    });
  }, [token, joinMutation, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">{t('join.failed')}</p>
        <Button variant="outline" onClick={() => navigate('/projects', { replace: true })}>
          {t('join.back_to_projects')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <Spinner className="size-6" />
      <p className="text-sm text-muted-foreground">{t('join.joining')}</p>
    </div>
  );
}
