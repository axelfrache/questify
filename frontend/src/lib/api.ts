const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  profilePictureUrl: string | null;
  role: 'USER' | 'ADMIN';
}

export interface ApiError {
  message: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private onUnauthorized: (() => void) | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<AuthResponse> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
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

    this.isRefreshing = true;
    try {
      this.refreshPromise = this.refreshTokenRequest();
      await this.refreshPromise;
      return true;
    } catch {
      return false;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && retry) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      } else {
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        const error: ApiError = {
          message: 'Session expired. Please log in again.',
          status: response.status,
        };
        throw error;
      }
    }

    if (response.status === 403) {
      const error: ApiError = {
        message: 'Access denied.',
        status: response.status,
      };
      throw error;
    }

    if (!response.ok) {
      let message = 'An error occurred';
      try {
        const errorData = await response.json();
        message = errorData.message || message;
      } catch {
        const text = await response.text();
        if (text && text.length < 200) {
          message = text;
        }
      }
      const error: ApiError = {
        message,
        status: response.status,
      };
      throw error;
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
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
    view?: 'today' | 'inbox' | 'upcoming' | 'recurring'
  ): Promise<QuestResponse[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (view) params.append('view', view);
    return this.request<QuestResponse[]>(`/api/quests?${params.toString()}`);
  }

  async getQuest(id: string): Promise<QuestResponse> {
    return this.request<QuestResponse>(`/api/quests/${id}`);
  }

  async getSubquests(parentId: string): Promise<QuestResponse[]> {
    return this.request<QuestResponse[]>(`/api/quests/${parentId}/subquests`);
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

  async getCategories(): Promise<CategoryResponse[]> {
    return this.request<CategoryResponse[]>('/api/categories');
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

  async getDailyStats(): Promise<DailyStats> {
    return this.request<DailyStats>('/api/stats/today');
  }

  async getWeeklyStats(): Promise<WeeklyStats> {
    return this.request<WeeklyStats>('/api/stats/week');
  }

  async getMonthlyStats(): Promise<MonthlyStats> {
    return this.request<MonthlyStats>('/api/stats/month');
  }

  async getProgressSummary(): Promise<ProgressSummary> {
    return this.request<ProgressSummary>('/api/stats/summary');
  }

  async getCategoryStats(): Promise<CategoryStats[]> {
    return this.request<CategoryStats[]>('/api/stats/categories');
  }

  async getCompletionRate(): Promise<DailyCompletionRate> {
    return this.request<DailyCompletionRate>('/api/stats/completion-rate');
  }

  async getRegionActivity(): Promise<RegionActivityStats[]> {
    return this.request<RegionActivityStats[]>('/api/stats/region-activity');
  }

  async getWeeklyCompletionRates(): Promise<DailyCompletionRate[]> {
    return this.request<DailyCompletionRate[]>('/api/stats/weekly-completion');
  }

  async getMonthlyCompletionRates(year: number, month: number): Promise<DailyCompletionRate[]> {
    return this.request<DailyCompletionRate[]>(
      `/api/stats/monthly-completion?year=${year}&month=${month}`
    );
  }

  async getUserProfile(id: string): Promise<UserDto> {
    return this.request<UserDto>(`/api/users/${id}`);
  }

  async getUserProgression(id: string): Promise<UserProgressionDto> {
    return this.request<UserProgressionDto>(`/api/users/${id}/progression`);
  }

  async uploadProfilePicture(id: string, file: File): Promise<UserDto> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/api/users/${id}/profile-picture`;
    const headers: Record<string, string> = {};

    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw { message: 'Failed to upload profile picture', status: response.status };
    }

    return response.json();
  }

  async deleteProfilePicture(id: string): Promise<UserDto> {
    return this.request<UserDto>(`/api/users/${id}/profile-picture`, {
      method: 'DELETE',
    });
  }

  async updateUserProfile(
    id: string,
    data: { username?: string; timezone?: string }
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
    const url = `${this.baseUrl}/api/users/${id}/password`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let message = 'Failed to change password';
      try {
        const errorData = await response.json();
        message = errorData.message || message;
      } catch {
        // Ignore JSON parse error
      }
      throw { message, status: response.status };
    }
  }

  async deleteAccount(id: string, password: string): Promise<void> {
    return this.request<void>(`/api/users/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  async getSettings(): Promise<{ registrationEnabled: boolean; initialized: boolean }> {
    return this.request('/api/admin/settings');
  }

  async updateSettings(updates: {
    registrationEnabled: boolean;
  }): Promise<{ registrationEnabled: boolean; initialized: boolean }> {
    return this.request('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getUsers(page: number = 0, query?: string): Promise<Page<UserDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: '20',
      sort: 'createdAt,desc',
    });
    if (query) {
      params.append('query', query);
    }
    return this.request<Page<UserDto>>(`/api/admin/users?${params.toString()}`);
  }

  async adminCreateUser(data: AdminCreateUserRequest): Promise<UserDto> {
    return this.request<UserDto>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminUpdateUser(id: string, data: AdminUpdateUserRequest): Promise<UserDto> {
    return this.request<UserDto>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async adminUpdateUserStatus(id: string, isEnabled: boolean): Promise<UserDto> {
    return this.request<UserDto>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isEnabled }),
    });
  }

  async adminUpdateUserRole(id: string, role: string): Promise<UserDto> {
    return this.request<UserDto>(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async adminDeleteUser(id: string): Promise<void> {
    return this.request<void>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
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
  dueDate?: string;
  baseXpReward: number;
  totalXpReward: number;
  createdAt: string;
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
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
  icon: string;
}

export interface DailyStats {
  date: string;
  questsCompleted: number;
  xpEarned: number;
}

export interface WeeklyStats {
  questsCompleted: number;
  xpEarned: number;
  averagePerDay: number;
  dailyBreakdown: DailyStats[];
}

export interface MonthlyStats {
  questsCompleted: number;
  xpEarned: number;
  activeDays: number;
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

export interface ProgressSummary {
  today: DailyStats;
  thisWeek: WeeklyStats;
  thisMonth: MonthlyStats;
  totalQuestsCompleted: number;
  favoriteCategory: string | null;
  levelProgress: UserProgressionDto;
}

export interface AdminCreateUserRequest {
  username: string;
  email: string;
  password?: string;
  role: 'USER' | 'ADMIN';
  isEnabled: boolean;
}

export interface AdminUpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: 'USER' | 'ADMIN';
  isEnabled?: boolean;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  timezone: string;
  profilePictureUrl: string | null;
  role: 'USER' | 'ADMIN';
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryStats {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  totalQuests: number;
  completedQuests: number;
  progress: number;
  grade: string;
}

export interface DailyCompletionRate {
  date: string;
  plannedQuests: number;
  completedQuests: number;
  completionRate: number;
}

export interface RegionActivityStats {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  completedThisMonth: number;
}

export const api = new ApiClient(API_BASE_URL);
