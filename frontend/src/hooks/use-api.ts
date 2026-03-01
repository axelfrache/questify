import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  api,
  type AdminCreateUserRequest,
  type AdminUpdateUserRequest,
  type CreateCategoryRequest,
  type CreateQuestRequest,
  type QuestResponse,
  type UpdateQuestRequest,
  type UserDto,
} from '@/lib/api';

type QuestStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'SKIPPED';
type QuestView = 'today' | 'inbox' | 'upcoming' | 'recurring';

export const queryKeys = {
  quests: {
    all: ['quests'] as const,
    list: (status?: QuestStatus, view?: QuestView) => ['quests', 'list', { status, view }] as const,
    detail: (id: string) => ['quests', 'detail', id] as const,
    subquests: (parentId: string) => ['quests', 'subquests', parentId] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  stats: {
    all: ['stats'] as const,
    daily: ['stats', 'daily'] as const,
    weekly: ['stats', 'weekly'] as const,
    monthly: ['stats', 'monthly'] as const,
    summary: ['stats', 'summary'] as const,
    categories: ['stats', 'categories'] as const,
    completionRate: ['stats', 'completion-rate'] as const,
    regionActivity: ['stats', 'region-activity'] as const,
    weeklyCompletion: ['stats', 'weekly-completion'] as const,
    monthlyCompletion: (year: number, month: number) =>
      ['stats', 'monthly-completion', year, month] as const,
  },
  history: {
    all: ['history'] as const,
  },
  users: {
    profile: (id: string) => ['users', 'profile', id] as const,
  },
  admin: {
    settings: ['admin', 'settings'] as const,
    users: (page: number, query: string) => ['admin', 'users', page, query] as const,
    usersAll: ['admin', 'users'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
};

function invalidateQuestData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
}

type QuestListSnapshot = Array<[readonly unknown[], QuestResponse[] | undefined]>;

function getQuestListSnapshot(queryClient: QueryClient): QuestListSnapshot {
  const entries = queryClient.getQueriesData<QuestResponse[]>({
    queryKey: queryKeys.quests.all,
  });
  return entries.filter(([, data]) => Array.isArray(data)).map(([key, data]) => [key, data]);
}

function restoreQuestListSnapshot(queryClient: QueryClient, snapshot: QuestListSnapshot) {
  snapshot.forEach(([key, data]) => {
    queryClient.setQueryData<QuestResponse[] | undefined>(key, data);
  });
}

function patchQuestInListCaches(
  queryClient: QueryClient,
  questId: string,
  patcher: (quest: QuestResponse) => QuestResponse
) {
  const entries = queryClient.getQueriesData<QuestResponse[]>({
    queryKey: queryKeys.quests.all,
  });
  entries.forEach(([key, data]) => {
    if (!Array.isArray(data)) return;
    queryClient.setQueryData<QuestResponse[]>(
      key,
      data.map((quest) => (quest.id === questId ? patcher(quest) : quest))
    );
  });
}

function removeQuestFromListCaches(queryClient: QueryClient, questId: string) {
  const entries = queryClient.getQueriesData<QuestResponse[]>({
    queryKey: queryKeys.quests.all,
  });
  entries.forEach(([key, data]) => {
    if (!Array.isArray(data)) return;
    queryClient.setQueryData<QuestResponse[]>(
      key,
      data.filter((quest) => quest.id !== questId)
    );
  });
}

export function useQuests(status?: QuestStatus, view?: QuestView) {
  return useQuery({
    queryKey: queryKeys.quests.list(status, view),
    queryFn: ({ signal }) => api.getQuests(status, view, signal),
  });
}

export function useQuest(id: string) {
  return useQuery({
    queryKey: queryKeys.quests.detail(id),
    queryFn: ({ signal }) => api.getQuest(id, signal),
    enabled: !!id,
  });
}

export function useSubquests(parentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.quests.subquests(parentId),
    queryFn: ({ signal }) => api.getSubquests(parentId, signal),
    enabled: !!parentId && enabled,
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuestRequest) => api.createQuest(data),
    onSuccess: () => {
      invalidateQuestData(queryClient);
    },
  });
}

