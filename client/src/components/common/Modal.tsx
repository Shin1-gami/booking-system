import type { ReactNode } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} transition className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/25 backdrop-blur-xs duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel
          transition
          className={`w-full ${sizeClasses[size]} rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl duration-200 ease-out data-closed:scale-95 data-closed:opacity-0 dark:border-slate-800 dark:bg-slate-900`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрити модальне вікно"
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}