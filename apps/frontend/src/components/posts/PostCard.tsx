import { useMemo, useState } from 'react';
import {
  HeartIcon as HeartOutline,
  ChatBubbleLeftIcon,
  ShareIcon as ShareOutline,
  BookmarkIcon as BookmarkOutline,
  FlagIcon,
  LockClosedIcon,
  MapPinIcon,
  EyeSlashIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import { useToast } from '@/components/ui/Toast';
import { PostContent } from '@/components/posts/PostContent';
import { PostMedia } from '@/components/posts/PostMedia';
import { PostPoll } from '@/components/posts/PostPoll';
import { ReportDialog } from '@/components/posts/ReportDialog';
import {
  reactPost,
  unreactPost,
  sharePost,
  savePost,
  unsavePost,
  reportPost,
  moderatePost,
  updatePost,
} from '@/services/posts';
import type { Post } from '@/types/posts';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
  post: Post;
  onOpen?: (id: string) => void;
  onDelete?: (post: Post) => void;
  canDelete?: boolean;
  canModerate?: boolean;
  onChanged?: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export function PostCard({
  post,
  onOpen,
  onDelete,
  canDelete,
  canModerate,
  onChanged,
}: PostCardProps) {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const authorName = post.author?.fullName || 'Warga';
  const authorInitials = useMemo(() => initials(authorName), [authorName]);

  const [liked, setLiked] = useState(!!post.viewerHasReacted);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(!!post.viewerHasSaved);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? '');

  async function handleLike() {
    if (busy) return;
    setBusy(true);
    try {
      if (liked) {
        await unreactPost(post.id);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await reactPost(post.id);
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch {
      showToast('Gagal memproses like', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        await unsavePost(post.id);
        setSaved(false);
        showToast('Dihapus dari yang disimpan');
      } else {
        await savePost(post.id);
        setSaved(true);
        showToast('Disimpan');
      }
    } catch {
      showToast('Gagal menyimpan posting', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    setBusy(true);
    try {
      await sharePost(post.id);
      const url = `${window.location.origin}/suara-warga/${post.id}`;
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      showToast('Link disalin ke clipboard');
    } catch {
      showToast('Gagal membagikan', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleModerate(action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'hide') {
    setBusy(true);
    try {
      await moderatePost(post.id, action);
      showToast('Status posting diperbarui');
      onChanged?.();
    } catch {
      showToast('Gagal memoderasi posting', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit() {
    const content = editContent.trim();
    if (!content && !post.media?.length && !post.poll) return;
    setBusy(true);
    try {
      await updatePost(post.id, { content });
      setEditing(false);
      showToast('Posting diperbarui');
      onChanged?.();
    } catch {
      showToast('Gagal memperbarui posting', 'error');
    } finally {
      setBusy(false);
    }
  }

  const actionBase =
    'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <header className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20 dark:text-primary-foreground">
          {authorInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {authorName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {timeAgo(post.createdAt)}
            {post.isPinned && <span className="ml-2 text-primary">📌 Disematkan</span>}
          </p>
        </div>
        {post.authorId === currentUser?.id && (
          <button
            onClick={() => setEditing((value) => !value)}
            aria-label="Edit posting"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => setReportOpen(true)}
          aria-label="Laporkan posting"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
        >
          <FlagIcon className="h-5 w-5" />
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete?.(post)}
            aria-label="Hapus posting"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 7h8m-6 0v-1a1 1 0 011-1h2a1 1 0 011 1v1m-5 0l.5 8a1 1 0 001 .997h5a1 1 0 001-.997L14 7M8 10v5M12 10v5"
              />
            </svg>
          </button>
        )}
      </header>

      <div onClick={() => !editing && onOpen?.(post.id)} className="mt-3 cursor-pointer">
        {editing ? (
          <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
            <textarea
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              rows={3}
              maxLength={5000}
              className="w-full rounded-xl border p-3 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm">
                Batal
              </button>
              <button
                disabled={busy}
                onClick={() => void handleEdit()}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white"
              >
                Simpan
              </button>
            </div>
          </div>
        ) : (
          <PostContent
            content={post.content}
            className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-100"
          />
        )}
        <PostMedia urls={(post.media ?? []).map((m) => m.url)} />
        {post.poll && <PostPoll postId={post.id} poll={post.poll} />}
      </div>

      <footer className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
        <button
          onClick={handleLike}
          disabled={busy}
          className={`${actionBase} ${liked ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {liked ? <HeartSolid className="h-5 w-5" /> : <HeartOutline className="h-5 w-5" />}
          <span>{likeCount}</span>
        </button>
        <button
          onClick={() => onOpen?.(post.id)}
          className={`${actionBase} text-gray-500 dark:text-gray-400`}
        >
          <ChatBubbleLeftIcon className="h-5 w-5" />
          <span>{post.commentCount}</span>
        </button>
        <button
          onClick={handleShare}
          disabled={busy}
          className={`${actionBase} text-gray-500 dark:text-gray-400`}
        >
          <ShareOutline className="h-5 w-5" />
          <span>{post.shareCount}</span>
        </button>
        <button
          onClick={handleSave}
          disabled={busy}
          className={`${actionBase} ${saved ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          aria-label="Simpan"
        >
          {saved ? <BookmarkSolid className="h-5 w-5" /> : <BookmarkOutline className="h-5 w-5" />}
        </button>
      </footer>
      {canModerate && (
        <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-2 dark:border-gray-700">
          <button
            disabled={busy}
            onClick={() => handleModerate(post.isPinned ? 'unpin' : 'pin')}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700"
          >
            <MapPinIcon className="h-4 w-4" />
            {post.isPinned ? 'Lepas pin' : 'Pin'}
          </button>
          <button
            disabled={busy}
            onClick={() => handleModerate(post.commentsLocked ? 'unlock' : 'lock')}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700"
          >
            <LockClosedIcon className="h-4 w-4" />
            {post.commentsLocked ? 'Buka komentar' : 'Kunci komentar'}
          </button>
          <button
            disabled={busy}
            onClick={() => handleModerate('hide')}
            className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300"
          >
            <EyeSlashIcon className="h-4 w-4" />
            Sembunyikan
          </button>
        </div>
      )}
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={async (reason, description) => {
          await reportPost(post.id, { reason, description });
          showToast('Laporan terkirim');
        }}
      />
    </article>
  );
}
