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
    <section className="mt-8 space-y-4 border-t-2 border-ink pt-5 dark:border-gray-500">
      <div>
        <p className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-blue-400">
          Aktivitas
        </p>
        <h2 className="text-xl font-black text-ink dark:text-gray-100">Posting Saya</h2>
      </div>
      {loading ? (
        <div className="h-28 animate-pulse rounded-sm border-2 border-ink bg-warm-100 shadow-[4px_4px_0_#171717] dark:border-gray-500 dark:bg-gray-800" />
      ) : posts.length === 0 ? (
        <div className="rounded-sm border-2 border-dashed border-ink bg-white p-6 text-center text-sm font-semibold text-ink-secondary dark:border-gray-500 dark:bg-gray-800 dark:text-gray-300">
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