export function useUpdateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestRequest }) =>
      api.updateQuest(id, data),
    onSuccess: (updatedQuest) => {
      queryClient.setQueryData(queryKeys.quests.detail(updatedQuest.id), updatedQuest);
      invalidateQuestData(queryClient);
    },
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.completeQuest(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.quests.all });
      const listSnapshot = getQuestListSnapshot(queryClient);
      const detailSnapshot = queryClient.getQueryData<QuestResponse>(queryKeys.quests.detail(id));

      patchQuestInListCaches(queryClient, id, (quest) => ({ ...quest, status: 'COMPLETED' }));
      if (detailSnapshot) {
        queryClient.setQueryData<QuestResponse>(queryKeys.quests.detail(id), {
          ...detailSnapshot,
          status: 'COMPLETED',
        });
      }

      return { id, listSnapshot, detailSnapshot };
    },
    onError: (_error, _id, context) => {
      if (!context) return;
      restoreQuestListSnapshot(queryClient, context.listSnapshot);
      queryClient.setQueryData<QuestResponse | undefined>(
        queryKeys.quests.detail(context.id),
        context.detailSnapshot
      );
    },
    onSuccess: (updatedQuest) => {
      queryClient.setQueryData(queryKeys.quests.detail(updatedQuest.id), updatedQuest);
      patchQuestInListCaches(queryClient, updatedQuest.id, () => updatedQuest);
    },
    onSettled: () => {
      invalidateQuestData(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.history.all });
    },
  });
}

export function useSkipQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.skipQuest(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.quests.all });
      const listSnapshot = getQuestListSnapshot(queryClient);
      const detailSnapshot = queryClient.getQueryData<QuestResponse>(queryKeys.quests.detail(id));

      patchQuestInListCaches(queryClient, id, (quest) => ({ ...quest, status: 'SKIPPED' }));
      if (detailSnapshot) {
        queryClient.setQueryData<QuestResponse>(queryKeys.quests.detail(id), {
          ...detailSnapshot,
          status: 'SKIPPED',
        });
      }

      return { id, listSnapshot, detailSnapshot };
    },
    onError: (_error, _id, context) => {
      if (!context) return;
      restoreQuestListSnapshot(queryClient, context.listSnapshot);
      queryClient.setQueryData<QuestResponse | undefined>(
        queryKeys.quests.detail(context.id),
        context.detailSnapshot
      );
    },
    onSuccess: (updatedQuest) => {
      queryClient.setQueryData(queryKeys.quests.detail(updatedQuest.id), updatedQuest);
      patchQuestInListCaches(queryClient, updatedQuest.id, () => updatedQuest);
    },
    onSettled: () => {
      invalidateQuestData(queryClient);
    },
  });
}

export function useToggleQuestActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.toggleQuestActive(id),
    onSuccess: (updatedQuest) => {
      queryClient.setQueryData(queryKeys.quests.detail(updatedQuest.id), updatedQuest);
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
    },
  });
}

export function useCancelQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelQuest(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.quests.all });
      const listSnapshot = getQuestListSnapshot(queryClient);
      const detailSnapshot = queryClient.getQueryData<QuestResponse>(queryKeys.quests.detail(id));

      patchQuestInListCaches(queryClient, id, (quest) => ({ ...quest, status: 'CANCELLED' }));
      if (detailSnapshot) {
        queryClient.setQueryData<QuestResponse>(queryKeys.quests.detail(id), {
          ...detailSnapshot,
          status: 'CANCELLED',
        });
      }

      return { id, listSnapshot, detailSnapshot };
    },
    onError: (_error, _id, context) => {
      if (!context) return;
      restoreQuestListSnapshot(queryClient, context.listSnapshot);
      queryClient.setQueryData<QuestResponse | undefined>(
        queryKeys.quests.detail(context.id),
        context.detailSnapshot
      );
    },
    onSuccess: (updatedQuest) => {
      queryClient.setQueryData(queryKeys.quests.detail(updatedQuest.id), updatedQuest);
      patchQuestInListCaches(queryClient, updatedQuest.id, () => updatedQuest);
    },
    onSettled: () => {
      invalidateQuestData(queryClient);
    },
  });
}

