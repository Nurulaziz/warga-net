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
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-control)] border-2 border-dashed border-ink bg-[var(--surface-card)] px-6 py-12 text-center dark:border-gray-500">
      <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-selected)] text-ink shadow-[var(--shadow-small)]">
        <ChatBubbleLeftRightIcon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-display text-base font-black text-ink dark:text-gray-100">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-ink-secondary dark:text-gray-300">{description}</p>
    </div>
  );
}
