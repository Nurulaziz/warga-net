import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CommentSection } from '@/components/posts/CommentSection';
import { PostContent } from '@/components/posts/PostContent';
import { PostMedia } from '@/components/posts/PostMedia';
import { fetchPost, deletePost } from '@/services/posts';
import type { Post } from '@/types/posts';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAuth();
  const canDelete = hasPermission('posts', 'delete');

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      setPost(await fetchPost(id));
    } catch {
      setError('Posting tidak ditemukan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!id) return;
    try {
      await deletePost(id);
      navigate('/suara-warga');
    } catch {
      setError('Gagal menghapus posting');
      setConfirmOpen(false);
    }
  }

  const canAct = canDelete || (post && post.authorId === currentUser?.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <button
        onClick={() => navigate('/suara-warga')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Kembali ke Suara Warga
      </button>

      {loading && (
        <div className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
      )}

      {error && !post && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
          {error}
        </div>
      )}

      {post && (
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <header className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20">
              {(post.author?.fullName || 'Warga')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join('')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {post.author?.fullName || 'Warga'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.createdAt).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {post.isPinned && <span className="ml-2 text-primary">📌 Disematkan</span>}
              </p>
            </div>
            {canAct && (
              <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
                Hapus
              </Button>
            )}
          </header>

          <PostContent
            content={post.content}
            className="mt-4 text-[15px] leading-relaxed text-gray-800 dark:text-gray-100"
          />
          <PostMedia urls={(post.media ?? []).map((m) => m.url)} />
        </article>
      )}

      {post && <CommentSection postId={post.id} />}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus posting?"
        message="Posting ini akan dihapus dan tidak lagi muncul di feed."
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
