import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { FilterBar, SearchInput } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { TableActionButton } from '@/components/ui/TableActionButton';
import { usePaginatedApi, apiPost, apiPut, apiDelete } from '@/hooks/useApi';
import { useSettings } from '@/hooks/useSettings';

interface Family {
  id: string;
  headOfFamily: string;
  address: string;
  housingComplex: string;
  createdAt: string;
  _count?: { residents: number; users: number };
}

export function FamiliesPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Family | null>(null);
  const [editing, setEditing] = useState<Family | null>(null);
  const [formData, setFormData] = useState({ headOfFamily: '', address: '', housingComplex: settings.housing_complex });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: families, meta, loading, refetch } = usePaginatedApi<Family>('/families', { page, limit: pageSize, ...(search && { search }) });

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
    setFormData({ headOfFamily: '', address: '', housingComplex: settings.housing_complex });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(family: Family) {
    setEditing(family);
    setFormData({ headOfFamily: family.headOfFamily, address: family.address, housingComplex: family.housingComplex });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formData.headOfFamily || !formData.address) {
      setFormError('Kepala keluarga dan alamat wajib diisi');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await apiPut(`/families/${editing.id}`, formData);
      } else {
        await apiPost('/families', formData);
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
      await apiDelete(`/families/${deleteModal.id}`);
      setDeleteModal(null);
      refetch();
    } catch {
      // silent
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Keluarga</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <PlusIcon className="w-4 h-4 mr-1.5" /> Tambah Keluarga
        </Button>
      </div>

      <FilterBar>
        <SearchInput placeholder="Cari kepala keluarga atau alamat..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onSearch={handleSearch} />
        <Button variant="secondary" size="sm" onClick={handleSearch} className="h-11"><MagnifyingGlassIcon className="w-4 h-4" /></Button>
      </FilterBar>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kepala Keluarga</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Perumahan</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {families.length === 0 ? (
                <TableRow><TableCell className="py-10 text-center font-semibold text-ink dark:text-gray-200" colSpan={5}>Belum ada data keluarga</TableCell></TableRow>
              ) : (
                families.map((f) => (
                  <TableRow
                    key={f.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Lihat detail keluarga ${f.headOfFamily}`}
                    onClick={() => navigate(`/families/${f.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(`/families/${f.id}`);
                      }
                    }}
                    className="cursor-pointer focus:bg-[#f1dfc4] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ink dark:focus:bg-gray-700"
                  >
                    <TableCell className="font-semibold text-ink dark:text-gray-100">
                      {f.headOfFamily}
                    </TableCell>
                    <TableCell>{f.address}</TableCell>
                    <TableCell>{f.housingComplex || '-'}</TableCell>
                    <TableCell>{f._count?.residents || 0} orang</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <TableActionButton action="edit" label={`Edit keluarga ${f.headOfFamily}`} onClick={() => openEdit(f)} />
                        <TableActionButton action="delete" label={`Hapus keluarga ${f.headOfFamily}`} onClick={() => setDeleteModal(f)} />
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
              itemLabel="keluarga"
            />
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Keluarga' : 'Tambah Keluarga'} size="md">
        <div className="space-y-4">
          <Input label="Kepala Keluarga" value={formData.headOfFamily} onChange={(e) => setFormData({ ...formData, headOfFamily: e.target.value })} />
          <Input
            label="Alamat (Blok / Nomor Rumah)"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Contoh: Blok C2 No. 15"
            helperText="Cukup blok atau nomor rumah. RT/RW & perumahan mengikuti pengaturan sistem."
          />
          <Input label="Perumahan" value={formData.housingComplex} onChange={(e) => setFormData({ ...formData, housingComplex: e.target.value })} />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>{editing ? 'Simpan' : 'Tambah'}</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Hapus Keluarga" size="sm">
        <p className="text-gray-600 dark:text-gray-400">Yakin ingin menghapus keluarga <strong>{deleteModal?.headOfFamily}</strong>?</p>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setDeleteModal(null)}>Batal</Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>Hapus</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
