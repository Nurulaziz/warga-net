import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = 'Belum ada posting',
  description = 'Jadi yang pertama menyapa warga di Suara Warga. Bagikan kabar, info, atau aspirasi komunitas.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-600 dark:bg-gray-800">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
        <ChatBubbleLeftRightIcon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
