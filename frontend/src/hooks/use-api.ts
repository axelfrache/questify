import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type CreateQuestRequest,
  type CreateCategoryRequest,
  type UpdateQuestRequest,
} from '@/lib/api';

export function useQuests(
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'SKIPPED',
  view?: 'today' | 'inbox' | 'upcoming' | 'recurring'
) {
  return useQuery({
    queryKey: ['quests', status, view],
    queryFn: () => api.getQuests(status, view),
  });
}

export function useQuest(id: string) {
  return useQuery({
    queryKey: ['quests', id],
    queryFn: () => api.getQuest(id),
    enabled: !!id,
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuestRequest) => api.createQuest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['category-stats'] });
    },
  });
}

export function useUpdateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestRequest }) =>
      api.updateQuest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['category-stats'] });
    },
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.completeQuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['category-stats'] });
    },
  });
}

export function useSkipQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.skipQuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useToggleQuestActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.toggleQuestActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
}

export function useCancelQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelQuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteQuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['category-stats'] });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => api.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCategoryRequest }) =>
      api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      questAction,
    }: {
      id: string;
      questAction: 'MOVE_TO_INBOX' | 'DELETE_ALL';
    }) => api.deleteCategory(id, questAction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDailyStats() {
  return useQuery({
    queryKey: ['stats', 'daily'],
    queryFn: () => api.getDailyStats(),
  });
}

export function useWeeklyStats() {
  return useQuery({
    queryKey: ['stats', 'weekly'],
    queryFn: () => api.getWeeklyStats(),
  });
}

export function useMonthlyStats() {
  return useQuery({
    queryKey: ['stats', 'monthly'],
    queryFn: () => api.getMonthlyStats(),
  });
}

export function useProgressSummary() {
  return useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: () => api.getProgressSummary(),
  });
}

export function useCategoryStats() {
  return useQuery({
    queryKey: ['stats', 'categories'],
    queryFn: () => api.getCategoryStats(),
  });
}

export function useCompletionRate() {
  return useQuery({
    queryKey: ['stats', 'completion-rate'],
    queryFn: () => api.getCompletionRate(),
  });
}

export function useRegionActivity() {
  return useQuery({
    queryKey: ['stats', 'region-activity'],
    queryFn: () => api.getRegionActivity(),
  });
}

export function useWeeklyCompletionRates() {
  return useQuery({
    queryKey: ['stats', 'weekly-completion'],
    queryFn: () => api.getWeeklyCompletionRates(),
  });
}
