import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

test('відображає заголовок, текст та викликає onConfirm при натисканні кнопки підтвердження', async () => {
  const user = userEvent.setup();
  const handleConfirm = vi.fn();
  const handleCancel = vi.fn();

  render(
    <ConfirmDialog
      isOpen
      title="Видалення ресурсу"
      message="Ви впевнені, що хочете видалити цей ресурс?"
      confirmText="Видалити"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Видалення ресурсу')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Видалити' }));
  expect(handleConfirm).toHaveBeenCalledTimes(1);
});

test('закривається при натисканні клавіші Escape або кнопки Скасувати', async () => {
  const user = userEvent.setup();
  const handleCancel = vi.fn();

  render(
    <ConfirmDialog
      isOpen
      title="Підтвердження"
      message="Скасувати дію?"
      onConfirm={vi.fn()}
      onCancel={handleCancel}
    />
  );

  await user.keyboard('{Escape}');
  expect(handleCancel).toHaveBeenCalledTimes(1);
});