import { useMemo } from 'react';
import { useQuests } from '@/hooks/use-api';
import { buildDailyCompletionMap } from '@/lib/activity-completion';

export function useDailyCompletion() {
  const completedQuery = useQuests('COMPLETED');
  const pendingQuery = useQuests('PENDING');
  const skippedQuery = useQuests('SKIPPED');
  const cancelledQuery = useQuests('CANCELLED');

  const quests = useMemo(
    () => [
      ...(completedQuery.data ?? []),
      ...(pendingQuery.data ?? []),
      ...(skippedQuery.data ?? []),
      ...(cancelledQuery.data ?? []),
    ],
    [completedQuery.data, pendingQuery.data, skippedQuery.data, cancelledQuery.data]
  );

  const completionByDate = useMemo(() => buildDailyCompletionMap(quests), [quests]);

  return {
    completionByDate,
    isLoading:
      completedQuery.isLoading ||
      pendingQuery.isLoading ||
      skippedQuery.isLoading ||
      cancelledQuery.isLoading,
  };
}
