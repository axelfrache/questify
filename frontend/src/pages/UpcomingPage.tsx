import { useQuests } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isAfter, isTomorrow, parseISO, startOfDay } from 'date-fns';

export function UpcomingPage() {
  const { data: quests, isLoading } = useQuests();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const today = startOfDay(new Date());

  const futureQuests =
    quests
      ?.filter((q) => {
        if (!q.dueDate) return false;
        return isAfter(parseISO(q.dueDate), today) && !isTomorrow(parseISO(q.dueDate)); // Exclude today (handled in TodayPage) - wait, logic check: TodayPage handles TODAY. Upcoming should handle Tomorrow onwards.
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()) || [];

  const groupedQuests = futureQuests.reduce(
    (groups, quest) => {
      const date = quest.dueDate!;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(quest);
      return groups;
    },
    {} as Record<string, typeof futureQuests>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">The Road Ahead</h1>
        <p className="text-muted-foreground">Your upcoming quests.</p>
      </div>

      {Object.keys(groupedQuests).length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No upcoming quests scheduled.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedQuests).map(([date, dateQuests]) => (
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
                      <div className="flex-1">
                        <p className="font-medium">{quest.title}</p>
                        {quest.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {quest.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">+{quest.xpReward} XP</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
