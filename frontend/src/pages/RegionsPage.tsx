import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryStats } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateCategoryDialog } from '@/components/CreateCategoryDialog';

export function RegionsPage() {
  const navigate = useNavigate();
  const { data: categoryStats, isLoading } = useCategoryStats();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (isLoading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regions</h1>
          <p className="text-muted-foreground">Your quest categories.</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Region
        </Button>
      </div>

      {!categoryStats || categoryStats.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No regions discovered yet. Create a category to start exploring!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categoryStats.map((stats) => (
            <Card
              key={stats.categoryId}
              className="hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/inbox?category=${stats.categoryId}`)}
            >
              <CardHeader className="pb-2">
                <div
                  className="text-3xl mb-2 w-12 h-12 flex items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${stats.color}20`, color: stats.color }}
                >
                  {stats.icon}
                </div>
                <CardTitle>{stats.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{stats.grade}</span>
                  </div>
                  <Progress value={stats.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground pt-1">
                    {stats.totalQuests === 0
                      ? 'No quests yet'
                      : `${stats.completedQuests}/${stats.totalQuests} quests completed`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateCategoryDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}
