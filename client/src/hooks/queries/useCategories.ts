import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesService, extractApiErrorMessage } from '@/services/api';
import { useToast } from '@/stores/uiStore';
import type { CreateCategoryDto, EntityId, ListQueryParams, UpdateCategoryDto } from '@/types';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params: ListQueryParams) => [...categoryKeys.lists(), params] as const,
  flat: () => [...categoryKeys.all, 'flat'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: EntityId) => [...categoryKeys.details(), String(id)] as const,
};

export function useCategoriesQuery(params: ListQueryParams) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoriesService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useFlatCategoriesQuery() {
  return useQuery({
    queryKey: categoryKeys.flat(),
    queryFn: () => categoriesService.getAllFlat(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryQuery(id: EntityId | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(id ?? ''),
    queryFn: () => categoriesService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: CreateCategoryDto) => categoriesService.create(dto),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success(`Категорію «${created.name}» створено`);
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });
}

export function useUpdateCategoryMutation(id: EntityId) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: UpdateCategoryDto) => categoriesService.update(id, dto),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success(`Категорію «${updated.name}» оновлено`);
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: EntityId) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Категорію видалено');
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });
}