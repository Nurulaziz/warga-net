import { useCallback, useEffect, useState } from 'react';
import { ChatBubbleLeftIcon, FlagIcon, PaperAirplaneIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  createComment,
  deleteComment,
  fetchComments,
  reportComment,
  updateComment,
} from '@/services/posts';
import { ReportDialog } from '@/components/posts/ReportDialog';
import { useToast } from '@/components/ui/Toast';
import type { Comment } from '@/types/posts';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { MentionTextarea } from '@/components/posts/MentionTextarea';
import { PostContent } from '@/components/posts/PostContent';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  canEdit,
  canDelete,
  onReport,
  onEdited,
  depth = 0,
}: {
  comment: Comment;
  onReply: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  canEdit: (comment: Comment) => boolean;
  canDelete: boolean;
  onReport: (comment: Comment) => void;
  onEdited: () => Promise<void>;
  depth?: number;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  async function saveEdit(id: string) {
    const content = editText.trim();
    if (!content) return;
    await updateComment(id, content);
    setEditingId(null);
    await onEdited();
  }

  function edit(target: Comment) {
    setEditingId(target.id);
    setEditText(target.content);
  }

  return (
    <div className={`relative flex gap-3 ${depth > 0 ? 'ml-2 border-l-2 border-gray-400 pl-4 dark:border-gray-500' : ''}`}>
      <UserAvatar name={comment.author?.fullName || 'Warga'} src={comment.author?.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="inline-block rounded-2xl rounded-tl-sm bg-gray-100 px-3 py-2 dark:bg-gray-700">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
            {comment.author?.fullName || 'Warga'}
          </p>
          {editingId === comment.id ? (
            <div className="mt-1 flex gap-1">
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="rounded border px-2 py-1 text-sm dark:bg-gray-600"
              />
              <button
                onClick={() => void saveEdit(comment.id)}
                className="text-xs font-medium text-primary"
              >
                Simpan
              </button>
            </div>
          ) : (
            <PostContent content={comment.content} className="text-sm text-gray-800 dark:text-gray-100" />
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 pl-1 text-xs font-medium text-ink-secondary dark:text-gray-300">
          <span className="mr-1">{timeAgo(comment.createdAt)}</span>
          <button className="flex h-8 w-8 items-center justify-center rounded-sm hover:bg-[#f1dfc4] focus:outline-none focus:ring-2 focus:ring-ink/25 dark:hover:bg-gray-700" onClick={() => onReply(comment.id, comment.author?.fullName || 'Warga')} aria-label={`Balas komentar ${comment.author?.fullName || 'Warga'}`} title="Balas">
            <ChatBubbleLeftIcon className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-sm hover:bg-[#f1dfc4] focus:outline-none focus:ring-2 focus:ring-ink/25 dark:hover:bg-gray-700" onClick={() => onReport(comment)} aria-label="Laporkan komentar" title="Laporkan">
            <FlagIcon className="h-4 w-4" />
          </button>
          {canEdit(comment) && (
            <button onClick={() => edit(comment)} className="flex h-8 w-8 items-center justify-center rounded-sm text-primary hover:bg-[#f1dfc4] focus:outline-none focus:ring-2 focus:ring-ink/25 dark:hover:bg-gray-700" aria-label="Edit komentar" title="Edit">
              <PencilSquareIcon className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
              <button onClick={() => onDelete(comment.id)} className="flex h-8 w-8 items-center justify-center rounded-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-ink/25 dark:hover:bg-red-950" aria-label="Hapus komentar" title="Hapus">
                <TrashIcon className="h-4 w-4" />
              </button>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                canEdit={canEdit}
                canDelete={canDelete}
                onReport={onReport}
                onEdited={onEdited}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({ postId, embedded = false }: { postId: string; embedded?: boolean }) {
  const { showToast } = useToast();
  const { currentUser, isAdmin } = useAuth();
  const admin = isAdmin();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<Comment | null>(null);
  const commentCount = comments.reduce(function count(total, comment): number {
    return total + 1 + (comment.replies?.reduce(count, 0) ?? 0);
  }, 0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchComments(postId);
      const items = Array.isArray(res) ? res : (res as { data: Comment[] }).data;
      setComments([...items].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)));
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  function canEdit(comment: Comment) {
    return comment.authorId === currentUser?.id;
  }

  async function handleSubmit() {
    const content = text.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const result = await createComment(postId, {
        content,
        ...(replyTo ? { parentId: replyTo.id } : {}),
        ...(mentionedUserIds.length ? { mentionedUserIds } : {}),
      });
      setComments([...result].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)));
      setText('');
      setReplyTo(null);
      setMentionedUserIds([]);
      setComposerOpen(false);
    } catch {
      showToast('Gagal mengirim komentar. Silakan coba lagi.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string, name: string) {
    setReplyTo((prev) => (prev && prev.id === parentId ? null : { id: parentId, name }));
    const author = comments.flatMap(function flatten(comment: Comment): Comment[] {
      return [comment, ...(comment.replies?.flatMap(flatten) ?? [])];
    }).find((comment) => comment.id === parentId)?.author;
    setText(`@${name.trim().replace(/\s+/g, '_')} `);
    setMentionedUserIds(author?.id ? [author.id] : []);
    setComposerOpen(true);
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(commentId);
      await load();
    } catch {
      // silent
    }
  }

  return (
    <div className={`flex flex-col rounded-sm border-2 border-ink bg-white p-5 dark:border-gray-500 dark:bg-gray-800 ${embedded ? 'border-t-4' : ''} shadow-[3px_3px_0_#171717]`}>
      <h3 className="order-1 mb-4 font-display text-base font-bold text-gray-900 dark:text-gray-100">
        Komentar ({commentCount})
      </h3>

      {!composerOpen && comments.length === 0 && (
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="order-3 mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border-2 border-ink bg-white px-4 text-sm font-bold text-ink shadow-[2px_2px_0_#171717] transition hover:-translate-y-0.5 hover:bg-[#f5efe4] dark:border-gray-500 dark:bg-gray-800 dark:text-white"
        >
          <ChatBubbleLeftIcon className="h-5 w-5" /> Komen postingan
        </button>
      )}

      {composerOpen && <div className="order-3 mt-6 rounded-sm border-2 border-ink bg-[#fffaf2] p-3 dark:border-gray-500 dark:bg-gray-700">
        <p className="mb-1 px-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600">Tulis komentar</p>
        <MentionTextarea
          value={text}
          onChange={setText}
          onMention={(user) => setMentionedUserIds((ids) => ids.includes(user.id) ? ids : [...ids, user.id])}
          rows={4}
          placeholder={replyTo ? `Balas ${replyTo.name}...` : 'Tulis komentar...'}
          className="min-h-[112px] w-full resize-y rounded-sm border-0 bg-transparent px-2 py-2 text-[15px] leading-relaxed text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-gray-100"
        />
        <div className="mt-2 flex items-center justify-end gap-2 border-t border-gray-300 pt-3 dark:border-gray-500">
          {(
            <button
              onClick={() => {
                setReplyTo(null);
                setText('');
                setMentionedUserIds([]);
                setComposerOpen(false);
              }}
              className="inline-flex min-h-9 items-center gap-1 rounded-sm px-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <XMarkIcon className="h-4 w-4" /> Batal
            </button>
          )}
          <Button size="sm" onClick={handleSubmit} disabled={submitting || !text.trim()}>
            <PaperAirplaneIcon className="mr-1 h-4 w-4" />
            Kirim komentar
          </Button>
        </div>
      </div>}

      {loading ? (
        <div className="order-2 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="order-2 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
          Belum ada komentar. Jadilah yang pertama.
        </p>
      ) : (
        <div className="order-2 space-y-4 border-b border-gray-200 pb-5 dark:border-gray-600">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDelete}
              canEdit={canEdit}
              canDelete={admin}
              onReport={setReportTarget}
              onEdited={load}
            />
          ))}
        </div>
      )}
      <ReportDialog
        title="Laporkan komentar"
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmit={async (reason, description) => {
          if (!reportTarget) return;
          await reportComment(reportTarget.id, { reason, description });
          showToast('Laporan komentar terkirim');
        }}
      />
    </div>
  );
}