export function useDeleteQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteQuest(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.quests.all });
      const listSnapshot = getQuestListSnapshot(queryClient);
      const detailSnapshot = queryClient.getQueryData<QuestResponse>(queryKeys.quests.detail(id));
      removeQuestFromListCaches(queryClient, id);
      queryClient.removeQueries({ queryKey: queryKeys.quests.detail(id) });
      return { id, listSnapshot, detailSnapshot };
    },
    onError: (_error, _id, context) => {
      if (!context) return;
      restoreQuestListSnapshot(queryClient, context.listSnapshot);
      queryClient.setQueryData<QuestResponse | undefined>(
        queryKeys.quests.detail(context.id),
        context.detailSnapshot
      );
    },
    onSettled: () => {
      invalidateQuestData(queryClient);
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: ({ signal }) => api.getCategories(signal),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => api.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.regionActivity });
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCategoryRequest }) =>
      api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.regionActivity });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.regionActivity });
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

export function useDailyStats() {
  return useQuery({
    queryKey: queryKeys.stats.daily,
    queryFn: ({ signal }) => api.getDailyStats(signal),
  });
}

export function useWeeklyStats() {
  return useQuery({
    queryKey: queryKeys.stats.weekly,
    queryFn: ({ signal }) => api.getWeeklyStats(signal),
  });
}

export function useMonthlyStats() {
  return useQuery({
    queryKey: queryKeys.stats.monthly,
    queryFn: ({ signal }) => api.getMonthlyStats(signal),
  });
}

export function useProgressSummary() {
  return useQuery({
    queryKey: queryKeys.stats.summary,
    queryFn: ({ signal }) => api.getProgressSummary(signal),
  });
}

export function useCategoryStats() {
  return useQuery({
    queryKey: queryKeys.stats.categories,
    queryFn: ({ signal }) => api.getCategoryStats(signal),
  });
}

export function useCompletionRate() {
  return useQuery({
    queryKey: queryKeys.stats.completionRate,
    queryFn: ({ signal }) => api.getCompletionRate(signal),
  });
}

export function useRegionActivity() {
  return useQuery({
    queryKey: queryKeys.stats.regionActivity,
    queryFn: ({ signal }) => api.getRegionActivity(signal),
  });
}

export function useWeeklyCompletionRates() {
  return useQuery({
    queryKey: queryKeys.stats.weeklyCompletion,
    queryFn: ({ signal }) => api.getWeeklyCompletionRates(signal),
  });
}

export function useMonthlyCompletionRates(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.stats.monthlyCompletion(year, month),
    queryFn: ({ signal }) => api.getMonthlyCompletionRates(year, month, signal),
  });
}

export function useHistory() {
  return useQuery({
    queryKey: queryKeys.history.all,
    queryFn: ({ signal }) => api.getHistory(signal),
  });
}

export function useUserProfile(id?: string) {
  return useQuery({
    queryKey: queryKeys.users.profile(id ?? ''),
    queryFn: ({ signal }) => api.getUserProfile(id ?? '', signal),
    enabled: !!id,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { username?: string; timezone?: string } }) =>
      api.updateUserProfile(id, data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserDto>(queryKeys.users.profile(updatedUser.id), updatedUser);
    },
  });
}

export function useUploadProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => api.uploadProfilePicture(id, file),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserDto>(queryKeys.users.profile(updatedUser.id), updatedUser);
    },
  });
}

export function useDeleteProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProfilePicture(id),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserDto>(queryKeys.users.profile(updatedUser.id), updatedUser);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { currentPassword: string; newPassword: string };
    }) => api.changePassword(id, data),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.deleteAccount(id, password),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: ({ signal }) => api.getSettings(signal),
  });
}

export function useAdminUsers(page = 0, query = '') {
  return useQuery({
    queryKey: queryKeys.admin.users(page, query),
    queryFn: ({ signal }) => api.getUsers(page, query || undefined, signal),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: { registrationEnabled: boolean }) => api.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings });
    },
  });
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminCreateUserRequest) => api.adminCreateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.usersAll });
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUpdateUserRequest }) =>
      api.adminUpdateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.usersAll });
    },
  });
}

export function useAdminUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      api.adminUpdateUserStatus(id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.usersAll });
    },
  });
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.adminDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.usersAll });
    },
  });
}
