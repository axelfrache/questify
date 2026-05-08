import { getAccessToken, isOidcEnabled } from './oidc';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const REFRESH_LOCK_KEY = 'questify.auth.refresh.lock';
const REFRESH_RESULT_KEY = 'questify.auth.refresh.result';
const REFRESH_LOCK_TTL_MS = 10_000;
const REFRESH_WAIT_TIMEOUT_MS = 12_000;
const REFRESH_CHANNEL_NAME = 'questify.auth.refresh';

interface RefreshLockState {
  owner: string;
  expiresAt: number;
}

interface RefreshResultState {
  owner: string;
  success: boolean;
  timestamp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  profilePictureUrl: string | null;
  role: 'USER' | 'ADMIN';
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl: string;
  private onUnauthorized: (() => void) | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<AuthResponse> | null = null;
  private tabId: string;
  private refreshChannel: BroadcastChannel | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.tabId = this.createTabId();
    this.refreshChannel =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(REFRESH_CHANNEL_NAME) : null;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  private createTabId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private readRefreshLock(): RefreshLockState | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(REFRESH_LOCK_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<RefreshLockState>;
      if (!parsed.owner || typeof parsed.expiresAt !== 'number') return null;
      return { owner: parsed.owner, expiresAt: parsed.expiresAt };
    } catch {
      return null;
    }
  }

  private tryClaimRefreshCoordinatorRole(): boolean {
    if (typeof window === 'undefined') return true;

    const current = this.readRefreshLock();
    const now = Date.now();
    if (current && current.owner !== this.tabId && current.expiresAt > now) {
      return false;
    }

    try {
      window.localStorage.setItem(
        REFRESH_LOCK_KEY,
        JSON.stringify({
          owner: this.tabId,
          expiresAt: now + REFRESH_LOCK_TTL_MS,
        })
      );
      const confirmed = this.readRefreshLock();
      return confirmed?.owner === this.tabId;
    } catch {
      return true;
    }
  }

  private releaseRefreshCoordinatorRole() {
    if (typeof window === 'undefined') return;
    const current = this.readRefreshLock();
    if (current?.owner !== this.tabId) return;
    try {
      window.localStorage.removeItem(REFRESH_LOCK_KEY);
    } catch {
      // Ignore storage errors.
    }
  }

  private readLastRefreshResult(): RefreshResultState | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(REFRESH_RESULT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<RefreshResultState>;
      if (
        !parsed.owner ||
        typeof parsed.success !== 'boolean' ||
        typeof parsed.timestamp !== 'number'
      ) {
        return null;
      }
      return {
        owner: parsed.owner,
        success: parsed.success,
        timestamp: parsed.timestamp,
      };
    } catch {
      return null;
    }
  }

  private publishRefreshResult(success: boolean) {
    if (typeof window === 'undefined') return;
    const result: RefreshResultState = {
      owner: this.tabId,
      success,
      timestamp: Date.now(),
    };

    try {
      window.localStorage.setItem(REFRESH_RESULT_KEY, JSON.stringify(result));
    } catch {
      // Ignore storage errors.
    }

    try {
      this.refreshChannel?.postMessage(result);
    } catch {
      // Ignore channel errors.
    }
  }

  private waitForRefreshResult(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return Promise.resolve(false);
    }

    const waitStartedAt = Date.now();
    const existingResult = this.readLastRefreshResult();
    if (existingResult && existingResult.timestamp >= waitStartedAt - 1_000) {
      return Promise.resolve(existingResult.success);
    }

    return new Promise((resolve) => {
      let settled = false;
      let timeoutId = 0;

      const cleanup = () => {
        window.removeEventListener('storage', handleStorage);
        this.refreshChannel?.removeEventListener('message', handleBroadcastMessage);
        window.clearTimeout(timeoutId);
      };

      const finalize = (value: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };

      const handleResult = (result: RefreshResultState) => {
        if (result.timestamp >= waitStartedAt) {
          finalize(result.success);
        }
      };

      const handleBroadcastMessage = (event: MessageEvent<RefreshResultState>) => {
        if (!event.data) return;
        handleResult(event.data);
      };

      const handleStorage = (event: StorageEvent) => {
        if (event.key !== REFRESH_RESULT_KEY || !event.newValue) {
          return;
        }

        try {
          const parsed = JSON.parse(event.newValue) as Partial<RefreshResultState>;
          if (
            parsed.owner &&
            typeof parsed.success === 'boolean' &&
            typeof parsed.timestamp === 'number'
          ) {
            handleResult({
              owner: parsed.owner,
              success: parsed.success,
              timestamp: parsed.timestamp,
            });
          }
        } catch {
          finalize(false);
        }
      };

      timeoutId = window.setTimeout(() => finalize(false), REFRESH_WAIT_TIMEOUT_MS);
      window.addEventListener('storage', handleStorage);
      this.refreshChannel?.addEventListener('message', handleBroadcastMessage);

      const latestResult = this.readLastRefreshResult();
      if (latestResult && latestResult.timestamp >= waitStartedAt) {
        finalize(latestResult.success);
      }
    });
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      try {
        await this.refreshPromise;
        return true;
      } catch {
        return false;
      }
    }

    if (!this.tryClaimRefreshCoordinatorRole()) {
      return this.waitForRefreshResult();
    }

    this.isRefreshing = true;
    try {
      this.refreshPromise = this.refreshTokenRequest();
      await this.refreshPromise;
      this.publishRefreshResult(true);
      return true;
    } catch {
      this.publishRefreshResult(false);
      return false;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
      this.releaseRefreshCoordinatorRole();
    }
  }

  private async refreshTokenRequest(): Promise<AuthResponse> {
    const url = `${this.baseUrl}/api/auth/refresh-cookie`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Refresh failed');
    }

    return response.json();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers ?? {});
    const isFormData = options.body instanceof FormData;

    if (options.body && !isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const accessToken = await getAccessToken();
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && isOidcEnabled()) {
      if (this.onUnauthorized) {
        this.onUnauthorized();
      }
      throw new ApiError('Session expired. Please log in again.', response.status, 'UNAUTHORIZED');
    }

    if (response.status === 401 && retry && !endpoint.startsWith('/api/auth/')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      } else {
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new ApiError(
          'Session expired. Please log in again.',
          response.status,
          'UNAUTHORIZED'
        );
      }
    }

    if (!response.ok) {
      let message = 'An error occurred';
      let code: string | undefined;
      let details: unknown;
      const contentType = response.headers.get('content-type') ?? '';
      const raw = await response.text();
      details = raw;

      if (contentType.includes('application/json') && raw) {
        try {
          const errorData = JSON.parse(raw) as {
            message?: string;
            code?: string;
          };
          details = errorData;
          message = errorData.message || message;
          code = errorData.code;
        } catch {
          if (raw.length < 200) {
            message = raw;
          }
        }
      } else if (raw && raw.length < 200) {
        message = raw;
      }

      throw new ApiError(message, response.status, code, details);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    const raw = await response.text();
    if (!raw) {
      return undefined as T;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, options);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    return this.request<void>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    return this.request<void>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refresh(): Promise<AuthResponse | null> {
    try {
      return await this.refreshTokenRequest();
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('/api/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore logout errors
    }
  }

  async getCurrentUser(): Promise<UserDto> {
    return this.request<UserDto>('/api/auth/me');
  }

  async getQuests(
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'SKIPPED',
    view?: 'today' | 'inbox' | 'upcoming' | 'recurring',
    signal?: AbortSignal,
    projectId?: string
  ): Promise<QuestResponse[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (view) params.append('view', view);
    if (projectId) params.append('projectId', projectId);
    return this.request<QuestResponse[]>(`/api/quests?${params.toString()}`, { signal });
  }

  async getQuest(id: string, signal?: AbortSignal): Promise<QuestResponse> {
    return this.request<QuestResponse>(`/api/quests/${id}`, { signal });
  }

  async getSubquests(parentId: string, signal?: AbortSignal): Promise<QuestResponse[]> {
    return this.request<QuestResponse[]>(`/api/quests/${parentId}/subquests`, { signal });
  }

  async createQuest(data: CreateQuestRequest): Promise<QuestResponse> {
    return this.request<QuestResponse>('/api/quests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuest(id: string, data: UpdateQuestRequest): Promise<QuestResponse> {
    return this.request<QuestResponse>(`/api/quests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async completeQuest(id: string): Promise<QuestResponse> {
    return this.request<QuestResponse>(`/api/occurrences/${id}/complete`, {
      method: 'POST',
    });
  }

  async skipQuest(id: string): Promise<QuestResponse> {
    return this.request<QuestResponse>(`/api/occurrences/${id}/skip`, {
      method: 'POST',
    });
  }

  async toggleQuestActive(id: string): Promise<QuestResponse> {
    return this.request<QuestResponse>(`/api/quests/${id}/toggle-active`, {
      method: 'POST',
    });
  }

  async cancelQuest(id: string): Promise<QuestResponse> {
    return this.request<QuestResponse>(`/api/quests/${id}/cancel`, {
      method: 'POST',
    });
  }

  async deleteQuest(id: string): Promise<void> {
    return this.request<void>(`/api/quests/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories(signal?: AbortSignal): Promise<CategoryResponse[]> {
    return this.request<CategoryResponse[]>('/api/categories', { signal });
  }

  async createCategory(data: CreateCategoryRequest): Promise<CategoryResponse> {
    return this.request<CategoryResponse>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: CreateCategoryRequest): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(
    id: string,
    questAction: 'MOVE_TO_INBOX' | 'DELETE_ALL' = 'MOVE_TO_INBOX'
  ): Promise<void> {
    return this.request<void>(`/api/categories/${id}?questAction=${questAction}`, {
      method: 'DELETE',
    });
  }

  async getProjectsSidebar(signal?: AbortSignal): Promise<ProjectSidebarResponse> {
    return this.request<ProjectSidebarResponse>('/api/projects/sidebar', { signal });
  }

  async getProjects(
    params: { search?: string; sort?: 'recent' | 'name'; includeArchived?: boolean } = {},
    signal?: AbortSignal
  ): Promise<ProjectSummaryResponse[]> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.includeArchived) searchParams.append('includeArchived', 'true');
    return this.request<ProjectSummaryResponse[]>(`/api/projects?${searchParams.toString()}`, {
      signal,
    });
  }

  async getProject(id: string, signal?: AbortSignal): Promise<ProjectDetailResponse> {
    return this.request<ProjectDetailResponse>(`/api/projects/${id}`, { signal });
  }

  async createProject(data: CreateProjectRequest): Promise<ProjectDetailResponse> {
    return this.request<ProjectDetailResponse>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<ProjectDetailResponse> {
    return this.request<ProjectDetailResponse>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async pinProject(id: string): Promise<void> {
    return this.request<void>(`/api/projects/${id}/pin`, {
      method: 'POST',
    });
  }

  async unpinProject(id: string): Promise<void> {
    return this.request<void>(`/api/projects/${id}/pin`, {
      method: 'DELETE',
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getStatsOverview(signal?: AbortSignal): Promise<OverallStatsResponse> {
    return this.request<OverallStatsResponse>('/api/stats/overview', { signal });
  }

  async getStatsByCategory(signal?: AbortSignal): Promise<CategoryStatsResponse[]> {
    return this.request<CategoryStatsResponse[]>('/api/stats/categories', { signal });
  }

  async getStatsByDay(days: number = 30, signal?: AbortSignal): Promise<DailyStatsResponse[]> {
    return this.request<DailyStatsResponse[]>(`/api/stats/daily?days=${days}`, { signal });
  }

  async getUserProfile(id: string, signal?: AbortSignal): Promise<UserDto> {
    return this.request<UserDto>(`/api/users/${id}`, { signal });
  }

  async getUserProgression(id: string): Promise<UserProgressionDto> {
    return this.request<UserProgressionDto>(`/api/users/${id}/progression`);
  }

  async uploadProfilePicture(id: string, file: File): Promise<UserDto> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<UserDto>(`/api/users/${id}/profile-picture`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteProfilePicture(id: string): Promise<UserDto> {
    return this.request<UserDto>(`/api/users/${id}/profile-picture`, {
      method: 'DELETE',
    });
  }

  async updateUserProfile(
    id: string,
    data: { username?: string; timezone?: string; bio?: string }
  ): Promise<UserDto> {
    return this.request<UserDto>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(
    id: string,
    data: { currentPassword: string; newPassword: string }
  ): Promise<void> {
    return this.request<void>(`/api/users/${id}/password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(id: string, password: string): Promise<void> {
    return this.request<void>(`/api/users/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  async getSettings(signal?: AbortSignal): Promise<InstanceSettingsResponse> {
    return this.request('/api/admin/settings', { signal });
  }

  async updateSettings(updates: {
    registrationEnabled?: boolean;
    maintenanceMode?: boolean;
  }): Promise<InstanceSettingsResponse> {
    return this.request('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getUsers(
    page: number = 0,
    search?: string,
    signal?: AbortSignal
  ): Promise<Page<UserSummaryResponse>> {
    const params = new URLSearchParams({ page: page.toString(), size: '20' });
    if (search) params.append('search', search);
    return this.request<Page<UserSummaryResponse>>(`/api/admin/users?${params.toString()}`, {
      signal,
    });
  }

  async getHistory(
    page: number = 0,
    size: number = 20,
    signal?: AbortSignal
  ): Promise<Page<QuestHistoryResponse>> {
    return this.request<Page<QuestHistoryResponse>>(
      `/api/stats/history?page=${page}&size=${size}`,
      { signal }
    );
  }

  async adminUpdateUserStatus(id: string, enabled: boolean): Promise<UserSummaryResponse> {
    return this.request<UserSummaryResponse>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }

  async adminUpdateUserRole(id: string, role: string): Promise<UserSummaryResponse> {
    return this.request<UserSummaryResponse>(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async adminDeleteUser(id: string): Promise<void> {
    return this.request<void>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getNotifications(signal?: AbortSignal): Promise<NotificationResponse[]> {
    return this.request('/api/notifications', { signal });
  }

  async getUnreadCount(signal?: AbortSignal): Promise<UnreadCountResponse> {
    return this.request('/api/notifications/unread-count', { signal });
  }

  async markNotificationRead(id: string): Promise<void> {
    return this.request<void>(`/api/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead(): Promise<void> {
    return this.request<void>('/api/notifications/read-all', { method: 'POST' });
  }

  async deleteNotification(id: string): Promise<void> {
    return this.request<void>(`/api/notifications/${id}`, { method: 'DELETE' });
  }
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface QuestResponse {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'SKIPPED';
  category?: CategoryResponse;
  projectId?: string;
  dueDate?: string;
  baseXpReward: number;
  totalXpReward: number;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
  recurrenceInterval: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  recurrenceDays?: number[];
  parentId?: string;
  parentTitle?: string;
  subquestCount: number;
  completedSubquestCount: number;
}

export interface CreateQuestRequest {
  title: string;
  description?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  categoryId?: string;
  projectId?: string;
  dueDate?: string;
  recurrenceInterval?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  recurrenceDays?: number[];
  baseXpReward?: number;
  parentId?: string;
}

export interface UpdateQuestRequest {
  title?: string;
  description?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'SKIPPED';
  categoryId?: string;
  projectId?: string;
  dueDate?: string;
  recurrenceInterval?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  recurrenceDays?: number[];
  baseXpReward?: number;
}

export interface CategoryResponse {
  id: string;
  name: string;
  color: string;
  icon: string;
  source: 'DEFAULT' | 'CUSTOM' | 'GLOBAL';
  isGlobal: boolean;
}

export interface ProjectSummaryResponse {
  id: string;
  name: string;
  description?: string;
  icon: string;
  pinned: boolean;
  archived: boolean;
  updatedAt: string;
}

export interface ProjectSidebarResponse {
  pinned: ProjectSummaryResponse[];
  recent: ProjectSummaryResponse[];
}

export interface ProjectDetailResponse {
  id: string;
  name: string;
  description?: string;
  icon: string;
  pinned: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  icon?: string;
  archived?: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
  icon: string;
}

export interface QuestHistoryResponse {
  questId: string;
  questTitle: string;
  xpEarned: number;
  categoryName?: string;
  completedAt: string;
}

export interface OverallStatsResponse {
  totalCompleted: number;
  totalXp: number;
  currentStreak: number;
}

export interface CategoryStatsResponse {
  categoryName: string;
  questsCompleted: number;
  xpEarned: number;
}

export interface DailyStatsResponse {
  date: string;
  questsCompleted: number;
  xpEarned: number;
}

export interface UserProgressionDto {
  id: string;
  username: string;
  totalXp: number;
  level: number;
  grade: string;
  gradeLabel: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export interface UserSummaryResponse {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  enabled: boolean;
  createdAt: string;
}

export interface InstanceSettingsResponse {
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  updatedAt: string;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  timezone: string;
  bio?: string | null;
  profilePictureUrl: string | null;
  role: 'USER' | 'ADMIN';
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type NotificationType =
  | 'QUEST_DUE_SOON'
  | 'QUEST_OVERDUE'
  | 'QUEST_COMPLETED'
  | 'LEVEL_UP'
  | 'STREAK_AT_RISK';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  questId?: string;
  read: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export const api = new ApiClient(API_BASE_URL);
