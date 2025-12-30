import { useProgressSummary } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShineBorder } from '@/components/ui/shine-border';
import { Zap, Star, Info, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRADES = [
  { name: 'Initiate', minLevel: 1, maxLevel: 5 },
  { name: 'Traveler', minLevel: 6, maxLevel: 10 },
  { name: 'Explorer', minLevel: 11, maxLevel: 20 },
  { name: 'Adventurer', minLevel: 21, maxLevel: 35 },
  { name: 'Hero', minLevel: 36, maxLevel: 50 },
  { name: 'Legend', minLevel: 51, maxLevel: 999 },
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
  const { data: summary, isLoading } = useProgressSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const levelProgress = summary?.levelProgress;
  const currentGrade = levelProgress?.gradeLabel || 'Initiate';
  const currentLevel = levelProgress?.level || 1;
  const totalXp = levelProgress?.totalXp || 0;
  const currentGradeIndex = getGradeIndex(currentGrade);
  const nextGrade = getNextGrade(currentGrade);
  const gradeProgress = getGradeProgress(currentLevel, currentGrade);
  const totalCompleted = summary?.totalQuestsCompleted || 0;

  return (
    <div className="space-y-8">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Grade Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              {GRADES.map((grade, index) => {
                const isPast = index < currentGradeIndex;
                const isCurrent = index === currentGradeIndex;
                const isFuture = index > currentGradeIndex;

                return (
                  <div key={grade.name} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                            isPast && 'bg-primary border-primary text-primary-foreground',
                            isCurrent && 'bg-primary/20 border-primary text-primary',
                            isFuture && 'bg-muted border-muted-foreground/30 text-muted-foreground'
                          )}
                        >
                          {isPast ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span className="text-xs font-bold">{grade.minLevel}</span>
                          )}
                        </div>
                        {isCurrent && (
                          <ShineBorder
                            className="rounded-full"
                            shineColor={['#a855f7', '#6366f1', '#22d3ee']}
                            borderWidth={2}
                            duration={8}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs mt-2 font-medium text-center',
                          isCurrent && 'text-primary font-bold',
                          isFuture && 'text-muted-foreground'
                        )}
                      >
                        {grade.name}
                      </span>
                    </div>
                    {index < GRADES.length - 1 && (
                      <div className="flex-1 mx-2 flex items-center justify-center">
                        <div
                          className={cn(
                            'h-0.5 w-full rounded-full transition-all',
                            index < currentGradeIndex && 'bg-primary',
                            index === currentGradeIndex && 'bg-gradient-to-r from-primary to-muted',
                            index > currentGradeIndex && 'bg-muted'
                          )}
                        />
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 -ml-1 flex-shrink-0',
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
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-full bg-violet-500/10">
                <Star className="h-5 w-5 text-violet-500" />
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
              <div className="p-2 rounded-full bg-primary/10">
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
                  {levelProgress?.currentLevelXp || 0} / {levelProgress?.nextLevelXp || 100}
                </span>
              </div>
              <Progress value={levelProgress?.progressPercent || 0} className="h-2" />
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
                {currentLevel >= nextGrade.minLevel && <Check className="h-5 w-5 text-green-500" />}
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
