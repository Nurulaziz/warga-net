import { useCallback, useEffect, useState } from 'react';
import { FlagIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  canManage,
  onReport,
  onEdited,
}: {
  comment: Comment;
  onReply: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  canManage: (comment: Comment) => boolean;
  onReport: (comment: Comment) => void;
  onEdited: () => Promise<void>;
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
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary dark:bg-primary/20">
        {initials(comment.author?.fullName || 'Warga')}
      </div>
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
            <p className="text-sm text-gray-800 dark:text-gray-100">{comment.content}</p>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 pl-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{timeAgo(comment.createdAt)}</span>
          <button onClick={() => onReply(comment.id, comment.author?.fullName || 'Warga')}>
            Balas
          </button>
          <button onClick={() => onReport(comment)} aria-label="Laporkan komentar">
            <FlagIcon className="h-3.5 w-3.5" />
          </button>
          {canManage(comment) && (
            <>
              <button onClick={() => edit(comment)} className="text-primary">
                Edit
              </button>
              <button onClick={() => onDelete(comment.id)} className="text-red-500">
                Hapus
              </button>
            </>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-200">
                  {initials(reply.author?.fullName || 'Warga')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-block rounded-2xl rounded-tl-sm bg-gray-50 px-3 py-2 dark:bg-gray-600/50">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                      {reply.author?.fullName || 'Warga'}
                    </p>
                    {editingId === reply.id ? (
                      <div className="mt-1 flex gap-1">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="rounded border px-2 py-1 text-sm dark:bg-gray-600"
                        />
                        <button
                          onClick={() => void saveEdit(reply.id)}
                          className="text-xs font-medium text-primary"
                        >
                          Simpan
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 dark:text-gray-100">{reply.content}</p>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 pl-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{timeAgo(reply.createdAt)}</span>
                    <button onClick={() => onReport(reply)} aria-label="Laporkan balasan">
                      <FlagIcon className="h-3.5 w-3.5" />
                    </button>
                    {canManage(reply) && (
                      <>
                        <button onClick={() => edit(reply)} className="text-primary">
                          Edit
                        </button>
                        <button onClick={() => onDelete(reply.id)} className="text-red-500">
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({ postId }: { postId: string }) {
  const { showToast } = useToast();
  const { currentUser, isAdmin } = useAuth();
  const admin = isAdmin();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<Comment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchComments(postId);
      setComments(Array.isArray(res) ? res : (res as { data: Comment[] }).data);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  function canManage(comment: Comment) {
    return admin || comment.authorId === currentUser?.id;
  }

  async function handleSubmit() {
    const content = text.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const result = await createComment(postId, {
        content,
        ...(replyTo ? { parentId: replyTo.id } : {}),
      });
      setComments(result);
      setText('');
      setReplyTo(null);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string, name: string) {
    setReplyTo((prev) => (prev && prev.id === parentId ? null : { id: parentId, name }));
    setText('');
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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
        Komentar ({comments.length})
      </h3>

      <div className="mb-4 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder={replyTo ? `Balas ${replyTo.name}...` : 'Tulis komentar...'}
          className="min-h-[40px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        {replyTo && (
          <button
            onClick={() => setReplyTo(null)}
            aria-label="Batal balas"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
        <Button size="sm" onClick={handleSubmit} disabled={submitting || !text.trim()}>
          <PaperAirplaneIcon className="mr-1 h-4 w-4" />
          Kirim
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-sm text-gray-400 dark:text-gray-500">
          Belum ada komentar. Jadilah yang pertama.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDelete}
              canManage={canManage}
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
