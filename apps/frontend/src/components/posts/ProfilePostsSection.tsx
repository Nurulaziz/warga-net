import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserPosts } from '@/services/posts';
import { PostCard } from '@/components/posts/PostCard';
import type { Post } from '@/types/posts';

export function ProfilePostsSection({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts((await fetchUserPosts(userId, { limit: 10 })).data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mt-6 space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Posting Saya</h2>
      {loading ? (
        <div className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
          Belum ada posting.
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onOpen={(id) => navigate(`/suara-warga/${id}`)} />
        ))
      )}
    </section>
  );
}
