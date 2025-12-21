import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type CreateQuestRequest,
  type CreateCategoryRequest,
  type UpdateQuestRequest,
} from '@/lib/api';

export function useQuests(
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED',
  view?: 'today' | 'inbox'
) {
  return useQuery({
    queryKey: ['quests', status, view],
    queryFn: () => api.getQuests(status, view),
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuestRequest) => api.createQuest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
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
