export type EntityId = string | number;

export type UserRole = 'USER' | 'ADMIN';

export type ResourceStatus = 'AVAILABLE' | 'MAINTENANCE' | 'UNAVAILABLE';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type SortOrder = 'asc' | 'desc';

export interface User {
  id: EntityId;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: EntityId;
  name: string;
  description?: string | null;
  _count?: {
    resources?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Resource {
  id: EntityId;
  name: string;
  description?: string | null;
  location?: string | null;
  price: number | string;
  capacity?: number | null;
  status?: ResourceStatus;
  imageUrl?: string | null;
  categoryId?: EntityId | null;
  category?: Category | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: EntityId;
  resourceId: EntityId;
  resource?: Resource | null;
  userId?: EntityId;
  user?: User | Pick<User, 'id' | 'name' | 'email'> | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string | null;
  totalPrice?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  categoryId?: string;
  status?: string;
  resourceId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateResourceDto {
  name: string;
  description?: string;
  location?: string;
  price: number;
  capacity?: number;
  status?: ResourceStatus;
  categoryId?: EntityId | null;
}

export type UpdateResourceDto = Partial<CreateResourceDto>;

export interface CreateBookingDto {
  resourceId: EntityId;
  startTime: string;
  endTime: string;
  notes?: string;
  status?: BookingStatus;
}

export type UpdateBookingDto = Partial<CreateBookingDto>;

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;