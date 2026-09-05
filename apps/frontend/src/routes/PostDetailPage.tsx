import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CommentSection } from '@/components/posts/CommentSection';
import { PostCard } from '@/components/posts/PostCard';
import { fetchPost, deletePost } from '@/services/posts';
import type { Post } from '@/types/posts';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = useAuth();
  const admin = isAdmin();
  const canModerate = hasPermission('posts', 'moderate');

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

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-2">
      <button
        onClick={() => navigate('/suara-warga')}
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-brand-600 dark:text-gray-300"
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
        <section className="relative">
          <PostCard
            post={post}
            canDelete={admin}
            canModerate={canModerate}
            onDelete={() => setConfirmOpen(true)}
            onChanged={load}
            inlineComments={false}
            onComment={() => document.getElementById('diskusi-posting')?.scrollIntoView({ behavior: 'smooth' })}
          />
          <div className="mx-7 h-6 border-x-2 border-ink bg-[linear-gradient(to_bottom,transparent_45%,#171717_45%,#171717_55%,transparent_55%)] dark:border-gray-500" aria-hidden="true" />
          <div id="diskusi-posting"><CommentSection postId={post.id} embedded /></div>
        </section>
      )}

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
