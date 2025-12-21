import { useNavigate } from 'react-router-dom';
import { useCategories, useQuests } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export function RegionsPage() {
  const navigate = useNavigate();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: quests, isLoading: isLoadingQuests } = useQuests();

  const getCategoryStats = (categoryId: string) => {
    const categoryQuests = quests?.filter((q) => q.category?.id === categoryId) || [];
    const total = categoryQuests.length;
    const completed = categoryQuests.filter((q) => q.status === 'COMPLETED').length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    let grade = 'Novice';
    if (completed >= 5) grade = 'Apprentice';
    if (completed >= 15) grade = 'Explorer';
    if (completed >= 30) grade = 'Master';

    return { total, completed, progress, grade };
  };

  if (isLoadingCategories || isLoadingQuests) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Regions</h1>
        <p className="text-muted-foreground">Your quest categories.</p>
      </div>

      {categories?.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No regions discovered yet. Create a category to start exploring!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories?.map((category) => {
            const stats = getCategoryStats(category.id);

            return (
              <Card
                key={category.id}
                className="hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/inbox?category=${category.id}`)}
              >
                <CardHeader className="pb-2">
                  <div
                    className="text-3xl mb-2 w-12 h-12 flex items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {category.icon}
                  </div>
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{stats.grade}</span>
                    </div>
                    <Progress value={stats.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground pt-1">
                      {stats.completed} / {stats.total} Quests
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
