import { useMemo, useState } from 'react';
import { votePoll } from '@/services/posts';
import { useToast } from '@/components/ui/Toast';
import type { Poll } from '@/types/posts';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

// Palet berurutan: hangat, sage, amber, biru-abu, rose, lavender.
// Semua cukup lembut agar teks hitam tetap terbaca dan tidak bersaing dengan CTA utama.
const OPTION_COLORS = [
  'bg-[#E8CFAF]',
  'bg-[#BFD8C0]',
  'bg-[#F2C879]',
  'bg-[#BFCFE3]',
  'bg-[#DDB8BC]',
  'bg-[#CFC3DF]',
] as const;

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
        {options.map((option, index) => {
          const percent = total ? Math.round((option.voteCount / total) * 100) : 0;
          const selectedOption = selected === option.id;
          const color = OPTION_COLORS[index % OPTION_COLORS.length];
          return (
            <button
              key={option.id}
              disabled={busy}
              onClick={(event) => {
                event.stopPropagation();
                void choose(option.id);
              }}
              aria-pressed={selectedOption}
              className={`relative w-full overflow-hidden rounded-sm border-2 border-ink bg-white px-3 py-2 text-left text-sm font-medium text-ink transition-all hover:-translate-y-px dark:border-gray-400 dark:bg-gray-800 dark:text-gray-100 ${selectedOption ? 'shadow-[3px_3px_0_#171717]' : 'hover:shadow-[2px_2px_0_#171717]'}`}
            >
              <span
                className={`absolute inset-y-0 left-0 border-r border-ink/30 transition-[width] duration-300 ${color}`}
                style={{ width: `${percent}%` }}
              />
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 font-semibold">
                  {selectedOption && <CheckCircleIcon className="h-4 w-4 flex-none text-ink" />}
                  <span className="truncate">{option.text}</span>
                </span>
                <span className="rounded-sm border border-ink bg-white/90 px-1.5 py-0.5 font-mono text-[11px] font-black text-ink">
                  {percent}%
                </span>
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
