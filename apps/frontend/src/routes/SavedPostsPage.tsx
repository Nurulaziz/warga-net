import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { Pagination } from '@/components/ui/Pagination';
import { PostCard } from '@/components/posts/PostCard';
import { EmptyState } from '@/components/posts/EmptyState';
import { fetchSavedPosts } from '@/services/posts';
import type { PaginatedMeta, Post } from '@/types/posts';

export function SavedPostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSavedPosts({ page, limit: pageSize });
      setPosts(res.data);
      setMeta(res.meta);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center gap-2">
        <BookmarkIcon className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Posting Tersimpan</h1>
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
            <PostCard key={post.id} post={post} onOpen={(id) => navigate(`/suara-warga/${id}`)} />
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
    </div>
  );
}
