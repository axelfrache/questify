import { useProgressSummary, useCategoryStats } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Zap, Target, TrendingUp, Calendar, Star } from 'lucide-react';

export function ProgressPage() {
  const { data: summary, isLoading: isLoadingSummary } = useProgressSummary();
  const { data: categoryStats, isLoading: isLoadingCategories } = useCategoryStats();

  const isLoading = isLoadingSummary || isLoadingCategories;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const levelProgress = summary?.levelProgress;
  const today = summary?.today;
  const thisWeek = summary?.thisWeek;
  const thisMonth = summary?.thisMonth;

  const xpProgress = levelProgress?.progressPercent || 0;
  const dailyBreakdown = thisWeek?.dailyBreakdown || [];
  const maxDaily = Math.max(...dailyBreakdown.map((d) => d.questsCompleted), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-muted-foreground">Your journey so far.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-2xl font-bold">{levelProgress?.totalXp || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">{levelProgress?.level || 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-violet-500/10">
                <Star className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className="text-2xl font-bold">{levelProgress?.gradeLabel || 'Novice'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <Target className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{today?.questsCompleted || 0} quests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Level Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {levelProgress?.level || 1}</span>
              <span>
                {levelProgress?.currentLevelXp || 0} / {levelProgress?.nextLevelXp || 100} XP
              </span>
            </div>
            <Progress value={xpProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quests Completed</span>
                <span className="font-semibold">{thisWeek?.questsCompleted || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XP Earned</span>
                <span className="font-semibold">{thisWeek?.xpEarned || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average per Day</span>
                <span className="font-semibold">{thisWeek?.averagePerDay?.toFixed(1) || 0}</span>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">Daily Activity</p>
                <div className="flex items-end gap-1 h-20">
                  {dailyBreakdown.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary rounded-t transition-all"
                        style={{
                          height: `${(day.questsCompleted / maxDaily) * 100}%`,
                          minHeight: day.questsCompleted > 0 ? 4 : 0,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quests Completed</span>
                <span className="font-semibold">{thisMonth?.questsCompleted || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XP Earned</span>
                <span className="font-semibold">{thisMonth?.xpEarned || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Days</span>
                <span className="font-semibold">{thisMonth?.activeDays || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {categoryStats && categoryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map((category) => (
                <div key={category.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon}
                      </span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {category.completedQuests}/{category.totalQuests} completed
                      </span>
                      <span className="font-semibold" style={{ color: category.color }}>
                        {category.grade}
                      </span>
                    </div>
                  </div>
                  <Progress value={category.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
