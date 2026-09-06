import type { ButtonHTMLAttributes } from 'react';
import { CheckCircleIcon, PencilIcon, PrinterIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';

interface TableActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  action: 'edit' | 'delete' | 'print' | 'approve' | 'impersonate';
  label: string;
}

// Satu sumber gaya untuk aksi tabel agar ikon edit/hapus konsisten di setiap halaman.
export function TableActionButton({ action, label, className = '', onClick, ...props }: TableActionButtonProps) {
  const config = {
    edit: { Icon: PencilIcon, title: 'Edit', tone: 'bg-white text-ink hover:bg-[#f1dfc4] dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700' },
    delete: { Icon: TrashIcon, title: 'Hapus', tone: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-200' },
    print: { Icon: PrinterIcon, title: 'Cetak', tone: 'bg-white text-ink hover:bg-[#f1dfc4] dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700' },
    approve: { Icon: CheckCircleIcon, title: 'Setujui', tone: 'bg-green-100 text-ink hover:bg-green-200 dark:bg-green-950 dark:text-green-100' },
    impersonate: { Icon: UserIcon, title: 'Masuk sebagai pengguna', tone: 'bg-white text-ink hover:bg-[#f1dfc4] dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700' },
  }[action];
  const { Icon, title, tone } = config;

  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-sm border-2 border-ink shadow-[2px_2px_0_#171717] transition-transform hover:translate-x-px hover:translate-y-px hover:shadow-none focus:outline-none focus:ring-2 focus:ring-ink disabled:cursor-not-allowed disabled:bg-[#eee4d4] disabled:text-gray-600 disabled:opacity-100 dark:border-gray-300 ${tone} ${className}`}
      {...props}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
