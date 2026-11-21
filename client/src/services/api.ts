import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '@/constants/config';
import type {
  AuthResponse,
  Booking,
  Category,
  CreateBookingDto,
  CreateCategoryDto,
  CreateResourceDto,
  EntityId,
  ListQueryParams,
  PaginatedResponse,
  Resource,
  UpdateBookingDto,
  UpdateCategoryDto,
  UpdateResourceDto,
  User,
} from '@/types';

const TOKEN_KEYS = {
  access: 'accessToken',
  refresh: 'refreshToken',
  user: 'authUser',
} as const;

export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(TOKEN_KEYS.access),
  getRefreshToken: (): string | null => localStorage.getItem(TOKEN_KEYS.refresh),
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem(TOKEN_KEYS.access, accessToken);
    if (refreshToken) {
      localStorage.setItem(TOKEN_KEYS.refresh, refreshToken);
    }
  },
  getUser: (): User | null => {
    const raw = localStorage.getItem(TOKEN_KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  setUser: (user: User | null) => {
    if (!user) {
      localStorage.removeItem(TOKEN_KEYS.user);
      return;
    }
    localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
    localStorage.removeItem(TOKEN_KEYS.user);
  },
};

export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          error?: string;
          errors?: Array<{ message?: string }>;
          details?: Array<{ field?: string; message?: string }>;
        }
      | undefined;

    if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
      return data.details
        .map((d) => (d.field ? `${d.field}: ${d.message}` : d.message))
        .filter(Boolean)
        .join('; ');
    }
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((e) => e.message).filter(Boolean).join('; ');
    }
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (typeof data?.error === 'string' && data.error.trim()) {
      return data.error;
    }
    if (error.message === 'Network Error') {
      return 'Не вдалося з’єднатися із сервером. Перевірте підключення до мережі.';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Виникла непередбачена помилка. Спробуйте ще раз.';
}

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clear();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post<{ data?: { accessToken: string; refreshToken?: string }; accessToken?: string; refreshToken?: string }>(
          `${APP_CONFIG.apiUrl}/auth/refresh`,
          { refreshToken }
        );
        const payload = res.data?.data ?? res.data;
        if (!payload?.accessToken) {
          throw new Error('Не вдалося оновити токен доступу');
        }
        tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
        processQueue(null, payload.accessToken);
        originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clear();
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function normalizePaginated<T>(
  raw: unknown,
  params: ListQueryParams = {}
): PaginatedResponse<T> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: T[] }).data)) {
    const typed = raw as { data: T[]; pagination?: PaginatedResponse<T>['pagination'] };
    if (typed.pagination) {
      return { data: typed.data, pagination: typed.pagination };
    }
    const total = typed.data.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data: typed.data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  }

  const list = Array.isArray(raw) ? (raw as T[]) : [];
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    data: list.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
}

function unwrapItem<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', { email, password });
    const payload = unwrapItem<AuthResponse>(response.data);
    tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
    tokenStorage.setUser(payload.user);
    return payload;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', { name, email, password });
    const payload = unwrapItem<AuthResponse>(response.data);
    if (payload.accessToken) {
      tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
    }
    if (payload.user) {
      tokenStorage.setUser(payload.user);
    }
    return payload;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    const user = unwrapItem<User>(response.data);
    tokenStorage.setUser(user);
    return user;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {});
    } catch {
      // Ігноруємо мережеву помилку під час виходу
    } finally {
      tokenStorage.clear();
    }
  },
};

export const resourcesService = {
 async getAll(params: ListQueryParams = {}): Promise<PaginatedResponse<Resource>> {
    const { sortOrder, ...rest } = params;
    const response = await apiClient.get('/resources', {
      params: {
        ...rest,
        ...(sortOrder ? { order: sortOrder } : {}),
      },
    });
    return normalizePaginated<Resource>(response.data, params);
  },

  async getById(id: EntityId): Promise<Resource> {
    const response = await apiClient.get(`/resources/${id}`);
    return unwrapItem<Resource>(response.data);
  },

  async create(dto: CreateResourceDto): Promise<Resource> {
    const response = await apiClient.post('/resources', dto);
    return unwrapItem<Resource>(response.data);
  },

  async update(id: EntityId, dto: UpdateResourceDto): Promise<Resource> {
    const response = await apiClient.put(`/resources/${id}`, dto);
    return unwrapItem<Resource>(response.data);
  },

  async delete(id: EntityId): Promise<void> {
    await apiClient.delete(`/resources/${id}`);
  },
};

export const bookingsService = {
  async getAll(params: ListQueryParams = {}): Promise<PaginatedResponse<Booking>> {
    const response = await apiClient.get('/bookings', { params });
    return normalizePaginated<Booking>(response.data, params);
  },

  async getById(id: EntityId): Promise<Booking> {
    const response = await apiClient.get(`/bookings/${id}`);
    return unwrapItem<Booking>(response.data);
  },

  async create(dto: CreateBookingDto): Promise<Booking> {
    const response = await apiClient.post('/bookings', dto);
    return unwrapItem<Booking>(response.data);
  },

  async update(id: EntityId, dto: UpdateBookingDto): Promise<Booking> {
    const response = await apiClient.put(`/bookings/${id}`, dto);
    return unwrapItem<Booking>(response.data);
  },

  async delete(id: EntityId): Promise<void> {
    await apiClient.delete(`/bookings/${id}`);
  },
};

export const categoriesService = {
  async getAll(params: ListQueryParams = {}): Promise<PaginatedResponse<Category>> {
    const response = await apiClient.get('/categories', { params });
    return normalizePaginated<Category>(response.data, params);
  },

  async getAllFlat(): Promise<Category[]> {
    const response = await apiClient.get('/categories', { params: { limit: 100 } });
    return normalizePaginated<Category>(response.data, { limit: 100 }).data;
  },

  async getById(id: EntityId): Promise<Category> {
    const response = await apiClient.get(`/categories/${id}`);
    return unwrapItem<Category>(response.data);
  },

  async create(dto: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.post('/categories', dto);
    return unwrapItem<Category>(response.data);
  },

  async update(id: EntityId, dto: UpdateCategoryDto): Promise<Category> {
    const response = await apiClient.put(`/categories/${id}`, dto);
    return unwrapItem<Category>(response.data);
  },

  async delete(id: EntityId): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};

// Зворотна сумісність із публічним каталогом 
export const bookingService = {
  getCategories: () => categoriesService.getAllFlat(),
  getResources: (params: ListQueryParams = {}) => resourcesService.getAll(params),
  createBooking: (dto: CreateBookingDto) => bookingsService.create(dto),
  getMyBookings: async (params: ListQueryParams = {}): Promise<Booking[]> => {
    const res = await bookingsService.getAll(params);
    return res.data;
  },
};