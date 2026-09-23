import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProgression, useStatsOverview } from '@/hooks/use-api';
import { NumberTicker } from '@/components/ui/number-ticker';
import { GradeBadge } from '@/components/ui/grade-badge';
import { XpBadge } from '@/components/ui/xp-badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { fireLevelUpConfetti } from '@/lib/celebration';
import { getNextGrade } from '@/lib/grade-config';

interface LevelUpEvent {
  fromLevel: number;
  toLevel: number;
  grade: string;
  previousGrade: string;
  gradeChanged: boolean;
  xpGained: number;
  progressPercent: number;
  currentLevelXp: number;
  nextLevelXp: number;
}

export function LevelUpOverlay() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: progression } = useUserProgression(user?.id);
  const { data: statsOverview } = useStatsOverview();
  const previousRef = useRef<{ level: number; grade: string; totalXp: number } | null>(null);
  const [event, setEvent] = useState<LevelUpEvent | null>(null);

  useEffect(() => {
    if (!progression) return;
    const previous = previousRef.current;
    previousRef.current = {
      level: progression.level,
      grade: progression.grade,
      totalXp: progression.totalXp,
    };

    if (previous && progression.level > previous.level) {
      setEvent({
        fromLevel: previous.level,
        toLevel: progression.level,
        grade: progression.grade,
        previousGrade: previous.grade,
        gradeChanged: progression.grade !== previous.grade,
        xpGained: Math.max(0, progression.totalXp - previous.totalXp),
        progressPercent: progression.progressPercent,
        currentLevelXp: progression.currentLevelXp,
        nextLevelXp: progression.nextLevelXp,
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

  const nextGrade = getNextGrade(event.grade);
  const totalCompleted = statsOverview?.totalCompleted || 0;

  const handleClose = () => setEvent(null);
  const handleViewProgress = () => {
    setEvent(null);
    navigate('/progress');
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-background/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('level_up.title')}
    >
      <div
        className="mx-4 w-full max-w-sm overflow-hidden rounded-lg border bg-card text-left shadow-lg animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 border-b border-border px-6 py-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <NumberTicker
              value={event.toLevel}
              startValue={event.fromLevel}
              className="font-mono text-3xl font-semibold tracking-tight text-foreground"
            />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {t('level_up.title')}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight">
              {t('level_up.level_reached', { level: event.toLevel })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4">
          {event.gradeChanged && (
            <div className="flex items-center justify-between rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5">
              <span className="text-xs text-muted-foreground">{t('level_up.new_grade')}</span>
              <div className="flex items-center gap-2">
                <GradeBadge grade={event.previousGrade} className="opacity-50" />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <GradeBadge grade={event.grade} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('level_up.xp_gained')}</span>
            <XpBadge xp={event.xpGained} />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {t('level_up.towards_next_level', { level: event.toLevel + 1 })}
              </span>
              <span className="font-mono text-muted-foreground">
                {event.currentLevelXp} / {event.nextLevelXp}
              </span>
            </div>
            <Progress value={event.progressPercent} className="h-1.5" />
          </div>
        </div>

        {nextGrade && (
          <div className="mx-6 mb-4 flex flex-col gap-3 rounded-md border border-dashed border-border px-3.5 py-3">
            <p className="text-xs font-medium">
              {t('progress.requirements', { grade: t('progress.grades.' + nextGrade.name) })}
            </p>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{t('progress.reach_level', { level: nextGrade.minLevel })}</span>
                <span className="font-mono text-muted-foreground">
                  {t('progress.levels_progress', {
                    current: event.toLevel,
                    max: nextGrade.minLevel,
                  })}
                </span>
              </div>
              <Progress
                value={Math.min(100, (event.toLevel / nextGrade.minLevel) * 100)}
                className="h-1.5"
              />
            </div>

            {nextGrade.questsRequired > 0 && (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{t('progress.complete_quests', { count: nextGrade.questsRequired })}</span>
                  <span className="font-mono text-muted-foreground">
                    {t('progress.quests_progress', {
                      completed: totalCompleted,
                      required: nextGrade.questsRequired,
                    })}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (totalCompleted / nextGrade.questsRequired) * 100)}
                  className="h-1.5"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-3">
          <Button variant="ghost" size="sm" onClick={handleViewProgress}>
            {t('level_up.view_progress')}
          </Button>
          <Button size="sm" onClick={handleClose}>
            {t('level_up.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
