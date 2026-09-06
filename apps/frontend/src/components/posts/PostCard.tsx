import { useState } from 'react';
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
  EllipsisHorizontalIcon,
  PaperAirplaneIcon,
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
  createComment,
  closePoll,
} from '@/services/posts';
import type { Comment, Post } from '@/types/posts';
import { useAuth } from '@/contexts/AuthContext';
import { useDismissibleLayer } from '@/hooks/useDismissibleLayer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface PostCardProps {
  post: Post;
  onOpen?: (id: string) => void;
  onDelete?: (post: Post) => void;
  canDelete?: boolean;
  canModerate?: boolean;
  onChanged?: () => void;
  onComment?: () => void;
  inlineComments?: boolean;
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

export function PostCard({
  post,
  onOpen,
  onDelete,
  canDelete,
  canModerate,
  onChanged,
  onComment,
  inlineComments: showInlineComments = true,
}: PostCardProps) {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const authorName = post.author?.fullName || 'Warga';

  const [liked, setLiked] = useState(!!post.viewerHasReacted);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(!!post.viewerHasSaved);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { rootRef: menuRef, triggerRef: menuTriggerRef } = useDismissibleLayer(menuOpen, () => setMenuOpen(false));
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? '');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [inlineComments, setInlineComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [pollExpiresAt, setPollExpiresAt] = useState(post.poll?.expiresAt ?? null);
  const [confirmPollClose, setConfirmPollClose] = useState(false);

  const pollEnded = Boolean(pollExpiresAt && new Date(pollExpiresAt).getTime() <= Date.now());
  const pollTimeLabel = !post.poll
    ? ''
    : !pollExpiresAt
      ? 'Tanpa batas waktu'
      : pollEnded
        ? 'Polling ditutup'
        : `Berakhir ${new Date(pollExpiresAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`;

  async function toggleComments() {
    if (!showInlineComments) {
      onComment?.();
      return;
    }
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

  async function submitInlineComment() {
    const content = commentText.trim();
    if (!content || commentSubmitting || post.commentsLocked) return;
    setCommentSubmitting(true);
    try {
      const response = await createComment(post.id, { content });
      const items = Array.isArray(response)
        ? response
        : (response as { data: Comment[] }).data;
      setInlineComments(
        [...items].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
      );
      setCommentCount((count) => count + 1);
      setCommentText('');
      showToast('Komentar terkirim');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(message || 'Gagal mengirim komentar', 'error');
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleClosePoll() {
    setBusy(true);
    try {
      const result = await closePoll(post.id);
      setPollExpiresAt(result.expiresAt);
      setConfirmPollClose(false);
      showToast('Polling ditutup');
      onChanged?.();
    } catch {
      showToast('Gagal menutup polling', 'error');
    } finally {
      setBusy(false);
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
    'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-sm px-2 text-sm font-semibold transition-colors hover:bg-[#f1dfc4] hover:text-ink focus:outline-none focus:ring-2 focus:ring-ink/25 dark:hover:bg-gray-700 dark:hover:text-white';

  return (
    <article className="rounded-sm border-2 border-ink bg-white p-4 shadow-[3px_3px_0_#171717] dark:border-gray-500 dark:bg-gray-800">
      <header className="flex items-start gap-3">
        <UserAvatar name={authorName} src={post.author?.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {authorName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {timeAgo(post.createdAt)}
            {post.isPinned && <span className="ml-2 text-primary">📌 Disematkan</span>}
          </p>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Aksi posting"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-[#f5efe4] hover:text-ink dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <EllipsisHorizontalIcon className="h-6 w-6" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-9 z-20 min-w-40 overflow-hidden rounded-md border-2 border-ink bg-white py-1 shadow-[3px_3px_0_#171717] dark:border-gray-500 dark:bg-gray-800">
              {post.authorId === currentUser?.id && (
                <button type="button" onClick={() => { setEditing((value) => !value); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold hover:bg-[#f5efe4] dark:hover:bg-gray-700">
                  <PencilSquareIcon className="h-4 w-4" /> Edit posting
                </button>
              )}
              {post.poll && (
                <div className="border-y border-ink/20 px-3 py-2 text-[11px] font-bold text-ink-secondary dark:text-gray-300">
                  {pollTimeLabel}
                </div>
              )}
              {post.poll && !pollEnded && (post.authorId === currentUser?.id || canModerate) && (
                <button type="button" onClick={() => { setConfirmPollClose(true); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold hover:bg-[#f5efe4] dark:hover:bg-gray-700">
                  <LockClosedIcon className="h-4 w-4" /> Tutup polling
                </button>
              )}
              <button type="button" onClick={() => { setReportOpen(true); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold hover:bg-[#f5efe4] dark:hover:bg-gray-700">
                <FlagIcon className="h-4 w-4" /> Laporkan
              </button>
              {canDelete && (
                <button type="button" onClick={() => { onDelete?.(post); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-gray-700">
                  Hapus posting
                </button>
              )}
            </div>
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
        {post.poll && <PostPoll postId={post.id} poll={{ ...post.poll, expiresAt: pollExpiresAt }} />}
      </div>

      <footer className="mt-4 flex items-center gap-1 border-t-2 border-ink pt-2 dark:border-gray-500">
        <button
          onClick={handleLike}
          disabled={busy}
          aria-label={`${liked ? 'Batal suka' : 'Suka'}; ${likeCount}`}
          title={liked ? 'Batal suka' : 'Suka'}
          className={`${actionBase} ${liked ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {liked ? <HeartSolid className="h-5 w-5" /> : <HeartOutline className="h-5 w-5" />}
          <span className="sr-only">Suka</span><span className="font-mono text-[11px]">{likeCount}</span>
        </button>
        <button
          onClick={() => void toggleComments()}
          aria-expanded={commentsOpen}
          aria-label={`Komentar; ${commentCount}`}
          title="Komentar"
          className={`${actionBase} text-gray-500 dark:text-gray-400`}
        >
          <ChatBubbleLeftIcon className="h-5 w-5" />
          <span className="sr-only">Komentar</span><span className="font-mono text-[11px]">{commentCount}</span>
        </button>
        <button
          onClick={handleShare}
          disabled={busy}
          aria-label={`Bagikan; ${post.shareCount}`}
          title="Bagikan"
          className={`${actionBase} text-gray-500 dark:text-gray-400`}
        >
          <ShareOutline className="h-5 w-5" />
          <span className="sr-only">Bagikan</span><span className="font-mono text-[11px]">{post.shareCount}</span>
        </button>
        <button
          onClick={handleSave}
          disabled={busy}
          className={`${actionBase} ml-auto ${saved ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          aria-label={saved ? 'Hapus dari tersimpan' : 'Simpan'}
          title={saved ? 'Hapus dari tersimpan' : 'Simpan'}
        >
          {saved ? <BookmarkSolid className="h-5 w-5" /> : <BookmarkOutline className="h-5 w-5" />}
          <span className="sr-only">Simpan</span>
        </button>
      </footer>
      {commentsOpen && (
        <div className="border-b-2 border-ink bg-[#fffaf2] px-3 py-3 dark:border-gray-500 dark:bg-gray-700/40">
          {commentsLoading ? (
            <p className="py-2 text-center text-xs text-gray-500">Memuat komentar...</p>
          ) : inlineComments.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-500">Belum ada komentar.</p>
          ) : (
            <div className="space-y-3">
              {inlineComments.slice(-2).map((comment) => (
                <div key={comment.id} className="flex gap-2.5">
                  <UserAvatar name={comment.author?.fullName || 'Warga'} src={comment.author?.avatarUrl} size="sm" className="border" />
                  <button type="button" onClick={() => onOpen?.(post.id)} className="min-w-0 rounded-sm border border-gray-300 bg-white px-3 py-2 text-left transition-colors hover:border-ink hover:bg-[#f5efe4] dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700">
                    <p className="text-xs font-bold text-ink dark:text-white">{comment.author?.fullName || 'Warga'}</p>
                    <PostContent content={comment.content} className="mt-0.5 text-sm text-gray-700 dark:text-gray-200" />
                    <p className="mt-1 text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</p>
                  </button>
                </div>
              ))}
              {commentCount > 2 && (
                <button
                  type="button"
                  onClick={() => onOpen?.(post.id)}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Lihat {commentCount - 2} komentar lainnya →
                </button>
              )}
            </div>
          )}
          {post.commentsLocked ? (
            <div className="mt-3 flex items-center gap-2 rounded-sm border-2 border-ink bg-[#f1dfc4] px-3 py-2 text-xs font-bold text-ink dark:border-gray-400 dark:bg-gray-700 dark:text-white">
              <LockClosedIcon className="h-4 w-4" /> Komentar pada posting ini dikunci.
            </div>
          ) : (
            <div className="mt-3 flex items-end gap-2 border-t-2 border-ink pt-3 dark:border-gray-500">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void submitInlineComment();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder="Tulis komentar..."
                aria-label="Tulis komentar"
                className="min-h-11 flex-1 resize-none rounded-sm border-2 border-ink bg-white px-3 py-2 text-sm text-ink shadow-[2px_2px_0_#171717] outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-ink/25 dark:border-gray-400 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => void submitInlineComment()}
                disabled={!commentText.trim() || commentSubmitting}
                aria-label="Kirim komentar"
                className="flex h-11 w-11 flex-none items-center justify-center rounded-sm border-2 border-ink bg-brand-500 text-white shadow-[2px_2px_0_#171717] transition hover:translate-x-px hover:translate-y-px hover:shadow-none focus:outline-none focus:ring-2 focus:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
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
      <ConfirmDialog
        isOpen={confirmPollClose}
        onClose={() => setConfirmPollClose(false)}
        onConfirm={() => void handleClosePoll()}
        title="Tutup Polling"
        message="Tutup polling sekarang? Warga tidak dapat memberikan atau mengubah suara setelah polling ditutup."
        confirmText="Ya, tutup"
        variant="primary"
        loading={busy}
      />
    </article>
  );
}
