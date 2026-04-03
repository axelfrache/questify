import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCategories,
  useStatsByCategory,
  useStatsByDay,
  useStatsOverview,
  useUserProgression,
} from '@/hooks/use-api';
import { useDailyCompletion } from '@/hooks/use-daily-completion';
import { Button } from '@/components/ui/button';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { RegionRadarChart } from '@/components/ui/region-radar-chart';
import { MonthlyActivityGraph } from '@/components/ui/monthly-activity-graph';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ProfilePage() {
  const { user } = useAuth();
  const { data: progression, isLoading: isLoadingProgression } = useUserProgression(user?.id);
  const { data: overview, isLoading: isLoadingOverview } = useStatsOverview();
  const { data: categoryStats, isLoading: isLoadingCategoryStats } = useStatsByCategory();
  const { data: activityStats, isLoading: isLoadingActivity } = useStatsByDay(365);
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { completionByDate, isLoading: isLoadingCompletion } = useDailyCompletion();

  const isLoading =
    isLoadingProgression ||
    isLoadingOverview ||
    isLoadingCategoryStats ||
    isLoadingActivity ||
    isLoadingCategories ||
    isLoadingCompletion;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-[2rem]" />
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Skeleton className="h-[320px] rounded-[2rem]" />
          <Skeleton className="h-[320px] rounded-[2rem]" />
        </div>
        <Skeleton className="h-[160px] rounded-[2rem]" />
      </div>
    );
  }

  const level = progression?.level ?? 1;
  const gradeLabel = progression?.gradeLabel ?? 'Initiate';
  const totalXp = overview?.totalXp ?? progression?.totalXp ?? 0;
  const currentStreak = overview?.currentStreak ?? 0;
  const totalCompleted = overview?.totalCompleted ?? 0;
  const currentLevelXp = progression?.currentLevelXp ?? 0;
  const nextLevelXp = progression?.nextLevelXp ?? 100;
  const progressPercent = progression?.progressPercent ?? 0;

  return (
    <div className="space-y-6 pb-10">
      <ProfileHero
        username={user?.username || 'Unknown'}
        profilePictureUrl={user?.profilePictureUrl}
        bio={user?.bio}
        level={level}
        gradeLabel={gradeLabel}
        totalXp={totalXp}
        currentStreak={currentStreak}
        totalCompleted={totalCompleted}
        currentLevelXp={currentLevelXp}
        nextLevelXp={nextLevelXp}
        progressPercent={progressPercent}
      />

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <RegionRadarChart data={categoryStats ?? []} />
        <MonthlyActivityGraph
          dailyData={activityStats ?? []}
          completionByDate={completionByDate}
          isLoading={isLoadingActivity || isLoadingCompletion}
          xpEarned={totalXp}
          activeDays={currentStreak}
          questsCompleted={totalCompleted}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="tracking-tight">Regions</CardTitle>
            <CardDescription>
              The categories currently shaping your quest flow.
            </CardDescription>
          </div>
          {categories && categories.length > 0 ? (
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link to="/regions">
                Manage regions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {!categories || categories.length === 0 ? (
            <div className="rounded-[calc(var(--radius)+2px)] border border-dashed border-border/70 bg-background/55 px-5 py-8 text-center">
              <p className="text-sm font-medium text-foreground">No regions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first region to organize your quests by area of focus.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/regions">
                  <Plus className="h-4 w-4" />
                  Create your first region
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/inbox?category=${category.id}`}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/72 px-3 py-2 text-sm shadow-sm transition-colors',
                    'hover:border-border hover:bg-muted/60'
                  )}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-base"
                    style={{ backgroundColor: `${category.color}18`, color: category.color }}
                  >
                    {category.icon}
                  </span>
                  <span className="font-medium text-foreground">{category.name}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
