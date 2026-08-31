import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchPostAnalytics,
  fetchPostReports,
  moderatePost,
  updateReportStatus,
} from '@/services/posts';
import { useToast } from '@/components/ui/Toast';
import type { PostAnalytics, PostReport } from '@/types/posts';

const STATUS = ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const;

export function ModerationQueuePage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<PostReport[]>([]);
  const [status, setStatus] = useState<(typeof STATUS)[number]>('PENDING');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PostAnalytics | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReports((await fetchPostReports({ status, limit: 50 })).data);
    } catch {
      showToast('Gagal memuat laporan', 'error');
    } finally {
      setLoading(false);
    }
  }, [status, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchPostAnalytics()
      .then(setAnalytics)
      .catch(() => undefined);
  }, []);

  async function setReportStatus(id: string, next: 'REVIEWING' | 'RESOLVED' | 'DISMISSED') {
    await updateReportStatus(id, next);
    showToast('Status laporan diperbarui');
    await load();
  }

  async function hideAndResolve(report: PostReport) {
    const postId = report.post?.id ?? report.comment?.postId;
    if (!postId) return;
    await moderatePost(postId, 'hide');
    await updateReportStatus(report.id, 'RESOLVED');
    showToast('Posting disembunyikan dan laporan diselesaikan');
    await load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div>
        <Link to="/suara-warga" className="text-sm text-primary hover:underline">
          ← Suara Warga
        </Link>
        <h1 className="mt-1 text-2xl font-bold dark:text-white">Antrean Moderasi</h1>
        <p className="text-sm text-gray-500">
          Tinjau laporan warga dan ambil tindakan pada konten.
        </p>
      </div>
      {analytics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Posting', analytics.totalPosts],
            ['Komentar', analytics.totalComments],
            ['Reaksi', analytics.totalReactions],
            ['Laporan tertunda', analytics.pendingReports],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-xl border bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <p className="text-xs text-gray-500">{label}</p>
              <p className="mt-1 text-2xl font-bold dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {STATUS.map((item) => (
          <button
            key={item}
            onClick={() => setStatus(item)}
            className={`rounded-full px-3 py-1.5 text-sm ${status === item ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            {item}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
          Tidak ada laporan dengan status ini.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const target = report.post ?? report.comment;
            return (
              <article
                key={report.id}
                className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-300">
                      {report.reason}
                    </span>
                    <p className="mt-2 text-sm text-gray-500">
                      Dilaporkan oleh {report.reporter.fullName} ·{' '}
                      {new Date(report.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{report.targetType}</span>
                </div>
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-900/50">
                  {target?.content || 'Konten tidak tersedia'}
                </p>
                {report.description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Catatan: {report.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {report.status === 'PENDING' && (
                    <button
                      onClick={() => void setReportStatus(report.id, 'REVIEWING')}
                      className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800"
                    >
                      Tinjau
                    </button>
                  )}
                  <button
                    onClick={() => void setReportStatus(report.id, 'DISMISSED')}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium dark:bg-gray-700"
                  >
                    Tolak laporan
                  </button>
                  {report.post && (
                    <button
                      onClick={() => void hideAndResolve(report)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white"
                    >
                      Sembunyikan & selesaikan
                    </button>
                  )}
                  <button
                    onClick={() => void setReportStatus(report.id, 'RESOLVED')}
                    className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white"
                  >
                    Selesaikan
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
