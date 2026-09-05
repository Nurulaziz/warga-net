import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookmarkIcon, MegaphoneIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
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
  const { currentUser, isAuthenticated, hasPermission } = useAuth();
  // Endpoint posting tersedia untuk setiap sesi login. Jangan sembunyikan composer hanya karena
  // metadata role/permission dari /users/me masih dimuat atau berasal dari data lama.
  const canCreate = isAuthenticated;
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
    <div className="mx-auto max-w-3xl space-y-5 py-2">
      <div className="border-b-2 border-ink pb-5 dark:border-gray-500 sm:flex sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">Ruang komunitas</p>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-ink bg-brand-500 text-white shadow-[2px_2px_0_#171717]">
              <MegaphoneIcon className="h-5 w-5" />
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.04em] text-ink dark:text-white">Suara Warga</h1>
          </div>
          <p className="mt-3 max-w-lg text-sm text-gray-600 dark:text-gray-300">Berbagi kabar, ide, dan aspirasi dengan tetangga dalam satu ruang bersama.</p>
        </div>
        <div className="mt-4 flex gap-2 sm:mt-0">
          <Link to="/suara-warga/tersimpan" className="inline-flex min-h-10 items-center gap-2 rounded-sm border-2 border-ink bg-white px-3 text-xs font-bold uppercase tracking-wide text-ink hover:bg-brand-50 dark:bg-gray-800 dark:text-white">
            <BookmarkIcon className="h-4 w-4" /> Tersimpan
          </Link>
          {canModerate && <Link to="/suara-warga/moderasi" className="inline-flex min-h-10 items-center gap-2 rounded-sm border-2 border-ink bg-white px-3 text-xs font-bold uppercase tracking-wide text-ink hover:bg-brand-50 dark:bg-gray-800 dark:text-white"><ShieldCheckIcon className="h-4 w-4" /> Moderasi</Link>}
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="grid w-full grid-cols-[minmax(0,1fr)_104px] gap-2">
        <input
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
          placeholder="Cari berdasarkan #tag..."
          className="min-h-[44px] w-full rounded-sm border-2 border-ink bg-white px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          type="submit"
          className="rounded-sm border-2 border-ink bg-brand-500 px-4 text-xs font-bold uppercase tracking-wide text-white shadow-[2px_2px_0_#171717] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!searchTag.trim()}
        >
          Cari
        </button>
      </form>

      {canCreate && (
        <PostComposer currentUserName={currentUser?.fullName || 'Warga'} onSubmit={handleCreate} />
      )}

      <div className="flex items-center justify-between border-b-2 border-ink pb-3 dark:border-gray-500">
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={`rounded-sm border-2 border-ink px-4 py-1.5 text-sm font-bold transition ${
                sort === opt.value
                  ? 'bg-brand-500 text-white shadow-[2px_2px_0_#171717]'
                  : 'bg-white text-ink hover:bg-brand-50 dark:bg-gray-800 dark:text-gray-200'
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
