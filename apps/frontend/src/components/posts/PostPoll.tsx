import { useMemo, useState } from 'react';
import { votePoll } from '@/services/posts';
import { useToast } from '@/components/ui/Toast';
import type { Poll } from '@/types/posts';

export function PostPoll({ postId, poll }: { postId: string; poll: Poll }) {
  const { showToast } = useToast();
  const [options, setOptions] = useState(poll.options);
  const [selected, setSelected] = useState<string | null>(poll.viewerOptionId);
  const [busy, setBusy] = useState(false);
  const total = useMemo(
    () => options.reduce((sum, option) => sum + option.voteCount, 0),
    [options],
  );

  async function choose(optionId: string) {
    if (busy || selected === optionId) return;
    setBusy(true);
    const previous = selected;
    try {
      await votePoll(postId, optionId);
      setOptions((items) =>
        items.map((item) => ({
          ...item,
          voteCount:
            item.id === optionId
              ? item.voteCount + 1
              : item.id === previous
                ? Math.max(0, item.voteCount - 1)
                : item.voteCount,
        })),
      );
      setSelected(optionId);
    } catch {
      showToast('Gagal menyimpan pilihan polling', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-sm border-2 border-ink p-4 dark:border-gray-500">
      <p className="mb-3 font-semibold text-gray-900 dark:text-gray-100">{poll.question}</p>
      <div className="space-y-2">
        {options.map((option) => {
          const percent = total ? Math.round((option.voteCount / total) * 100) : 0;
          return (
            <button
              key={option.id}
              disabled={busy}
              onClick={(event) => {
                event.stopPropagation();
                void choose(option.id);
              }}
              className={`relative w-full overflow-hidden rounded-sm border-2 border-ink px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-[#f5efe4] dark:border-gray-400 dark:text-gray-100 dark:hover:bg-gray-700 ${selected === option.id ? 'bg-[#fff8ec]' : 'bg-white dark:bg-gray-800'}`}
            >
              <span
                className="absolute inset-y-0 left-0 bg-[#e6d2b5] transition-[width] duration-300 dark:bg-gray-600"
                style={{ width: `${percent}%` }}
              />
              <span className="relative flex justify-between gap-2">
                <span>{option.text}</span>
                <span>{percent}%</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {total} suara{selected ? ' · Pilihan Anda tersimpan' : ''}
      </p>
    </div>
  );
}
