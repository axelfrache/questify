import { useEffect, useState } from 'react';
import { api, type DailyStats, type QuestResponse } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { isSameDay, parseISO } from 'date-fns';

export function TodayPage() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [quests, setQuests] = useState<QuestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, questsData] = await Promise.all([api.getDailyStats(), api.getQuests()]);
      setStats(statsData);

      // Filter for today's quests
      const today = new Date();
      const todaysQuests = questsData.filter((q) => {
        if (!q.dueDate) return false;
        return isSameDay(parseISO(q.dueDate), today);
      });

      setQuests(todaysQuests);
    } catch (err) {
      console.error('Failed to load today data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (id: string, currentStatus: string) => {
    if (currentStatus === 'COMPLETED') return;
    try {
      await api.completeQuest(id);
      fetchData(); // Refresh to update stats and list
    } catch (err) {
      console.error('Failed to complete quest', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const plannedQuests = quests.filter((q) => q.status !== 'COMPLETED' && q.status !== 'CANCELLED');
  const completedQuests = quests.filter((q) => q.status === 'COMPLETED');

  // Calculate XP progress (mock goal of 100 XP for now)
  const xpGoal = 100;
  const currentXp = stats?.xpEarned || 0;
  const progressPercentage = Math.min((currentXp / xpGoal) * 100, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today's Path</h1>
        <p className="text-muted-foreground">Take one step at a time.</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Daily Goal</span>
          <span>
            {currentXp} / {xpGoal} XP
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Planned</h2>
          {plannedQuests.length === 0 ? (
            <div className="rounded-lg border p-4 text-muted-foreground text-center text-sm">
              No quests planned for today.
            </div>
          ) : (
            <div className="space-y-3">
              {plannedQuests.map((quest) => (
                <QuestItem key={quest.id} quest={quest} onComplete={handleComplete} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Completed</h2>
          {completedQuests.length === 0 ? (
            <div className="rounded-lg border p-4 text-muted-foreground text-center text-sm">
              Nothing completed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {completedQuests.map((quest) => (
                <QuestItem key={quest.id} quest={quest} onComplete={handleComplete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestItem({
  quest,
  onComplete,
}: {
  quest: QuestResponse;
  onComplete: (id: string, status: string) => void;
}) {
  return (
    <Card className={quest.status === 'COMPLETED' ? 'opacity-60' : ''}>
      <CardContent className="p-4 flex items-center gap-4">
        <Checkbox
          checked={quest.status === 'COMPLETED'}
          onCheckedChange={() => onComplete(quest.id, quest.status)}
          disabled={quest.status === 'COMPLETED'}
        />
        <div className="flex-1">
          <p
            className={`font-medium ${quest.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}
          >
            {quest.title}
          </p>
        </div>
        <Badge variant="outline">+{quest.xpReward} XP</Badge>
      </CardContent>
    </Card>
  );
}
