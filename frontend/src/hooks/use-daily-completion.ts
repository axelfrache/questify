import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { buildDailyCompletionMap } from '@/lib/activity-completion';

export function useDailyCompletion() {
  const query = useQuery({
    queryKey: ['quests', 'daily-completion'],
    queryFn: async ({ signal }) => {
      const [completedQuests, pendingQuests, skippedQuests] = await Promise.all([
        api.getQuests('COMPLETED', undefined, signal),
        api.getQuests('PENDING', undefined, signal),
        api.getQuests('SKIPPED', undefined, signal),
      ]);

      return buildDailyCompletionMap([...completedQuests, ...pendingQuests, ...skippedQuests]);
    },
    staleTime: 30_000,
  });

  return {
    completionByDate: query.data ?? {},
    isLoading: query.isLoading,
  };
}
