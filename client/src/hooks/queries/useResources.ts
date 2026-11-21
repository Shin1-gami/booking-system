import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { extractApiErrorMessage, resourcesService } from '@/services/api';
import { useToast } from '@/stores/uiStore';
import type { CreateResourceDto, EntityId, ListQueryParams, UpdateResourceDto } from '@/types';

export const resourceKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (params: ListQueryParams) => [...resourceKeys.lists(), params] as const,
  details: () => [...resourceKeys.all, 'detail'] as const,
  detail: (id: EntityId) => [...resourceKeys.details(), String(id)] as const,
};

export function useResourcesQuery(params: ListQueryParams) {
  return useQuery({
    queryKey: resourceKeys.list(params),
    queryFn: () => resourcesService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useResourceQuery(id: EntityId | undefined) {
  return useQuery({
    queryKey: resourceKeys.detail(id ?? ''),
    queryFn: () => resourcesService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateResourceMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: CreateResourceDto) => resourcesService.create(dto),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.lists() });
      toast.success(`Ресурс «${created.name}» успішно створено`);
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });
}

export function useUpdateResourceMutation(id: EntityId) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (dto: UpdateResourceDto) => resourcesService.update(id, dto),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: resourceKeys.detail(id) });
      toast.success(`Ресурс «${updated.name}» оновлено`);
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });
}

export function useDeleteResourceMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: EntityId) => resourcesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.lists() });
      toast.success('Ресурс успішно видалено');
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });
}