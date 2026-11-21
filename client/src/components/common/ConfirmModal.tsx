import ConfirmDialog from './ConfirmDialog';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = 'Підтвердження видалення',
  description,
  confirmLabel = 'Видалити',
  cancelLabel = 'Скасувати',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      message={description}
      confirmText={confirmLabel}
      cancelText={cancelLabel}
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}