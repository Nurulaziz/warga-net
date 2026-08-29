import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { authClient } from '@/lib/auth-client';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { FilterBar, SearchInput, FilterSelect } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { usePaginatedApi, apiPost, apiPut, apiDelete } from '@/hooks/useApi';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/services/api';

interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  roleId: string;
  familyId: string | null;
  isActive: boolean;
  createdAt: string;
  role: { id: string; name: string };
}

interface Role {
  id: string;
  name: string;
}

interface Family {
  id: string;
  headOfFamily: string;
}

export function UsersPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ fullName: '', phoneNumber: '', roleId: '', familyId: '', isActive: true });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: users, meta, loading, refetch } = usePaginatedApi<User>('/users', { page, limit: pageSize, ...(search && { search }), ...(roleFilter && { roleId: roleFilter }) });

  // Ubah jumlah per halaman & kembali ke halaman 1
  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  // Roles tidak paginated, fetch langsung
  const [roles, setRoles] = useState<Role[]>([]);
  useEffect(() => {
    api.get('/roles').then((res) => setRoles(res.data)).catch(() => {});
  }, []);

  // Daftar keluarga untuk dropdown pengikatan user (paginated, ambil limit besar)
  const [families, setFamilies] = useState<Family[]>([]);
  useEffect(() => {
    api.get('/families', { params: { limit: 1000 } }).then((res) => setFamilies(res.data.data || [])).catch(() => {});
  }, []);

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function openCreate() {
    setEditingUser(null);
    setFormData({ fullName: '', phoneNumber: '+62', roleId: '', familyId: '', isActive: true });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setFormData({ fullName: user.fullName, phoneNumber: user.phoneNumber, roleId: user.roleId, familyId: user.familyId ?? '', isActive: user.isActive });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formData.fullName || !formData.phoneNumber || !formData.roleId) {
      setFormError('Semua field wajib diisi');
      return;
    }
    setSaving(true);
    setFormError('');
    // familyId opsional: kirim undefined jika tidak dipilih
    const payload = { ...formData, familyId: formData.familyId || undefined };
    try {
      if (editingUser) {
        await apiPut(`/users/${editingUser.id}`, payload);
      } else {
        await apiPost('/users', payload);
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
      await apiDelete(`/users/${deleteModal.id}`);
      setDeleteModal(null);
      refetch();
    } catch {
      // Error handling
    }
  }

  // Impersonate user — resolve BA user ID lalu buat session sebagai user tersebut
  async function handleImpersonate(userId: string) {
    try {
      // Ambil BetterAuth user ID dari backend (mapping users.id → ba_user.id)
      const { data } = await api.get<{ baUserId: string }>(`/users/${userId}/ba-id`);
      const result = await authClient.admin.impersonateUser({ userId: data.baUserId });
      if (result.error) {
        showToast(result.error.message || 'Gagal impersonate user', 'error');
        return;
      }
      window.location.reload();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'User belum pernah login, jadi belum bisa di-impersonate';
      showToast(msg, 'error');
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengguna</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <PlusIcon className="w-4 h-4 mr-1.5" /> Tambah Pengguna
        </Button>
      </div>

      {/* Search & Filter */}
      <FilterBar>
        <SearchInput
          placeholder="Cari nama atau nomor telepon..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onSearch={handleSearch}
        />
        <Button variant="secondary" size="sm" onClick={handleSearch} className="h-11">
          <MagnifyingGlassIcon className="w-4 h-4" />
        </Button>
        <FilterSelect value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8 text-gray-500" colSpan={5}>
                    Belum ada data pengguna
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>{user.role?.name || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isAdmin() && (
                          <button onClick={() => handleImpersonate(user.id)} title="Impersonate" className="text-amber-600 hover:text-amber-800 min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <UserIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(user)} className="text-blue-600 hover:text-blue-800 min-h-[44px] min-w-[44px] flex items-center justify-center">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteModal(user)} className="text-red-600 hover:text-red-800 min-h-[44px] min-w-[44px] flex items-center justify-center">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta.total > 0 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              itemLabel="pengguna"
            />
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'} size="md">
        <div className="space-y-4">
          <Input label="Nama Lengkap" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
          <Input label="Nomor Telepon" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="+628xxxxxxxxxx" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Pilih Role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keluarga</label>
            <select
              value={formData.familyId}
              onChange={(e) => setFormData({ ...formData, familyId: e.target.value })}
              className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Tanpa keluarga</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>{f.headOfFamily}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Aktif</label>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>{editingUser ? 'Simpan' : 'Tambah'}</Button>
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Hapus Pengguna" size="sm">
        <p className="text-gray-600 dark:text-gray-400">Yakin ingin menghapus <strong>{deleteModal?.fullName}</strong>?</p>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setDeleteModal(null)}>Batal</Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>Hapus</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
