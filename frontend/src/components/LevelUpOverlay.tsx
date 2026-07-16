import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProgression } from '@/hooks/use-api';
import { NumberTicker } from '@/components/ui/number-ticker';
import { GradeBadge } from '@/components/ui/grade-badge';
import { Button } from '@/components/ui/button';
import { fireLevelUpConfetti } from '@/lib/celebration';

interface LevelUpEvent {
  fromLevel: number;
  toLevel: number;
  grade: string;
  gradeLabel: string;
  gradeChanged: boolean;
}

export function LevelUpOverlay() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: progression } = useUserProgression(user?.id);
  const previousRef = useRef<{ level: number; grade: string } | null>(null);
  const [event, setEvent] = useState<LevelUpEvent | null>(null);

  useEffect(() => {
    if (!progression) return;
    const previous = previousRef.current;
    previousRef.current = { level: progression.level, grade: progression.grade };

    if (previous && progression.level > previous.level) {
      setEvent({
        fromLevel: previous.level,
        toLevel: progression.level,
        grade: progression.grade,
        gradeLabel: progression.gradeLabel,
        gradeChanged: progression.grade !== previous.grade,
      });
      fireLevelUpConfetti();
    }
  }, [progression]);

  useEffect(() => {
    if (!event) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEvent(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [event]);

  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-background/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => setEvent(null)}
      role="dialog"
      aria-modal="true"
      aria-label={t('level_up.title')}
    >
      <div
        className="mx-4 flex w-full max-w-sm flex-col items-center gap-5 rounded-lg border bg-card px-8 py-10 text-center shadow-lg animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {t('level_up.title')}
        </p>

        <div className="flex items-baseline gap-2">
          <span className="text-lg text-muted-foreground">Lvl</span>
          <NumberTicker
            value={event.toLevel}
            startValue={event.fromLevel}
            className="font-mono text-6xl font-semibold tracking-tight text-foreground"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          {event.gradeChanged && (
            <p className="text-xs text-muted-foreground">{t('level_up.new_grade')}</p>
          )}
          <GradeBadge grade={event.gradeLabel} />
        </div>

        <Button variant="outline" size="sm" onClick={() => setEvent(null)} className="mt-1">
          {t('level_up.continue')}
        </Button>
      </div>
    </div>
  );
}
