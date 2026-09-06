import { useRef, useState } from 'react';
import { ChartBarIcon, ClockIcon, EyeIcon, PaperAirplaneIcon, PhotoIcon, PlusIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { uploadPostMedia } from '@/services/posts';
import type { PostMediaItem } from '@/types/posts';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { MentionTextarea } from '@/components/posts/MentionTextarea';
import { FilterSelect } from '@/components/ui/FilterBar';

interface PostComposerProps {
  currentUserName: string;
  currentUserAvatar?: string | null;
  onSubmit: (
    content: string,
    media: PostMediaItem[],
    poll?: { question: string; options: string[]; expiresAt?: string; voterVisibility?: 'SECRET' | 'VISIBLE'; resultVisibility?: 'ALWAYS' | 'AFTER_VOTE' | 'AFTER_END' },
    mentionedUserIds?: string[],
  ) => Promise<void>;
  disabled?: boolean;
}

export function PostComposer({ currentUserName, currentUserAvatar, onSubmit, disabled }: PostComposerProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<PostMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('3d');
  const [pollCustomEnd, setPollCustomEnd] = useState('');
  const [pollVoterVisibility, setPollVoterVisibility] = useState<'SECRET' | 'VISIBLE'>('SECRET');
  const [pollResultVisibility, setPollResultVisibility] = useState<'ALWAYS' | 'AFTER_VOTE' | 'AFTER_END'>('AFTER_VOTE');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    if (media.length + files.length > 4) {
      showToast('Maksimal 4 gambar per posting', 'error');
      return;
    }
    setUploading(true);
    try {
      for (const file of files) {
        const res = await uploadPostMedia(file);
        setMedia((prev) => [...prev, { url: res.url, mediaType: 'IMAGE', size: res.size }]);
      }
    } catch {
      showToast('Gagal mengunggah gambar', 'error');
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(url: string) {
    setMedia((prev) => prev.filter((m) => m.url !== url));
  }

  async function handleSubmit() {
    const text = content.trim();
    const validPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
    if (!text && media.length === 0 && !pollEnabled) {
      setError('Tuliskan sesuatu dulu');
      return;
    }
    if (pollEnabled && (!pollQuestion.trim() || validPollOptions.length < 2)) {
      setError('Isi pertanyaan dan minimal 2 pilihan polling');
      return;
    }
    let expiresAt: string | undefined;
    if (pollEnabled && pollDuration !== 'none') {
      if (pollDuration === 'custom') {
        if (!pollCustomEnd || new Date(pollCustomEnd).getTime() <= Date.now()) {
          setError('Pilih waktu berakhir polling yang masih akan datang');
          return;
        }
        expiresAt = new Date(pollCustomEnd).toISOString();
      } else {
        const durationMs: Record<string, number> = { '1h': 3_600_000, '1d': 86_400_000, '3d': 259_200_000, '7d': 604_800_000 };
        expiresAt = new Date(Date.now() + durationMs[pollDuration]).toISOString();
      }
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(
        text,
        media,
        pollEnabled ? { question: pollQuestion.trim(), options: validPollOptions, ...(expiresAt ? { expiresAt } : {}), voterVisibility: pollVoterVisibility, resultVisibility: pollResultVisibility } : undefined,
        mentionedUserIds,
      );
      setContent('');
      setMedia([]);
      setPollEnabled(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollDuration('3d');
      setPollCustomEnd('');
      setPollVoterVisibility('SECRET');
      setPollResultVisibility('AFTER_VOTE');
      setMentionedUserIds([]);
    } catch {
      setError('Gagal memposting. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-sm border-2 border-ink bg-white p-4 shadow-[3px_3px_0_#171717] dark:border-gray-500 dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <UserAvatar name={currentUserName || 'Warga'} src={currentUserAvatar} />
        <MentionTextarea
          value={content}
          onChange={setContent}
          onMention={(user) => setMentionedUserIds((ids) => ids.includes(user.id) ? ids : [...ids, user.id])}
          rows={2}
          maxLength={5000}
          disabled={disabled}
          placeholder="Apa yang ingin Anda sampaikan ke warga?"
          className="min-h-[76px] w-full resize-none rounded-sm border-2 border-ink bg-[#fffaf2] px-4 py-3 text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-ink/25 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {media.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {media.map((m) => (
            <div key={m.url} className="group relative rounded-sm border-2 border-ink bg-white p-1 shadow-[2px_2px_0_#171717]">
              <img src={m.url} alt="Pratinjau" className="h-20 w-full object-cover" />
              <button
                type="button"
                onClick={() => removeMedia(m.url)}
                aria-label="Hapus gambar"
                title="Hapus gambar"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-sm border-2 border-ink bg-white text-ink shadow-[1px_1px_0_#171717] transition hover:bg-red-50 hover:text-red-600"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {pollEnabled && (
        <div className="mt-3 space-y-3 rounded-sm border-2 border-ink bg-[#fff8ec] p-3 shadow-[2px_2px_0_#171717] dark:border-gray-500 dark:bg-gray-700">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2 dark:border-gray-500">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink bg-[#f1dfc4] text-ink">
                <ChartBarIcon className="h-4 w-4" />
              </span>
              <p className="font-display text-sm font-black text-ink dark:text-gray-100">Buat polling</p>
            </div>
            <button
              type="button"
              onClick={() => setPollEnabled(false)}
              aria-label="Hapus polling"
              title="Hapus polling"
              className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-ink bg-white text-ink shadow-[2px_2px_0_#171717] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-red-50 hover:text-red-600 hover:shadow-none focus:outline-none focus:ring-2 focus:ring-ink/25 dark:bg-gray-800 dark:text-white"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <input
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            maxLength={300}
            placeholder="Pertanyaan polling"
            aria-label="Pertanyaan polling"
            className="min-h-11 w-full rounded-sm border-2 border-ink bg-white px-3 py-2 text-sm font-semibold text-ink outline-none shadow-[1px_1px_0_#171717] transition-colors placeholder:text-ink/50 focus:border-ink focus:ring-2 focus:ring-ink/25 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
          />
          {pollOptions.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={option}
                onChange={(e) =>
                  setPollOptions((items) =>
                    items.map((item, i) => (i === index ? e.target.value : item)),
                  )
                }
                maxLength={200}
                placeholder={`Pilihan ${index + 1}`}
                aria-label={`Pilihan polling ${index + 1}`}
                className="min-h-11 flex-1 rounded-sm border-2 border-ink bg-white px-3 py-2 text-sm font-medium text-ink outline-none transition-colors placeholder:text-ink/50 focus:border-ink focus:ring-2 focus:ring-ink/25 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => setPollOptions((items) => items.filter((_, i) => i !== index))}
                  aria-label={`Hapus pilihan ${index + 1}`}
                  title={`Hapus pilihan ${index + 1}`}
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-sm border-2 border-ink bg-white text-ink transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-ink/25 dark:bg-gray-800 dark:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button
              type="button"
              onClick={() => setPollOptions((items) => [...items, ''])}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-ink bg-white px-3 text-sm font-bold text-ink transition-colors hover:bg-[#f1dfc4] focus:outline-none focus:ring-2 focus:ring-ink/25 dark:bg-gray-800 dark:text-white"
            >
              <PlusIcon className="h-4 w-4" /> Tambah pilihan
            </button>
          )}
          <div className="grid gap-2 border-t-2 border-ink pt-3 dark:border-gray-500 sm:grid-cols-2">
            <div className="text-xs font-black uppercase text-ink dark:text-gray-100">
              <label id="poll-duration-label">Durasi polling</label>
              <FilterSelect
                value={pollDuration}
                onChange={(event) => setPollDuration(event.target.value)}
                className="mt-1 min-w-0 normal-case"
                aria-label="Durasi polling"
                icon={<ClockIcon className="h-3.5 w-3.5" />}
              >
                <option value="1h">1 jam</option>
                <option value="1d">1 hari</option>
                <option value="3d">3 hari</option>
                <option value="7d">7 hari</option>
                <option value="custom">Tanggal khusus</option>
                <option value="none">Tanpa batas waktu</option>
              </FilterSelect>
            </div>
            {pollDuration === 'custom' && (
              <label className="text-xs font-black uppercase text-ink dark:text-gray-100">
                Berakhir pada
                <input
                  type="datetime-local"
                  value={pollCustomEnd}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                  onChange={(event) => setPollCustomEnd(event.target.value)}
                  className="mt-1 h-11 w-full rounded-sm border-2 border-ink bg-white px-3 text-sm font-bold text-ink shadow-[1px_1px_0_#171717] focus:outline-none focus:ring-2 focus:ring-ink/25 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                />
              </label>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="text-xs font-black uppercase text-ink dark:text-gray-100">
              <label>Privasi suara</label>
              <FilterSelect value={pollVoterVisibility} onChange={(event) => setPollVoterVisibility(event.target.value as 'SECRET' | 'VISIBLE')} className="mt-1 min-w-0 normal-case" aria-label="Privasi suara" icon={<UserGroupIcon className="h-3.5 w-3.5" />}>
                <option value="SECRET">Suara Rahasia</option>
                <option value="VISIBLE">Pemilih Terlihat</option>
              </FilterSelect>
            </div>
            <div className="text-xs font-black uppercase text-ink dark:text-gray-100">
              <label>Hasil terlihat</label>
              <FilterSelect value={pollResultVisibility} onChange={(event) => setPollResultVisibility(event.target.value as 'ALWAYS' | 'AFTER_VOTE' | 'AFTER_END')} className="mt-1 min-w-0 normal-case" aria-label="Waktu hasil terlihat" icon={<EyeIcon className="h-3.5 w-3.5" />}>
                <option value="ALWAYS">Sejak Dipublikasikan</option>
                <option value="AFTER_VOTE">Setelah Memilih</option>
                <option value="AFTER_END">Setelah Polling Berakhir</option>
              </FilterSelect>
            </div>
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-ink-secondary dark:text-gray-300">
            {pollVoterVisibility === 'SECRET' ? 'Identitas pemilih tidak akan ditampilkan.' : 'Nama pemilih dapat dilihat pada rincian hasil.'}
          </p>
        </div>
      )}

      {error && <p className="mt-2 pl-14 text-xs text-red-500">{error}</p>}
      <div className="mt-4 flex items-center gap-2 border-t-2 border-ink pt-3 dark:border-gray-500">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || media.length >= 4}
          className="flex min-h-9 items-center gap-1.5 rounded-sm border border-ink px-3 py-1.5 text-sm font-semibold text-gray-600 transition hover:bg-[#f5efe4] hover:text-ink disabled:opacity-50 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <PhotoIcon className="h-5 w-5" />
          {uploading ? 'Mengunggah...' : 'Foto'}
        </button>
        <button
          type="button"
          onClick={() => {
            setPollEnabled((value) => !value);
            if (!pollEnabled) setMedia([]);
          }}
          disabled={disabled}
          className={`flex min-h-9 items-center gap-1.5 rounded-sm border border-ink px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 ${pollEnabled ? 'bg-[#f1dfc4] font-bold text-ink shadow-[1px_1px_0_#171717]' : 'text-gray-600 hover:bg-[#f5efe4] hover:text-ink'}`}
        >
          <ChartBarIcon className="h-5 w-5" />
          Polling
        </button>
        <Button
          className="ml-auto"
          onClick={handleSubmit}
          disabled={
            disabled ||
            submitting ||
            uploading ||
            (!content.trim() && media.length === 0 && !pollEnabled)
          }
        >
          <PaperAirplaneIcon className="mr-1 h-4 w-4" />
          {submitting ? 'Mengirim...' : 'Kirim'}
        </Button>
      </div>
    </div>
  );
}
