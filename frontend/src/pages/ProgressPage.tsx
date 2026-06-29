import { useUserProgression, useStatsOverview } from '@/hooks/use-api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, Star, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRADES = [
  {
    name: 'Flint',
    minLevel: 1,
    questsRequired: 0,
    tooltip: 'Every spark begins here. Strike the stone.',
  },
  {
    name: 'Iron',
    minLevel: 6,
    questsRequired: 10,
    tooltip: 'Solid. Reliable. You hold your ground.',
  },
  {
    name: 'Gold',
    minLevel: 11,
    questsRequired: 25,
    tooltip: "You've earned something precious. Don't stop now.",
  },
  {
    name: 'Obsidian',
    minLevel: 21,
    questsRequired: 60,
    tooltip: 'Forged under volcanic pressure. Sharp, dark, unstoppable.',
  },
  {
    name: 'Sapphire',
    minLevel: 36,
    questsRequired: 150,
    tooltip: 'Rare and brilliant. You are not like the others.',
  },
  {
    name: 'Diamond',
    minLevel: 51,
    questsRequired: 400,
    tooltip: 'Formed under the greatest pressure. Nothing can break you.',
  },
];

function getGradeIndex(gradeLabel: string) {
  return GRADES.findIndex((g) => g.name === gradeLabel);
}

function getNextGrade(currentGrade: string) {
  const idx = getGradeIndex(currentGrade);
  if (idx === -1 || idx >= GRADES.length - 1) return null;
  return GRADES[idx + 1];
}

function getGradeProgress(level: number, currentGrade: string) {
  const grade = GRADES.find((g) => g.name === currentGrade);
  if (!grade) return 0;
  const next = getNextGrade(currentGrade);
  if (!next) return 100;
  const range = next.minLevel - grade.minLevel;
  return Math.min(100, Math.round(((level - grade.minLevel) / range) * 100));
}

export function ProgressPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { data: progression, isLoading: isLoadingProgression } = useUserProgression(
    currentUser?.id
  );
  const { data: statsOverview, isLoading: isLoadingStats } = useStatsOverview();

  const isLoading = isLoadingProgression || isLoadingStats;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-64" />
        <Skeleton className="h-36 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const currentGrade = progression?.gradeLabel || 'Initiate';
  const currentLevel = progression?.level || 1;
  const totalXp = progression?.totalXp || 0;
  const currentGradeIndex = getGradeIndex(currentGrade);
  const nextGrade = getNextGrade(currentGrade);
  const gradeProgress = getGradeProgress(currentLevel, currentGrade);
  const totalCompleted = statsOverview?.totalCompleted || 0;

  const levelToNextLevel = progression?.currentLevelXp || 0;
  const xpNeededNextLevel = progression?.nextLevelXp || 100;
  const xpProgressPct = progression?.progressPercent || 0;

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('progress.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('progress.description')}</p>
      </div>

      {/* Grade journey card */}
      <div className="rounded-lg border bg-card p-5">
        <div className="mb-5 flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-medium">{t('progress.grade_journey')}</span>
        </div>

        <TooltipProvider delayDuration={150}>
          <div className="flex w-full items-start py-1">
            {GRADES.map((grade, index) => {
              const isPast = index < currentGradeIndex;
              const isCurrent = index === currentGradeIndex;

              return (
                <div
                  key={grade.name}
                  className={cn(
                    'flex items-start',
                    index < GRADES.length - 1 ? 'flex-1' : 'flex-shrink-0'
                  )}
                >
                  {/* Node + label — always centered */}
                  <div className="flex flex-shrink-0 flex-col items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'flex h-9 w-9 cursor-default items-center justify-center rounded-full border-2 font-mono text-xs font-medium transition-all',
                            isCurrent &&
                              'border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_oklch(0.56_0.18_275_/_0.15)]',
                            isPast && 'border-muted-foreground/40 bg-muted text-muted-foreground',
                            !isCurrent &&
                              !isPast &&
                              'border-border bg-muted/30 text-muted-foreground'
                          )}
                        >
                          {isCurrent ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          ) : (
                            grade.minLevel
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-[180px] text-center text-xs italic"
                      >
                        {t('progress.grades.' + grade.name + '_tooltip')}
                      </TooltipContent>
                    </Tooltip>
                    <span
                      className={cn(
                        'text-center text-[10px] leading-tight',
                        isCurrent && 'font-medium text-foreground',
                        !isCurrent && 'text-muted-foreground'
                      )}
                    >
                      {t('progress.grades.' + grade.name)}
                    </span>
                  </div>

                  {/* Arrow to next node — mt-[11px] centers chevron on the h-9 circle */}
                  {index < GRADES.length - 1 && (
                    <div className="flex flex-1 items-start justify-center mt-[11px]">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* Two stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Current grade */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('progress.current_grade')}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-3xl font-medium tracking-tight">
              {t('progress.grades.' + currentGrade)}
            </span>
            <span className="text-sm text-muted-foreground">
              {t('progress.level', { level: currentLevel })}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <Progress value={gradeProgress} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {t('progress.grade_percent', { percent: gradeProgress })}
            </p>
          </div>
        </div>

        {/* Total experience */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('progress.total_experience')}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-3xl font-medium tracking-tight">
              {totalXp.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">{t('common.xp')}</span>
          </div>
          <div className="mt-3 space-y-1.5">
            <Progress value={xpProgressPct} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {t('progress.level_progress', {
                current: levelToNextLevel,
                needed: xpNeededNextLevel,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Requirements for next grade */}
      {nextGrade && (
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">
                {t('progress.requirements', { grade: t('progress.grades.' + nextGrade.name) })}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {t('progress.complete_both')}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
              {t('progress.remaining', {
                count: [
                  currentLevel < nextGrade.minLevel,
                  nextGrade.questsRequired > 0 && totalCompleted < nextGrade.questsRequired,
                ].filter(Boolean).length,
              })}
            </span>
          </div>

          <div className="space-y-4">
            {/* Level requirement */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm">
                  {t('progress.reach_level', { level: nextGrade.minLevel })}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {t('progress.levels_progress', {
                    current: currentLevel,
                    max: nextGrade.minLevel,
                  })}
                </span>
              </div>
              <Progress
                value={Math.min(100, (currentLevel / nextGrade.minLevel) * 100)}
                className="h-1.5"
              />
            </div>

            {/* Quest requirement */}
            {nextGrade.questsRequired > 0 && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm">
                    {t('progress.complete_quests', { count: nextGrade.questsRequired })}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
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
        </div>
      )}
    </div>
  );
}
