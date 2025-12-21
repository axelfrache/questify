import { useSearchParams } from 'react-router-dom';
import { useQuests, useCategories, useCompleteQuest } from '@/hooks/use-api';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { X } from 'lucide-react';

export function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('category');

  const { data: quests, isLoading: isLoadingQuests, error: errorQuests } = useQuests();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const completeQuestMutation = useCompleteQuest();

  const handleComplete = (id: string, currentStatus: string) => {
    if (currentStatus === 'COMPLETED') return;
    completeQuestMutation.mutate(id);
  };

  const clearFilter = () => {
    setSearchParams({});
  };

  const activeQuests =
    quests
      ?.filter((q) => q.status !== 'CANCELLED')
      .sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === 'PENDING' ? -1 : 1;
      }) || [];

  const filteredQuests = categoryId
    ? activeQuests.filter((q) => q.category?.id === categoryId)
    : activeQuests;

  const currentCategory = categoryId ? categories?.find((c) => c.id === categoryId) : null;

  if (isLoadingQuests || isLoadingCategories) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">
            {currentCategory ? `Quests in ${currentCategory.name}` : 'Quest Board'}
          </p>
        </div>
        {currentCategory && (
          <Button variant="outline" size="sm" onClick={clearFilter} className="gap-2">
            <X className="h-4 w-4" />
            Clear Filter
          </Button>
        )}
      </div>

      {errorQuests && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load quests</AlertDescription>
        </Alert>
      )}

      {filteredQuests.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          {categoryId
            ? `No quests found in ${currentCategory?.name || 'this category'}.`
            : 'No quests found. Start your journey by adding a new quest!'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredQuests.map((quest) => (
            <Card key={quest.id} className={quest.status === 'COMPLETED' ? 'opacity-60' : ''}>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <Checkbox
                  checked={quest.status === 'COMPLETED'}
                  onCheckedChange={() => handleComplete(quest.id, quest.status)}
                  disabled={quest.status === 'COMPLETED' || completeQuestMutation.isPending}
                />
                <div className="flex-1">
                  <CardTitle
                    className={`text-base ${
                      quest.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {quest.title}
                  </CardTitle>
                </div>
                <Badge variant={getDifficultyVariant(quest.difficulty)}>{quest.difficulty}</Badge>
                <Badge variant="outline">+{quest.xpReward} XP</Badge>
              </CardHeader>
              <CardContent>
                {quest.description && (
                  <p className="text-sm text-muted-foreground mb-2">{quest.description}</p>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {quest.category && (
                    <span className="flex items-center gap-1">
                      <span>{quest.category.icon}</span>
                      {quest.category.name}
                    </span>
                  )}
                  {quest.dueDate && (
                    <span>Due: {format(new Date(quest.dueDate), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function getDifficultyVariant(
  difficulty: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (difficulty) {
    case 'EASY':
      return 'secondary';
    case 'MEDIUM':
      return 'default';
    case 'HARD':
      return 'destructive';
    case 'EPIC':
      return 'destructive';
    default:
      return 'outline';
  }
}
