import { useState, useEffect, useRef } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MegaphoneIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import { AnnouncementDetailDialog } from '@/components/announcements/AnnouncementDetailDialog';
import { api } from '@/services/api';

// Metadata prioritas: label + warna badge
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Rendah', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  { value: 'normal', label: 'Normal', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'high', label: 'Penting', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
] as const;

// Target penerima pengumuman
const SCOPE_OPTIONS = [
  { value: 'all', label: 'Semua Warga' },
  { value: 'pengurus', label: 'Pengurus RT' },
] as const;

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetScope: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  title: '',
  content: '',
  priority: 'normal',
  targetScope: 'all',
  attachmentUrl: null as string | null,
  attachmentName: null as string | null,
  isPublished: true,
};

export function AnnouncementsPage() {
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [publishFilter, setPublishFilter] = useState(''); // '', 'true', 'false'

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Announcement | null>(null);
  const [detailModal, setDetailModal] = useState<Announcement | null>(null);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, publishFilter]);

  // Ubah jumlah per halaman & kembali ke halaman 1
  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  async function fetchData() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (publishFilter) params.published = publishFilter;
      const { data } = await api.get('/announcements', { params });
      setAnnouncements(data.data);
      setMeta(data.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setForm({
      title: a.title,
      content: a.content,
      priority: a.priority,
      targetScope: a.targetScope || 'all',
      attachmentUrl: a.attachmentUrl,
      attachmentName: a.attachmentName,
      isPublished: a.isPublished,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleAttachmentUpload(file: File) {
    setUploading(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/announcements/attachment', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, attachmentUrl: data.url, attachmentName: data.name }));
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal mengunggah lampiran',
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeAttachment() {
    setForm((prev) => ({ ...prev, attachmentUrl: null, attachmentName: null }));
  }

  function isContentEmpty(html: string) {
    // Buang tag HTML untuk cek apakah editor benar-benar kosong
    return html.replace(/<[^>]*>/g, '').trim().length === 0;
  }

  async function handleSave(publish: boolean) {
    if (!form.title || isContentEmpty(form.content)) {
      setFormError('Judul dan isi wajib diisi');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload = { ...form, isPublished: publish };
    try {
      if (editing) {
        await api.put(`/announcements/${editing.id}`, payload);
      } else {
        await api.post('/announcements', payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      await api.delete(`/announcements/${deleteModal.id}`);
      setDeleteModal(null);
      fetchData();
    } catch {
      // silent
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const priorityBadge = (p: string) => {
    const opt = PRIORITY_OPTIONS.find((o) => o.value === p);
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${opt?.badge || 'bg-gray-100 text-gray-600'}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${opt?.dot || 'bg-gray-400'}`} />
        {opt?.label || p}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengumuman</h1>
        {admin && (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <PlusIcon className="w-4 h-4 mr-1" /> Buat Pengumuman
          </Button>
        )}
      </div>

      {/* Filter status publikasi — hanya admin (warga selalu lihat yang terbit saja) */}
      {admin && (
        <FilterBar>
          <FilterSelect value={publishFilter} onChange={(e) => { setPublishFilter(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            <option value="true">Terbit</option>
            <option value="false">Draft</option>
          </FilterSelect>
        </FilterBar>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : announcements.length === 0 ? (
        <Card className="p-12 text-center">
          <MegaphoneIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Belum ada pengumuman</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => setDetailModal(a)}
                      className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate text-left hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {a.title}
                    </button>
                    {priorityBadge(a.priority)}
                    {!a.isPublished && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailModal(a)}
                    className="block text-left text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    {a.content
                      .replace(/<[^>]*>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim()}
                  </button>
                  {/* Indikator lampiran — lampiran ditampilkan saat detail dibuka */}
                  {a.attachmentUrl && (
                    <button
                      type="button"
                      onClick={() => setDetailModal(a)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 mb-2"
                    >
                      <PaperClipIcon className="w-3.5 h-3.5" />
                      Ada lampiran
                    </button>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{formatDate(a.createdAt)}</span>
                    {a.targetScope && a.targetScope !== 'all' && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-600 dark:text-gray-300">
                        {SCOPE_OPTIONS.find((s) => s.value === a.targetScope)?.label ||
                          a.targetScope}
                      </span>
                    )}
                  </div>
                </div>
                {admin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(a)}
                      className="text-blue-600 hover:text-blue-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal(a)}
                      className="text-red-600 hover:text-red-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {meta.total > 0 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              itemLabel="pengumuman"
            />
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Pengumuman' : 'Buat Pengumuman'}
        size="xl"
      >
        <div className="space-y-5">
          <Input
            label="Judul"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Judul pengumuman"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Isi Pengumuman
            </label>
            <RichTextEditor
              content={form.content}
              onChange={(html) => setForm({ ...form, content: html })}
              minHeight="220px"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Prioritas
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const active = form.priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: opt.value })}
                    className={`inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg border text-sm transition-colors ${
                      active
                        ? `${opt.badge} border-transparent font-medium`
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    aria-pressed={active}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target penerima */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Target Penerima
            </label>
            <select
              value={form.targetScope}
              onChange={(e) => setForm({ ...form, targetScope: e.target.value })}
              className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lampiran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Lampiran <span className="font-normal text-gray-400">(PDF/gambar, maks 5MB)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAttachmentUpload(file);
              }}
            />
            {form.attachmentUrl ? (
              <div className="flex items-center justify-between gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                <a
                  href={form.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline min-w-0"
                >
                  <PaperClipIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{form.attachmentName || 'Lihat lampiran'}</span>
                </a>
                <button
                  type="button"
                  onClick={removeAttachment}
                  aria-label="Hapus lampiran"
                  className="flex-shrink-0 text-gray-400 hover:text-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-60"
              >
                <PaperClipIcon className="w-5 h-5" />
                {uploading ? 'Mengunggah...' : 'Pilih file lampiran'}
              </button>
            )}
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
            Batal
          </Button>
          <Button variant="secondary" size="sm" loading={saving} onClick={() => handleSave(false)}>
            Simpan Draft
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={() => handleSave(true)}>
            Publikasikan
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Hapus Pengumuman"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Yakin ingin menghapus pengumuman <strong>{deleteModal?.title}</strong>?
        </p>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setDeleteModal(null)}>
            Batal
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Hapus
          </Button>
        </ModalFooter>
      </Modal>

      {/* Detail Pengumuman — dapat dibuka kembali kapan saja, lengkap dengan lampiran */}
      {detailModal && (
        <AnnouncementDetailDialog
          announcement={detailModal}
          onClose={() => setDetailModal(null)}
          footer={
            <button
              type="button"
              onClick={() => setDetailModal(null)}
              className="ml-auto px-4 h-10 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Tutup
            </button>
          }
        />
      )}
    </div>
  );
}
