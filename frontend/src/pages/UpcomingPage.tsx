import { useQuests } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isTomorrow } from 'date-fns';
import { QuestCard } from '@/components/QuestCard';

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
      const date = quest.dueDate.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(quest);
      return groups;
    },
    {} as Record<string, typeof quests>
  );

  const sortedDates = Object.keys(groupedQuests).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">The Road Ahead</h1>
        <p className="text-muted-foreground">Your upcoming quests.</p>
      </div>

      {sortedDates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-base font-medium text-muted-foreground">Nothing on the horizon</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            No quests scheduled for the next 7 days.
          </p>
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
                    <QuestCard key={quest.id} quest={quest} disabled={true} />
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
