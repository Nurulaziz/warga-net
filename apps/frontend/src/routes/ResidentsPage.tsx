import { useState } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { FilterBar, SearchInput, FilterSelect } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { usePaginatedApi, apiPost, apiPut, apiDelete } from '@/hooks/useApi';

interface Resident {
  id: string;
  fullName: string;
  idNumber: string;
  birthDate: string;
  gender: string;
  relationship: string;
  familyId: string;
  family?: { id: string; headOfFamily: string };
}

interface Family {
  id: string;
  headOfFamily: string;
}

export function ResidentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Resident | null>(null);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [formData, setFormData] = useState({ fullName: '', idNumber: '', birthDate: '', gender: 'Laki-laki', relationship: '', familyId: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: residents, meta, loading, refetch } = usePaginatedApi<Resident>('/residents', { page, limit: pageSize, ...(search && { search }), ...(familyFilter && { familyId: familyFilter }) });
  const { data: families } = usePaginatedApi<Family>('/families', { limit: 100 });

  // Ubah jumlah per halaman & kembali ke halaman 1
  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormData({ fullName: '', idNumber: '', birthDate: '', gender: 'Laki-laki', relationship: '', familyId: '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(r: Resident) {
    setEditing(r);
    setFormData({ fullName: r.fullName, idNumber: r.idNumber, birthDate: r.birthDate.split('T')[0], gender: r.gender, relationship: r.relationship, familyId: r.familyId });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formData.fullName || !formData.idNumber || !formData.familyId || !formData.birthDate) {
      setFormError('Field wajib belum lengkap');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await apiPut(`/residents/${editing.id}`, formData);
      } else {
        await apiPost('/residents', formData);
      }
      setModalOpen(false);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan data';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      await apiDelete(`/residents/${deleteModal.id}`);
      setDeleteModal(null);
      refetch();
    } catch {
      // silent
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Warga</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.open('/api/v1/export/residents', '_blank')}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button variant="primary" size="sm" onClick={openCreate}>
            <PlusIcon className="w-4 h-4 mr-1.5" /> Tambah Warga
          </Button>
        </div>
      </div>

      <FilterBar>
        <SearchInput placeholder="Cari nama atau NIK..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onSearch={handleSearch} />
        <Button variant="secondary" size="sm" onClick={handleSearch} className="h-11"><MagnifyingGlassIcon className="w-4 h-4" /></Button>
        <FilterSelect value={familyFilter} onChange={(e) => { setFamilyFilter(e.target.value); setPage(1); }} className="max-w-[220px]">
          <option value="">Semua Keluarga</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>{f.headOfFamily}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>Hubungan</TableHead>
                <TableHead>Keluarga</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.length === 0 ? (
                <TableRow><TableCell className="text-center py-8 text-gray-500" colSpan={6}>Belum ada data warga</TableCell></TableRow>
              ) : (
                residents.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.fullName}</TableCell>
                    <TableCell>{r.idNumber}</TableCell>
                    <TableCell>{r.gender}</TableCell>
                    <TableCell>{r.relationship}</TableCell>
                    <TableCell>{r.family?.headOfFamily || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800 min-h-[44px] min-w-[44px] flex items-center justify-center"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteModal(r)} className="text-red-600 hover:text-red-800 min-h-[44px] min-w-[44px] flex items-center justify-center"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {meta.total > 0 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              itemLabel="warga"
            />
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Warga' : 'Tambah Warga'} size="lg">
        <div className="space-y-4">
          <Input label="Nama Lengkap" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
          <Input label="NIK" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tanggal Lahir" type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Kelamin</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>
          <Input label="Hubungan dalam Keluarga" value={formData.relationship} onChange={(e) => setFormData({ ...formData, relationship: e.target.value })} placeholder="Kepala Keluarga, Istri, Anak..." />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keluarga</label>
            <select value={formData.familyId} onChange={(e) => setFormData({ ...formData, familyId: e.target.value })} className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">Pilih Keluarga</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>{f.headOfFamily}</option>
              ))}
            </select>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>{editing ? 'Simpan' : 'Tambah'}</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Hapus Warga" size="sm">
        <p className="text-gray-600 dark:text-gray-400">Yakin ingin menghapus <strong>{deleteModal?.fullName}</strong>?</p>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setDeleteModal(null)}>Batal</Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>Hapus</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
