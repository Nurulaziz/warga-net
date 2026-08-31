import { useEffect, useRef, useState } from 'react';
import { ChartBarIcon, PaperAirplaneIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { fetchMentionSuggestions, uploadPostMedia } from '@/services/posts';
import type { PostMediaItem } from '@/types/posts';

interface PostComposerProps {
  currentUserName: string;
  onSubmit: (
    content: string,
    media: PostMediaItem[],
    poll?: { question: string; options: string[] },
  ) => Promise<void>;
  disabled?: boolean;
}

export function PostComposer({ currentUserName, onSubmit, disabled }: PostComposerProps) {
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
  const [mentions, setMentions] = useState<Array<{ id: string; fullName: string }>>([]);

  useEffect(() => {
    const match = content.match(/@([^@\n]{1,40})$/u);
    if (!match) {
      setMentions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetchMentionSuggestions(match[1].trim())
        .then(setMentions)
        .catch(() => setMentions([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [content]);

  function selectMention(fullName: string) {
    setContent((value) => value.replace(/@([^@\n]{1,40})$/u, `@${fullName} `));
    setMentions([]);
  }

  function initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  }

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
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(
        text,
        media,
        pollEnabled ? { question: pollQuestion.trim(), options: validPollOptions } : undefined,
      );
      setContent('');
      setMedia([]);
      setPollEnabled(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch {
      setError('Gagal memposting. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20 dark:text-primary-foreground">
          {initials(currentUserName || 'Warga')}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          maxLength={5000}
          disabled={disabled}
          placeholder="Apa yang ingin Anda sampaikan ke warga?"
          className="min-h-[56px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] text-gray-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {mentions.length > 0 && (
        <div className="ml-14 mt-1 overflow-hidden rounded-xl border bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
          {mentions.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectMention(user.fullName)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              @{user.fullName}
            </button>
          ))}
        </div>
      )}

      {media.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {media.map((m) => (
            <div key={m.url} className="group relative">
              <img src={m.url} alt="Pratinjau" className="h-20 w-full rounded-lg object-cover" />
              <button
                onClick={() => removeMedia(m.url)}
                aria-label="Hapus gambar"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {pollEnabled && (
        <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold dark:text-gray-100">Buat polling</p>
            <button onClick={() => setPollEnabled(false)} aria-label="Hapus polling">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <input
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            maxLength={300}
            placeholder="Pertanyaan polling"
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
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
                className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              />
              {pollOptions.length > 2 && (
                <button
                  onClick={() => setPollOptions((items) => items.filter((_, i) => i !== index))}
                  aria-label={`Hapus pilihan ${index + 1}`}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button
              onClick={() => setPollOptions((items) => [...items, ''])}
              className="text-sm font-medium text-primary"
            >
              + Tambah pilihan
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-2 pl-14 text-xs text-red-500">{error}</p>}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || media.length >= 4}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <PhotoIcon className="h-5 w-5" />
          {uploading ? 'Mengunggah...' : 'Foto'}
        </button>
        <button
          onClick={() => {
            setPollEnabled((value) => !value);
            if (!pollEnabled) setMedia([]);
          }}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ChartBarIcon className="h-5 w-5" />
          Polling
        </button>
        <Button
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
