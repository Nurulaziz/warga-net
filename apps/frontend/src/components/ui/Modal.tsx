import { ReactNode, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  headerExtra?: ReactNode;
  panelClassName?: string;
  contentClassName?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  headerExtra,
  panelClassName = '',
  contentClassName = '',
}: ModalProps) => {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/65 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`w-full ${sizeStyles[size]} max-h-[90vh] overflow-y-auto rounded-sm border-2 border-ink bg-[#fffdf8] shadow-[7px_7px_0_#171717] dark:border-gray-300 dark:bg-gray-800 dark:shadow-[7px_7px_0_#a3a3a3] ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-ink bg-[#fff8ec] px-6 py-4 dark:border-gray-500 dark:bg-gray-900">
          {title ? (
            <h2 id="modal-title" className="font-display text-xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1">
            {headerExtra}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-ink bg-white text-ink shadow-[2px_2px_0_#171717] transition-transform hover:translate-x-px hover:translate-y-px hover:bg-[#f1dfc4] hover:shadow-none focus:outline-none focus:ring-2 focus:ring-ink dark:border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:shadow-[2px_2px_0_#d4d4d4] dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className={`px-6 py-4 text-ink dark:text-gray-100 ${contentClassName}`}>{children}</div>
      </div>
    </div>
  );
};

interface ModalFooterProps {
  children: ReactNode;
}

export const ModalFooter = ({ children }: ModalFooterProps) => {
  return (
    <div className="-mx-6 -mb-4 mt-6 flex justify-end gap-3 border-t-2 border-ink bg-[#fff8ec] px-6 py-4 dark:border-gray-500 dark:bg-gray-900">
      {children}
    </div>
  );
};
