export type EntityId = string | number;

export type UserRole = 'USER' | 'ADMIN';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface User {
  id: EntityId;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

export interface Category {
  id: EntityId;
  name: string;
  _count?: {
    resources: number;
  };
}

export interface Resource {
  id: EntityId;
  name: string;
  description?: string | null;
  price: number;
  location?: string | null;
  imageUrl?: string | null;
  categoryId: EntityId;
  category?: Category | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: EntityId;
  userId: EntityId;
  resourceId: EntityId;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  resource?: Resource;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
}