import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { api } from '@/services/api';

interface Permission {
  id: string;
  feature: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: { permission: Permission }[];
  _count: { users: number };
}

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Role | null>(null);
  const [editing, setEditing] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions'),
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function openCreate() {
    setEditing(null);
    setFormData({ name: '', description: '' });
    setSelectedPerms([]);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(role: Role) {
    setEditing(role);
    setFormData({ name: role.name, description: role.description || '' });
    setSelectedPerms(role.permissions.map((p) => p.permission.id));
    setFormError('');
    setModalOpen(true);
  }

  function togglePerm(id: string) {
    setSelectedPerms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (!formData.name) { setFormError('Nama role wajib diisi'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await api.put(`/roles/${editing.id}`, formData);
        await api.put(`/roles/${editing.id}/permissions`, { permissionIds: selectedPerms });
      } else {
        const { data: newRole } = await api.post('/roles', formData);
        if (selectedPerms.length > 0) {
          await api.put(`/roles/${newRole.id}/permissions`, { permissionIds: selectedPerms });
        }
      }
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      await api.delete(`/roles/${deleteModal.id}`);
      setDeleteModal(null);
      fetchData();
    } catch {
      // silent
    }
  }

  // Group permissions by feature
  const groupedPerms = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.feature]) acc[p.feature] = [];
    acc[p.feature].push(p);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Role & Permission</h1>
        <Button variant="primary" size="sm" onClick={openCreate}><PlusIcon className="w-4 h-4 mr-1.5" /> Tambah Role</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Role</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow><TableCell className="text-center py-8 text-gray-500" colSpan={5}>Belum ada role</TableCell></TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description || '-'}</TableCell>
                  <TableCell>{role.permissions.length} permission</TableCell>
                  <TableCell>{role._count.users} user</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(role)} className="text-blue-600 hover:text-blue-800 min-h-[44px] min-w-[44px] flex items-center justify-center"><PencilIcon className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteModal(role)} className="text-red-600 hover:text-red-800 min-h-[44px] min-w-[44px] flex items-center justify-center" disabled={role._count.users > 0}><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Role' : 'Tambah Role'} size="lg">
        <div className="space-y-4">
          <Input label="Nama Role" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Deskripsi" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          {Object.keys(groupedPerms).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-60 overflow-y-auto space-y-3">
                {Object.entries(groupedPerms).map(([feature, perms]) => (
                  <div key={feature}>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{feature}</p>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((p) => (
                        <label key={p.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input type="checkbox" checked={selectedPerms.includes(p.id)} onChange={() => togglePerm(p.id)} className="w-4 h-4" />
                          {p.action}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>{editing ? 'Simpan' : 'Tambah'}</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Hapus Role" size="sm">
        <p className="text-gray-600 dark:text-gray-400">Yakin ingin menghapus role <strong>{deleteModal?.name}</strong>?</p>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setDeleteModal(null)}>Batal</Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>Hapus</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
