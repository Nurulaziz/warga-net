import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MegaphoneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { PostCard } from '@/components/posts/PostCard';
import { PostComposer } from '@/components/posts/PostComposer';
import { EmptyState } from '@/components/posts/EmptyState';
import { fetchPosts, createPost, deletePost, type FeedParams } from '@/services/posts';
import type { PaginatedMeta, Post, PostMediaItem } from '@/types/posts';

type SortKey = 'latest' | 'trending';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'latest', label: 'Terbaru' },
  { value: 'trending', label: 'Sedang Ramai' },
];

export function SuaraWargaPage() {
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAuth();
  const canCreate = hasPermission('posts', 'create');
  const canDelete = hasPermission('posts', 'delete');
  const canModerate = hasPermission('posts', 'moderate');

  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<SortKey>('latest');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [searchTag, setSearchTag] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: FeedParams = { page, limit: pageSize, sort };
      const res = await fetchPosts(params);
      setPosts(res.data);
      setMeta(res.meta);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sort]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(
    content: string,
    media: PostMediaItem[] = [],
    poll?: { question: string; options: string[] },
  ) {
    await createPost({
      content,
      ...(media.length ? { media } : {}),
      ...(poll ? { type: 'POLL', poll } : {}),
    });
    setPage(1);
    await load();
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deletePost(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch {
      setDeleteTarget(null);
    }
  }

  function handleSortChange(key: SortKey) {
    setSort(key);
    setPage(1);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tag = searchTag.trim().replace(/^#/, '');
    if (!tag) return;
    setSearchTag('');
    navigate(`/suara-warga/hashtag/${encodeURIComponent(tag)}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center gap-2">
        <MegaphoneIcon className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Suara Warga</h1>
        <Link
          to="/suara-warga/tersimpan"
          className="ml-auto text-sm font-medium text-primary hover:underline"
        >
          Tersimpan
        </Link>
        {canModerate && (
          <Link
            to="/suara-warga/moderasi"
            className="text-sm font-medium text-primary hover:underline"
          >
            Moderasi
          </Link>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
          placeholder="Cari berdasarkan #tag..."
          className="min-h-[40px] flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
          disabled={!searchTag.trim()}
        >
          Cari
        </button>
      </form>

      {canCreate && (
        <PostComposer currentUserName={currentUser?.fullName || 'Warga'} onSubmit={handleCreate} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                sort === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpen={(id) => navigate(`/suara-warga/${id}`)}
              onDelete={(p) => setDeleteTarget(p)}
              canDelete={canDelete || post.authorId === currentUser?.id}
              canModerate={canModerate}
              onChanged={load}
            />
          ))}
        </div>
      )}

      {meta.total > pageSize && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          itemLabel="posting"
          pageSizeOptions={[10, 20, 50]}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus posting?"
        message="Posting ini akan dihapus dan tidak lagi muncul di feed."
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
