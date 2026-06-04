import { useMemo } from 'react';
import { Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCategories,
  useStatsByCategory,
  useStatsByDay,
  useStatsOverview,
  useUserProgression,
} from '@/hooks/use-api';
import { useDailyCompletion } from '@/hooks/use-daily-completion';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { MonthlyActivityGraph } from '@/components/ui/monthly-activity-graph';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfilePage() {
  const { t } = useTranslation();
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

  const regionData = useMemo(() => {
    if (!categoryStats || categoryStats.length === 0) return [];
    const activeRegionStats = categoryStats.filter(
      (c) => c.questsCompleted > 0 && categories?.some((cat) => cat.name === c.categoryName)
    );
    const total = activeRegionStats.reduce((s, c) => s + c.questsCompleted, 0) || 1;
    return activeRegionStats
      .map((c) => ({
        name: c.categoryName,
        count: c.questsCompleted,
        pct: Math.round((c.questsCompleted / total) * 100),
        color:
          categories?.find((cat) => cat.name === c.categoryName)?.color ?? 'oklch(0.56 0.18 275)',
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [categoryStats, categories]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
        <Skeleton className="h-40 rounded-lg" />
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
    <div className="space-y-4 pb-10">
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

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Monthly activity */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <MonthlyActivityGraph
            dailyData={activityStats ?? []}
            completionByDate={completionByDate}
            isLoading={isLoadingActivity || isLoadingCompletion}
            className="border-0 shadow-none bg-transparent"
          />
        </div>

        {/* By region */}
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center gap-1.5">
            <Map className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{t('profile.by_region')}</span>
          </div>

          {regionData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm font-medium text-foreground">{t('profile.no_activity')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('profile.no_activity_hint')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {regionData.map((r) => (
                <div key={r.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                      {r.name}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {r.count} · {r.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${r.pct}%`, background: r.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
