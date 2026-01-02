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

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('profilePictureUrl');
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

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
      this.refreshPromise = this.refreshTokenRequest(refreshToken);
      const response = await this.refreshPromise;

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      return true;
    } catch {
      this.clearTokens();
      return false;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async refreshTokenRequest(refreshToken: string): Promise<AuthResponse> {
    const url = `${this.baseUrl}/api/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
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

    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if ((response.status === 401 || response.status === 403) && retry) {
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

    if (!response.ok) {
      const error: ApiError = {
        message: await response.text(),
        status: response.status,
      };
      throw error;
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return response.json();
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

  async refresh(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(refreshToken: string): Promise<void> {
    await this.request<void>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
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
    const accessToken = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw { message: await response.text(), status: response.status };
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
    const accessToken = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw { message: await response.text(), status: response.status };
    }
  }
}

export interface QuestResponse {
  id: string;
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

export interface UserDto {
  id: string;
  username: string;
  email: string;
  timezone: string;
  profilePictureUrl: string | null;
}

export interface UserProgressionDto {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  grade: string;
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
