import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResourcesListPage from './ResourcesListPage';
import { categoriesService, resourcesService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();
  return {
    ...actual,
    resourcesService: {
      ...actual.resourcesService,
      getAll: vi.fn(),
      delete: vi.fn(),
    },
    categoriesService: {
      ...actual.categoriesService,
      getAllFlat: vi.fn(),
    },
  };
});

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ResourcesListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 1, name: 'Admin', email: 'admin@example.com', role: 'ADMIN' },
    accessToken: 'test-token',
    isAuthenticated: true,
  });

  vi.mocked(categoriesService.getAllFlat).mockResolvedValue([
    { id: 1, name: 'Конференц-зали' },
  ]);

  vi.mocked(resourcesService.getAll).mockResolvedValue({
    data: [
      {
        id: 10,
        name: 'Зала «Оріон»',
        location: 'Корпус А',
        price: 500,
        status: 'AVAILABLE',
        category: { id: 1, name: 'Конференц-зали' },
      },
    ],
    pagination: {
      page: 1,
      limit: 9,
      total: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  });
});

test('завантажує список ресурсів і дозволяє підтвердити видалення через ConfirmModal', async () => {
  const user = userEvent.setup();
  vi.mocked(resourcesService.delete).mockResolvedValue(undefined);

  renderWithProviders();

  expect(await screen.findByText('Зала «Оріон»')).toBeInTheDocument();

  await user.click(screen.getByTitle('Видалити'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Видалити' }));

  await waitFor(() => {
    expect(resourcesService.delete).toHaveBeenCalledWith(10);
  });
});