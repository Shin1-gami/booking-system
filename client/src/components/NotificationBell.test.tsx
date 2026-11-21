import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from './NotificationBell';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { socket } from '@/services/socket';

vi.mock('@/services/socket', () => {
  type Handler = (payload: unknown) => void;
  const handlers = new Map<string, Set<Handler>>();
  return {
    socket: {
      on: (event: string, h: Handler) => {
        const set = handlers.get(event) ?? new Set<Handler>();
        set.add(h);
        handlers.set(event, set);
      },
      off: (event: string, h: Handler) => {
        handlers.get(event)?.delete(h);
      },
      emit: (event: string, payload: unknown) => {
        handlers.get(event)?.forEach((h) => h(payload));
      },
      count: (event: string) => handlers.get(event)?.size ?? 0,
    },
  };
});

const fakeSocket = socket as unknown as {
  emit: (event: string, payload: unknown) => void;
  count: (event: string) => number;
};

beforeEach(() => {
  useNotificationsStore.getState().clearAll();
});

test('подія notification збільшує лічильник, клік позначає сповіщення прочитаним', async () => {
  const user = userEvent.setup();
  render(<NotificationBell />);

  expect(screen.getByRole('button', { name: /непрочитаних 0/i })).toBeInTheDocument();

  act(() => {
    fakeSocket.emit('notification', {
      title: 'Нове бронювання',
      message: 'Конференц-зал №1 заброньовано',
    });
  });

  expect(screen.getByRole('button', { name: /непрочитаних 1/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Сповіщення/i }));
  await user.click(screen.getByText('Нове бронювання'));

  expect(screen.getByRole('button', { name: /непрочитаних 0/i })).toBeInTheDocument();
});

test('при розмонтуванні компонент знімає власний обробник події', () => {
  const { unmount } = render(<NotificationBell />);
  expect(fakeSocket.count('notification')).toBe(1);
  unmount();
  expect(fakeSocket.count('notification')).toBe(0);
});