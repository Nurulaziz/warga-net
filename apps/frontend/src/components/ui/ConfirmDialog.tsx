import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message,
  confirmText = 'Ya, lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3 rounded-sm border-2 border-ink bg-[#fff8ec] p-3 shadow-[2px_2px_0_#171717] dark:border-gray-400 dark:bg-gray-800">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border-2 border-ink dark:border-gray-300 ${variant === 'danger' ? 'bg-[#ffe4e1] text-red-700' : 'bg-[#f1dfc4] text-ink'}`}>
          <ExclamationTriangleIcon className="h-5 w-5" />
        </div>
        <p className="pt-1.5 text-sm font-semibold leading-relaxed text-ink dark:text-gray-100">{message}</p>
      </div>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
