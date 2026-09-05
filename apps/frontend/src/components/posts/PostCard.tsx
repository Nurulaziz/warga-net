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
  ArrowTopRightOnSquareIcon,
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
  fetchComments,
} from '@/services/posts';
import type { Comment, Post } from '@/types/posts';
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
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [inlineComments, setInlineComments] = useState<Comment[]>([]);

  async function toggleComments() {
    if (commentsOpen) {
      setCommentsOpen(false);
      return;
    }
    setCommentsOpen(true);
    if (inlineComments.length || post.commentCount === 0) return;
    setCommentsLoading(true);
    try {
      const response = await fetchComments(post.id);
      const items = Array.isArray(response)
        ? response
        : (response as { data: Comment[] }).data;
      setInlineComments(
        [...items].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
      );
    } catch {
      showToast('Gagal memuat komentar', 'error');
      setCommentsOpen(false);
    } finally {
      setCommentsLoading(false);
    }
  }

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
    'flex min-h-10 flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-sm font-semibold transition hover:bg-brand-50 dark:hover:bg-gray-700';

  return (
    <article className="rounded-sm border-2 border-ink bg-white p-4 shadow-[3px_3px_0_#171717] dark:border-gray-500 dark:bg-gray-800">
      <header className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border-2 border-ink bg-brand-500 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#171717]">
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
        <div className="flex shrink-0 overflow-hidden rounded-sm border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
        {post.authorId === currentUser?.id && (
          <button
            onClick={() => setEditing((value) => !value)}
            aria-label="Edit posting"
            className="flex h-8 w-8 items-center justify-center border-r border-gray-300 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => setReportOpen(true)}
          aria-label="Laporkan posting"
          className="flex h-8 w-8 items-center justify-center border-r border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <FlagIcon className="h-5 w-5" />
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete?.(post)}
            aria-label="Hapus posting"
            className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700"
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
        </div>
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

      <footer className="mt-4 flex items-stretch divide-x divide-gray-300 border-y border-gray-300 dark:divide-gray-600 dark:border-gray-600">
        <button
          onClick={handleLike}
          disabled={busy}
          className={`${actionBase} ${liked ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {liked ? <HeartSolid className="h-5 w-5" /> : <HeartOutline className="h-5 w-5" />}
          <span>Suka</span><span className="font-mono text-xs">{likeCount}</span>
        </button>
        <button
          onClick={() => void toggleComments()}
          aria-expanded={commentsOpen}
          className={`${actionBase} text-gray-500 dark:text-gray-400`}
        >
          <ChatBubbleLeftIcon className="h-5 w-5" />
          <span>Komentar</span><span className="font-mono text-xs">{post.commentCount}</span>
        </button>
        <button
          onClick={handleShare}
          disabled={busy}
          className={`${actionBase} text-gray-500 dark:text-gray-400`}
        >
          <ShareOutline className="h-5 w-5" />
          <span>Bagikan</span><span className="font-mono text-xs">{post.shareCount}</span>
        </button>
        <button
          onClick={handleSave}
          disabled={busy}
          className={`flex min-h-10 w-12 items-center justify-center ${saved ? 'text-primary' : 'text-gray-500 dark:text-gray-400'} hover:bg-brand-50 dark:hover:bg-gray-700`}
          aria-label="Simpan"
        >
          {saved ? <BookmarkSolid className="h-5 w-5" /> : <BookmarkOutline className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => onOpen?.(post.id)}
          className={`${actionBase} text-gray-600 dark:text-gray-300`}
          aria-label="Buka detail posting"
        >
          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          <span>Detail</span>
        </button>
      </footer>
      {commentsOpen && (
        <div className="border-b border-gray-300 bg-[#fffaf2] px-3 py-3 dark:border-gray-600 dark:bg-gray-700/40">
          {commentsLoading ? (
            <p className="py-2 text-center text-xs text-gray-500">Memuat komentar...</p>
          ) : inlineComments.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-500">Belum ada komentar.</p>
          ) : (
            <div className="space-y-3">
              {inlineComments.slice(-3).map((comment) => (
                <div key={comment.id} className="flex gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-ink bg-brand-500 font-mono text-[10px] font-bold text-white dark:border-gray-400">
                    {initials(comment.author?.fullName || 'Warga')}
                  </span>
                  <div className="min-w-0 rounded-sm border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
                    <p className="text-xs font-bold text-ink dark:text-white">{comment.author?.fullName || 'Warga'}</p>
                    <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-200">{comment.content}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</p>
                    <button
                      type="button"
                      onClick={() => onOpen?.(post.id)}
                      className="mt-1 text-xs font-bold text-brand-600 hover:underline"
                    >
                      Komen →
                    </button>
                  </div>
                </div>
              ))}
              {post.commentCount > 3 && (
                <button
                  type="button"
                  onClick={() => onOpen?.(post.id)}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Lihat semua {post.commentCount} komentar →
                </button>
              )}
            </div>
          )}
        </div>
      )}
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
