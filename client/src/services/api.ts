import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  ApiErrorResponse,
  AuthResponse,
  Booking,
  Category,
  EntityId,
  PaginatedResponse,
  Resource,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ACCESS_TOKEN_KEY = 'booking_access_token';
const REFRESH_TOKEN_KEY = 'booking_refresh_token';
const USER_STORAGE_KEY = 'booking_user';

const normalizeAuthPayload = (raw: unknown): AuthResponse => {
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const payload = (
    root.data && typeof root.data === 'object' ? root.data : root
  ) as Record<string, unknown>;

  const accessToken = (payload.accessToken || payload.token || root.accessToken || root.token) as
    | string
    | undefined;
  const refreshToken = (payload.refreshToken || root.refreshToken) as string | undefined;
  const user = (payload.user || root.user) as User | undefined;

  return {
    accessToken: accessToken || '',
    ...(refreshToken && { refreshToken }),
    user: user as User,
  };
};

export const tokenStorage = {
  getAccessToken: (): string | null => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return token && token !== 'undefined' ? token : null;
  },
  getRefreshToken: (): string | null => {
    const token = localStorage.getItem(REFRESH_TOKEN_KEY);
    return token && token !== 'undefined' ? token : null;
  },
  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw || raw === 'undefined') return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  setSession: (data: AuthResponse): void => {
    if (data.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    }
  },
  clear: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  },
};

export const extractApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.error || data?.message || error.message || 'Помилка запиту до сервера';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Невідома помилка';
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
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

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        tokenStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );
        const normalized = normalizeAuthPayload(data);
        tokenStorage.setSession(normalized);
        processQueue(null, normalized.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${normalized.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    const normalized = normalizeAuthPayload(data);
    if (!normalized.accessToken) {
      throw new Error('Сервер не повернув токен авторизації');
    }
    tokenStorage.setSession(normalized);
    return normalized;
  },
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', { name, email, password });
    const normalized = normalizeAuthPayload(data);
    if (normalized.accessToken) {
      tokenStorage.setSession(normalized);
    } else {
      return authService.login(email, password);
    }
    return normalized;
  },
  logout: async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      tokenStorage.clear();
    }
  },
};

export const bookingService = {
  getResources: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: EntityId;
  }): Promise<PaginatedResponse<Resource>> => {
    const { data } = await api.get('/resources', { params });

    if (Array.isArray(data)) {
      return {
        data,
        pagination: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    const items: Resource[] = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.resources)
        ? data.resources
        : [];

    const rawPag = data?.pagination || data || {};
    const page = Number(rawPag.page) || 1;
    const limit = Number(rawPag.limit) || items.length || 9;
    const parsedTotal = Number(rawPag.total);
    const total =
      rawPag.total != null && Number.isFinite(parsedTotal) ? parsedTotal : items.length;
    const totalPages = Number(rawPag.totalPages) || Math.max(1, Math.ceil(total / limit));

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: rawPag.hasNextPage ?? page < totalPages,
        hasPreviousPage: rawPag.hasPreviousPage ?? page > 1,
      },
    };
  },
  getCategories: async (): Promise<Category[]> => {
    const { data } = await api.get('/categories');
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.categories)) return data.categories;
    return [];
  },
  createBooking: async (payload: {
    resourceId: EntityId;
    startTime: string;
    endTime: string;
  }): Promise<Booking> => {
    const { data } = await api.post('/bookings', payload);
    return (data?.data || data) as Booking;
  },
  getMyBookings: async (): Promise<PaginatedResponse<Booking>> => {
    const { data } = await api.get<PaginatedResponse<Booking>>('/bookings');
    return data;
  },
};

export default api;