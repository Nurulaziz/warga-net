import { useEffect, useMemo, useState } from 'react';
import { fetchPollResults, votePoll } from '@/services/posts';
import { useToast } from '@/components/ui/Toast';
import type { Poll, PollResults } from '@/types/posts';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Modal } from '@/components/ui/Modal';

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
  const expiresAt = poll.expiresAt;
  const [now, setNow] = useState(Date.now());
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [results, setResults] = useState<PollResults | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const ended = Boolean(expiresAt && new Date(expiresAt).getTime() <= now);
  const resultsAreVisible = poll.resultsVisible !== false || Boolean(selected) || ended;
  const total = useMemo(
    () => options.reduce((sum, option) => sum + option.voteCount, 0),
    [options],
  );

  async function choose(optionId: string) {
    if (busy || ended || selected === optionId) return;
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
      const detail = await fetchPollResults(postId);
      setOptions((items) => items.map((item) => ({
        ...item,
        voteCount: detail.options.find((option) => option.id === item.id)?.voteCount ?? item.voteCount,
      })));
    } catch {
      showToast('Gagal menyimpan pilihan polling', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function openResults() {
    setResultsOpen(true);
    setResultsLoading(true);
    try {
      setResults(await fetchPollResults(postId));
    } catch (error: unknown) {
      setResultsOpen(false);
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(message || 'Hasil polling belum dapat dilihat', 'error');
    } finally {
      setResultsLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-sm border-2 border-ink p-4 dark:border-gray-500">
      <p className="mb-3 font-semibold text-gray-900 dark:text-gray-100">{poll.question}</p>
      <div className="space-y-2">
        {options.map((option, index) => {
          const percent = resultsAreVisible && total ? Math.round((option.voteCount / total) * 100) : 0;
          const selectedOption = selected === option.id;
          const color = OPTION_COLORS[index % OPTION_COLORS.length];
          return (
            <button
              key={option.id}
              disabled={busy || ended}
              onClick={(event) => {
                event.stopPropagation();
                void choose(option.id);
              }}
              aria-pressed={selectedOption}
              className={`relative w-full overflow-hidden rounded-sm border-2 border-ink bg-white px-3 py-2 text-left text-sm font-medium text-ink transition-all hover:-translate-y-px dark:border-gray-400 dark:bg-gray-800 dark:text-gray-100 ${selectedOption ? 'shadow-[3px_3px_0_#171717]' : 'hover:shadow-[2px_2px_0_#171717]'}`}
            >
              <span
                className={`absolute inset-y-0 left-0 border-r border-ink/30 transition-[width] duration-300 ${color}`}
                style={{ width: resultsAreVisible ? `${percent}%` : '0%' }}
              />
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 font-semibold">
                  {selectedOption && <CheckCircleIcon className="h-4 w-4 flex-none text-ink" />}
                  <span className="truncate">{option.text}</span>
                </span>
                <span className="rounded-sm border border-ink bg-white/90 px-1.5 py-0.5 font-mono text-[11px] font-black text-ink">
                  {resultsAreVisible ? `${percent}%` : '—'}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500">{resultsAreVisible ? `${total} suara` : 'Hasil tersedia sesuai pengaturan polling'}{selected ? ' · Pilihan Anda tersimpan' : ''}{ended ? ' · Polling ditutup' : ''}</p>
        <button type="button" onClick={(event) => { event.stopPropagation(); void openResults(); }} className="rounded-sm px-2 py-1 text-xs font-black text-brand-700 hover:bg-[#f1dfc4] focus:outline-none focus:ring-2 focus:ring-ink/25 dark:text-blue-300">Lihat rincian</button>
      </div>
      <Modal isOpen={resultsOpen} onClose={() => setResultsOpen(false)} title="Rincian Hasil Polling" size="md">
        {resultsLoading ? <p className="py-10 text-center text-sm font-bold">Memuat hasil...</p> : results && (
          <div className="space-y-4">
            <div className="rounded-sm border-2 border-ink bg-[#f1dfc4] p-3 shadow-[2px_2px_0_#171717]">
              <p className="font-black text-ink">{poll.question}</p>
              <p className="mt-1 text-xs font-bold text-ink-secondary">{results.totalVotes} suara · {results.voterVisibility === 'SECRET' ? 'Suara Rahasia' : 'Pemilih Terlihat'}</p>
            </div>
            {results.options.map((option) => {
              const percent = results.totalVotes ? Math.round(option.voteCount / results.totalVotes * 100) : 0;
              return <div key={option.id} className="rounded-sm border-2 border-ink bg-white p-3 dark:border-gray-400 dark:bg-gray-800">
                <div className="flex justify-between gap-3"><p className="font-bold">{option.text}</p><p className="font-mono text-sm font-black">{option.voteCount} suara · {percent}%</p></div>
                <div className="mt-2 h-2 overflow-hidden border border-ink bg-[#fff8ec]"><div className="h-full bg-brand-500" style={{ width: `${percent}%` }} /></div>
                {option.voters && <div className="mt-2 flex flex-wrap gap-1.5">{option.voters.length ? option.voters.map((voter) => <span key={voter.id} className="rounded-sm border border-ink bg-[#fff8ec] px-2 py-1 text-xs font-semibold">{voter.fullName}</span>) : <span className="text-xs text-ink-muted">Belum ada pemilih</span>}</div>}
              </div>;
            })}
            {results.voterVisibility === 'SECRET' && <p className="text-xs font-semibold text-ink-secondary">Identitas pemilih dilindungi karena polling menggunakan Suara Rahasia.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
