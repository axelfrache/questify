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
}

export interface ApiError {
  message: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

    if (!response.ok) {
      const error: ApiError = {
        message: await response.text(),
        status: response.status,
      };
      throw error;
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

  async getQuests(status?: 'PENDING' | 'COMPLETED' | 'CANCELLED'): Promise<QuestResponse[]> {
    const query = status ? `?status=${status}` : '';
    return this.request<QuestResponse[]>(`/api/quests${query}`);
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
    return this.request<QuestResponse>(`/api/quests/${id}/complete`, {
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

  async deleteCategory(id: string): Promise<void> {
    return this.request<void>(`/api/categories/${id}`, {
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

  async getUserProfile(id: string): Promise<UserDto> {
    return this.request<UserDto>(`/api/users/${id}`);
  }

  async getUserProgression(id: string): Promise<UserProgressionDto> {
    return this.request<UserProgressionDto>(`/api/users/${id}/progression`);
  }
}

export interface QuestResponse {
  id: string;
  title: string;
  description?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  category?: CategoryResponse;
  dueDate?: string;
  xpReward: number;
  createdAt: string;
  recurrenceInterval: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface CreateQuestRequest {
  title: string;
  description?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  categoryId?: string;
  dueDate?: string;
  recurrenceInterval?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface UpdateQuestRequest {
  title?: string;
  description?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  categoryId?: string;
  dueDate?: string;
  recurrenceInterval?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
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
  startDate: string;
  endDate: string;
  questsCompleted: number;
  xpEarned: number;
  dailyBreakdown: Record<string, number>;
}

export interface MonthlyStats {
  year: number;
  month: number;
  questsCompleted: number;
  xpEarned: number;
}

export interface ProgressSummary {
  totalXp: number;
  currentLevel: number;
  currentGrade: string;
  xpToNextLevel: number;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
}

export interface UserProgressionDto {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  grade: string;
}

export const api = new ApiClient(API_BASE_URL);
