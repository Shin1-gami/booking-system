import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsService, extractApiErrorMessage } from '@/services/api';
import { useToast } from '@/stores/uiStore';
import type { CreateBookingDto, EntityId, ListQueryParams, UpdateBookingDto } from '@/types';

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (params: ListQueryParams) => [...bookingKeys.lists(), params] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: EntityId) => [...bookingKeys.details(), String(id)] as const,
};

export function useBookingsQuery(params: ListQueryParams) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => bookingsService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useBookingQuery(id: EntityId | undefined) {
  return useQuery({
    queryKey: bookingKeys.detail(id ?? ''),
    queryFn: () => bookingsService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: CreateBookingDto) => bookingsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast.success('Бронювання успішно створено');
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });
}

export function useUpdateBookingMutation(id: EntityId) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: UpdateBookingDto) => bookingsService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      toast.success('Бронювання оновлено');
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });
}

export function useDeleteBookingMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: EntityId) => bookingsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast.success('Бронювання видалено');
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });
}