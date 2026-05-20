import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  api,
  type CreateCategoryRequest,
  type CreateProjectRequest,
  type CreateQuestRequest,
  type ProjectDetailResponse,
  type QuestResponse,
  type UpdateProjectRequest,
  type UpdateQuestRequest,
  type UserDto,
  type NotificationResponse,
} from '@/lib/api';

type QuestStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'SKIPPED';
type QuestView = 'today' | 'inbox' | 'upcoming' | 'recurring';

export const queryKeys = {
  quests: {
    all: ['quests'] as const,
    list: (status?: QuestStatus, view?: QuestView) => ['quests', 'list', { status, view }] as const,
    detail: (id: string) => ['quests', 'detail', id] as const,
    subquests: (parentId: string) => ['quests', 'subquests', parentId] as const,
    project: (projectId: string) => ['quests', 'project', projectId] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  stats: {
    all: ['stats'] as const,
    overview: ['stats', 'overview'] as const,
    categories: ['stats', 'categories'] as const,
    daily: (days: number) => ['stats', 'daily', days] as const,
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
  progression: {
    all: ['users', 'progression'] as const,
    byUser: (id: string) => ['users', 'progression', id] as const,
  },
  projects: {
    sidebar: ['projects', 'sidebar'] as const,
    list: (search: string, sort: 'recent' | 'name', includeArchived: boolean) =>
      ['projects', 'list', { search, sort, includeArchived }] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    all: ['projects'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: ['notifications', 'list'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
};

function invalidateQuestData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.progression.all });
}

function invalidateProjectData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
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

export function useProjectQuests(projectId: string) {
  return useQuery({
    queryKey: queryKeys.quests.project(projectId),
    queryFn: ({ signal }) => api.getQuests(undefined, undefined, signal, projectId),
    enabled: !!projectId,
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
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.progression.all });
      }, 1500);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.categories });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.categories });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

export function useProjectsSidebar() {
  return useQuery({
    queryKey: queryKeys.projects.sidebar,
    queryFn: ({ signal }) => api.getProjectsSidebar(signal),
  });
}

export function useProjectsList(
  search = '',
  sort: 'recent' | 'name' = 'recent',
  includeArchived = false
) {
  return useQuery({
    queryKey: queryKeys.projects.list(search, sort, includeArchived),
    queryFn: ({ signal }) => api.getProjects({ search, sort, includeArchived }, signal),
  });
}

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: ({ signal }) => api.getProject(id, signal),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectRequest) => api.createProject(data),
    onSuccess: (project) => {
      queryClient.setQueryData<ProjectDetailResponse>(
        queryKeys.projects.detail(project.id),
        project
      );
      invalidateProjectData(queryClient);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      api.updateProject(id, data),
    onSuccess: (project) => {
      queryClient.setQueryData<ProjectDetailResponse>(
        queryKeys.projects.detail(project.id),
        project
      );
      invalidateProjectData(queryClient);
    },
  });
}

export function usePinProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.pinProject(id),
    onSuccess: () => {
      invalidateProjectData(queryClient);
    },
  });
}

export function useUnpinProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.unpinProject(id),
    onSuccess: () => {
      invalidateProjectData(queryClient);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      invalidateProjectData(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
    },
  });
}

export function useStatsOverview() {
  return useQuery({
    queryKey: queryKeys.stats.overview,
    queryFn: ({ signal }) => api.getStatsOverview(signal),
  });
}

export function useStatsByCategory() {
  return useQuery({
    queryKey: queryKeys.stats.categories,
    queryFn: ({ signal }) => api.getStatsByCategory(signal),
  });
}

export function useStatsByDay(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.stats.daily(days),
    queryFn: ({ signal }) => api.getStatsByDay(days, signal),
  });
}

export function useHistory(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: [...queryKeys.history.all, page, size],
    queryFn: ({ signal }) => api.getHistory(page, size, signal),
    placeholderData: keepPreviousData,
  });
}

export function useUserProgression(id?: string) {
  return useQuery({
    queryKey: queryKeys.progression.byUser(id ?? ''),
    queryFn: () => api.getUserProgression(id ?? ''),
    enabled: !!id,
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
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { username?: string; timezone?: string; bio?: string };
    }) => api.updateUserProfile(id, data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserDto>(queryKeys.users.profile(updatedUser.id), updatedUser);
      queryClient.setQueryData<UserDto>(queryKeys.auth.me, updatedUser);
    },
  });
}

export function useUploadProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => api.uploadProfilePicture(id, file),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserDto>(queryKeys.users.profile(updatedUser.id), updatedUser);
      queryClient.setQueryData<UserDto>(queryKeys.auth.me, updatedUser);
    },
  });
}

export function useDeleteProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProfilePicture(id),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserDto>(queryKeys.users.profile(updatedUser.id), updatedUser);
      queryClient.setQueryData<UserDto>(queryKeys.auth.me, updatedUser);
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

export function useAdminUsers(page = 0, search = '') {
  return useQuery({
    queryKey: queryKeys.admin.users(page, search),
    queryFn: ({ signal }) => api.getUsers(page, search || undefined, signal),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: { registrationEnabled?: boolean; maintenanceMode?: boolean }) =>
      api.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings });
    },
  });
}

export function useAdminUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.adminUpdateUserStatus(id, enabled),
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

export function useNotifications() {
  return useQuery<NotificationResponse[]>({
    queryKey: queryKeys.notifications.list,
    queryFn: ({ signal }) => api.getNotifications(signal),
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
