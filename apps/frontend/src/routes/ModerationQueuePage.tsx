import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchPostAnalytics,
  fetchPostReports,
  moderatePost,
  updateReportStatus,
} from '@/services/posts';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { PostAnalytics, PostReport } from '@/types/posts';

const STATUS = ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const;

export function ModerationQueuePage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<PostReport[]>([]);
  const [status, setStatus] = useState<(typeof STATUS)[number]>('PENDING');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PostAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState(false);

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
      .catch(() => setAnalyticsError(true));
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
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <div>
        <Link to="/suara-warga" className="text-sm font-bold text-brand-600 hover:underline">
          ← Suara Warga
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink dark:text-white">
          Antrean Moderasi
        </h1>
        <p className="text-sm text-ink-secondary dark:text-gray-300">
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
            <Card key={String(label)} className="p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary dark:text-gray-300">
                {label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-ink dark:text-white">
                {value}
              </p>
            </Card>
          ))}
        </div>
      )}
      {analyticsError && (
        <p className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
          Ringkasan moderasi belum dapat dimuat. Daftar laporan tetap dapat digunakan.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {STATUS.map((item) => (
          <button
            key={item}
            onClick={() => setStatus(item)}
            className={`min-h-[40px] rounded-sm border-2 border-ink px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0_#171717] transition-transform hover:translate-x-px hover:translate-y-px dark:border-gray-400 ${status === item ? 'bg-[#f1dfc4] text-ink' : 'bg-white text-ink dark:bg-gray-800 dark:text-white'}`}
            aria-pressed={status === item}
          >
            {item}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="h-32 animate-pulse rounded-sm border-2 border-ink bg-warm-100 dark:border-gray-400 dark:bg-gray-800" />
      ) : reports.length === 0 ? (
        <div className="rounded-sm border-2 border-dashed border-ink bg-[#fffaf0] p-8 text-center text-ink-secondary dark:border-gray-400 dark:bg-gray-800 dark:text-gray-300">
          Tidak ada laporan dengan status ini.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const target = report.post ?? report.comment;
            return (
              <Card key={report.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="rounded-sm border border-ink bg-red-50 px-2 py-1 text-xs font-bold text-red-700 dark:border-gray-400 dark:bg-red-900/20 dark:text-red-300">
                      {report.reason}
                    </span>
                    <p className="mt-2 text-sm text-gray-500">
                      Dilaporkan oleh {report.reporter.fullName} ·{' '}
                      {new Date(report.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{report.targetType}</span>
                </div>
                <p className="mt-3 rounded-sm border border-ink/30 bg-warm-50 p-3 text-sm text-ink dark:bg-gray-900/50 dark:text-gray-100">
                  {target?.content || 'Konten tidak tersedia'}
                </p>
                {report.description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Catatan: {report.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {report.status === 'PENDING' && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void setReportStatus(report.id, 'REVIEWING')}
                      className="bg-amber-100"
                    >
                      Tinjau
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void setReportStatus(report.id, 'DISMISSED')}
                  >
                    Tolak laporan
                  </Button>
                  {report.post && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => void hideAndResolve(report)}
                    >
                      Sembunyikan & selesaikan
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void setReportStatus(report.id, 'RESOLVED')}
                  >
                    Selesaikan
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
