import { useQuests } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isTomorrow } from 'date-fns';

export function UpcomingPage() {
  const { data: quests, isLoading } = useQuests(undefined, 'upcoming');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const groupedQuests = (quests || []).reduce(
    (groups, quest) => {
      if (!quest.dueDate) return groups;
      const date = quest.dueDate.split('T')[0]; // Simple date extraction
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(quest);
      return groups;
    },
    {} as Record<string, typeof quests>
  );

  // Sort dates
  const sortedDates = Object.keys(groupedQuests).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">The Road Ahead</h1>
        <p className="text-muted-foreground">Your upcoming quests.</p>
      </div>

      {sortedDates.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No upcoming quests scheduled for the next 7 days.
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => {
            const dateQuests = groupedQuests[date]!;
            return (
              <div key={date}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {isTomorrow(parseISO(date)) ? 'Tomorrow' : format(parseISO(date), 'EEEE, MMM d')}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {dateQuests.length} {dateQuests.length === 1 ? 'Quest' : 'Quests'}
                  </Badge>
                </h2>
                <div className="space-y-3">
                  {dateQuests.map((quest) => (
                    <Card key={quest.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{
                            backgroundColor: quest.category?.color
                              ? `${quest.category.color}20`
                              : '#f3f4f6',
                            color: quest.category?.color || '#6b7280',
                          }}
                        >
                          {quest.category?.icon || '📝'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{quest.title}</p>
                          {quest.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {quest.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">+{quest.totalXpReward} XP</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
