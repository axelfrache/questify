import { useUserProgression, useStatsOverview } from '@/hooks/use-api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShineBorder } from '@/components/ui/shine-border';
import { Zap, Star, Info, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRADES = [
  {
    name: 'Initiate',
    minLevel: 1,
    maxLevel: 5,
    tooltip: 'Every legend begins with a single step.',
  },
  {
    name: 'Traveler',
    minLevel: 6,
    maxLevel: 10,
    tooltip: 'The road stretches ahead. You have found your rhythm.',
  },
  {
    name: 'Explorer',
    minLevel: 11,
    maxLevel: 20,
    tooltip: 'Curiosity guides your path. New horizons await.',
  },
  {
    name: 'Adventurer',
    minLevel: 21,
    maxLevel: 35,
    tooltip: 'Challenges sharpen your spirit. You grow with each quest.',
  },
  {
    name: 'Hero',
    minLevel: 36,
    maxLevel: 50,
    tooltip: 'Your actions inspire others. A true hero rises.',
  },
  {
    name: 'Legend',
    minLevel: 51,
    maxLevel: 999,
    tooltip: 'Stories will be told of your journey. You are eternal.',
  },
];

function getGradeIndex(gradeLabel: string): number {
  return GRADES.findIndex((g) => g.name === gradeLabel);
}

function getNextGrade(currentGrade: string): (typeof GRADES)[number] | null {
  const idx = getGradeIndex(currentGrade);
  if (idx === -1 || idx >= GRADES.length - 1) return null;
  return GRADES[idx + 1];
}

function getGradeProgress(level: number, currentGrade: string): number {
  const grade = GRADES.find((g) => g.name === currentGrade);
  if (!grade) return 0;
  const range = grade.maxLevel - grade.minLevel + 1;
  const progress = level - grade.minLevel;
  return Math.min(100, Math.round((progress / range) * 100));
}

export function ProgressPage() {
  const { user: currentUser } = useAuth();
  const { data: progression, isLoading: isLoadingProgression } = useUserProgression(
    currentUser?.id
  );
  const { data: statsOverview, isLoading: isLoadingStats } = useStatsOverview();

  const isLoading = isLoadingProgression || isLoadingStats;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
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

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Progress</h1>
          <p className="text-muted-foreground">Your long-term journey, one step at a time.</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 rounded-full hover:bg-muted transition-colors">
                <Info className="h-5 w-5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">
                This view represents your overall progression in Questify. Grades mark meaningful
                milestones on your journey and are earned through consistent action over time.
                Progress here is cumulative and never goes backward.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-secondary/25 bg-secondary/18 shadow-sm">
              <Star className="h-4.5 w-4.5 text-secondary-foreground" />
            </span>
            Grade Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible px-0">
          <div className="overflow-x-auto scrollbar-hide py-3">
            <TooltipProvider delayDuration={200}>
              <div className="flex min-w-max flex-col gap-2 px-4">
                {/* Nodes and connectors row */}
                <div className="flex items-center py-1">
                  {GRADES.map((grade, index) => {
                    const isPast = index < currentGradeIndex;
                    const isCurrent = index === currentGradeIndex;
                    const isFuture = index > currentGradeIndex;

                    return (
                      <div key={grade.name} className="flex items-center last:flex-none">
                        <div className="flex w-16 justify-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="relative flex h-14 w-14 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                aria-label={`${grade.name}: ${grade.tooltip}`}
                              >
                                {isCurrent ? (
                                  <div className="relative h-12 w-12 transition-all hover:scale-105">
                                    <div className="absolute inset-0 rounded-full bg-muted-foreground/32" />
                                    <ShineBorder
                                      className="rounded-full"
                                      shineColor={[
                                        'rgba(168,85,247,0.55)',
                                        'rgba(99,102,241,0.5)',
                                        'rgba(34,211,238,0.55)',
                                      ]}
                                      borderWidth={2}
                                      duration={14}
                                    />
                                    <div className="absolute inset-[2px] rounded-full bg-primary/6 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05),0_0_0_1px_rgba(20,184,166,0.05),0_10px_24px_rgba(15,23,42,0.08)] dark:bg-primary/8 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_0_0_1px_rgba(20,184,166,0.08),0_10px_24px_rgba(0,0,0,0.28)]" />
                                    <div className="relative z-10 flex h-full w-full items-center justify-center text-primary">
                                      <Check className="h-5 w-5" />
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={cn(
                                      'flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 transition-all hover:scale-105',
                                      isPast && 'bg-primary border-primary text-primary-foreground',
                                      isFuture &&
                                        'bg-muted border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50'
                                    )}
                                  >
                                    {isPast ? (
                                      <Check className="h-5 w-5" />
                                    ) : (
                                      <span className="text-sm font-bold">{grade.minLevel}</span>
                                    )}
                                  </div>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-center">
                              <p className="text-sm italic">{grade.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {index < GRADES.length - 1 && (
                          <div className="flex items-center w-8">
                            <div
                              className={cn(
                                'h-0.5 flex-1 rounded-full transition-all',
                                index < currentGradeIndex && 'bg-primary',
                                index === currentGradeIndex &&
                                  'bg-gradient-to-r from-primary to-muted',
                                index > currentGradeIndex && 'bg-muted'
                              )}
                            />
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 -ml-0.5 flex-shrink-0',
                                index < currentGradeIndex && 'text-primary',
                                index >= currentGradeIndex && 'text-muted-foreground/50'
                              )}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Labels row */}
                <div className="flex items-center">
                  {GRADES.map((grade, index) => {
                    const isCurrent = index === currentGradeIndex;
                    const isFuture = index > currentGradeIndex;

                    return (
                      <div key={`${grade.name}-label`} className="flex items-center last:flex-none">
                        <div className="flex justify-center w-16">
                          <span
                            className={cn(
                              'text-xs font-medium text-center whitespace-nowrap',
                              isCurrent && 'text-primary font-bold',
                              isFuture && 'text-muted-foreground'
                            )}
                          >
                            {grade.name}
                          </span>
                        </div>
                        {index < GRADES.length - 1 && <div className="w-8" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-full border border-secondary/25 bg-secondary/18 p-2 shadow-sm">
                <Star className="h-5 w-5 text-secondary-foreground" />
              </div>
              Current Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{currentGrade}</span>
              <span className="text-sm text-muted-foreground">Level {currentLevel}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress in grade</span>
                <span>{gradeProgress}%</span>
              </div>
              <Progress value={gradeProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-full border border-primary/15 bg-primary/10 p-2 shadow-sm">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              Total Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{totalXp.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">XP</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>To next level</span>
                <span>
                  {progression?.currentLevelXp || 0} / {progression?.nextLevelXp || 100}
                </span>
              </div>
              <Progress value={progression?.progressPercent || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {nextGrade && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Requirements for {nextGrade.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Reach Level {nextGrade.minLevel}</span>
                    <span className="text-muted-foreground">
                      {currentLevel} / {nextGrade.minLevel}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (currentLevel / nextGrade.minLevel) * 100)}
                    className="h-2"
                  />
                </div>
                {currentLevel >= nextGrade.minLevel && <Check className="h-5 w-5 text-success" />}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Quests completed</span>
                    <span className="text-muted-foreground">{totalCompleted}</span>
                  </div>
                  <Progress value={Math.min(100, totalCompleted)} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
