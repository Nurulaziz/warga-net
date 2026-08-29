import { useState, useEffect } from 'react';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, WalletIcon } from '@heroicons/react/24/outline';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { api } from '@/services/api';

interface CashCategory {
  id: string;
  name: string;
  type: string;
  description: string | null;
}

interface CashTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  category: CashCategory;
}

interface CashSummary {
  monthIncome: number;
  monthExpense: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function CashPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [categories, setCategories] = useState<CashCategory[]>([]);
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [txModal, setTxModal] = useState(false);
  const [catModal, setCatModal] = useState(false);

  // Forms
  const [txForm, setTxForm] = useState({ categoryId: '', type: 'income', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [catForm, setCatForm] = useState({ name: '', type: 'income', description: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [page, pageSize, typeFilter, categoryFilter, startDate, endDate]);

  // Ubah jumlah per halaman & kembali ke halaman 1
  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }
  useEffect(() => {
    api.get('/cash/categories').then((res) => setCategories(res.data)).catch(() => {});
    api.get('/cash/summary').then((res) => setSummary(res.data)).catch(() => {});
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await api.get('/cash/transactions', { params });
      setTransactions(data.data);
      setMeta(data.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTx() {
    if (!txForm.categoryId || !txForm.amount || !txForm.description) { setFormError('Semua field wajib diisi'); return; }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/cash/transactions', { ...txForm, amount: parseFloat(txForm.amount) });
      setTxModal(false);
      fetchData();
      const res = await api.get('/cash/summary');
      setSummary(res.data);
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCat() {
    if (!catForm.name) { setFormError('Nama kategori wajib diisi'); return; }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/cash/categories', catForm);
      setCatModal(false);
      const res = await api.get('/cash/categories');
      setCategories(res.data);
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTx(id: string) {
    if (!confirm('Hapus transaksi ini?')) return;
    await api.delete(`/cash/transactions/${id}`);
    fetchData();
    const res = await api.get('/cash/summary');
    setSummary(res.data);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const filteredCategories = txForm.type ? categories.filter((c) => c.type === txForm.type) : categories;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kas RT</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setCatForm({ name: '', type: 'income', description: '' }); setFormError(''); setCatModal(true); }}>
            <PlusIcon className="w-4 h-4 mr-1" /> Kategori
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setTxForm({ categoryId: '', type: 'income', amount: '', description: '', date: new Date().toISOString().split('T')[0] }); setFormError(''); setTxModal(true); }}>
            <PlusIcon className="w-4 h-4 mr-1" /> Transaksi
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><ArrowUpIcon className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-xs text-gray-500">Total Pemasukan</p><p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p></div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><ArrowDownIcon className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-xs text-gray-500">Total Pengeluaran</p><p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p></div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><WalletIcon className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">Saldo</p><p className="text-lg font-bold text-blue-600">{formatCurrency(summary.balance)}</p></div>
          </Card>
        </div>
      )}

      {/* Filter */}
      <FilterBar>
        <FilterSelect
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCategoryFilter(''); setPage(1); }}
          aria-label="Filter tipe"
        >
          <option value="">Semua Tipe</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </FilterSelect>
        <FilterSelect
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="max-w-[200px]"
          aria-label="Filter kategori"
        >
          <option value="">Semua Kategori</option>
          {categories.filter((c) => !typeFilter || c.type === typeFilter).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </FilterSelect>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          aria-label="Dari tanggal"
          className="h-11 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <span className="text-gray-400 text-sm">s/d</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          aria-label="Sampai tanggal"
          className="h-11 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {(typeFilter || categoryFilter || startDate || endDate) && (
          <Button variant="ghost" size="sm" onClick={() => { setTypeFilter(''); setCategoryFilter(''); setStartDate(''); setEndDate(''); setPage(1); }} className="h-11">
            Reset
          </Button>
        )}
      </FilterBar>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell className="text-center py-8 text-gray-500" colSpan={6}>Belum ada transaksi</TableCell></TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </TableCell>
                    <TableCell>{tx.category?.name}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className={`font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => handleDeleteTx(tx.id)} className="text-red-600 hover:text-red-800 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center">Hapus</button>
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
              itemLabel="transaksi"
            />
          )}
        </>
      )}

      {/* Create Transaction Modal */}
      <Modal isOpen={txModal} onClose={() => setTxModal(false)} title="Tambah Transaksi" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe</label>
            <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value, categoryId: '' })} className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
            <select value={txForm.categoryId} onChange={(e) => setTxForm({ ...txForm, categoryId: e.target.value })} className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">Pilih kategori</option>
              {filteredCategories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <Input label="Nominal (Rp)" type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} />
          <Input label="Deskripsi" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} placeholder="Iuran bulan Januari, Beli sapu, dll" />
          <Input label="Tanggal" type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setTxModal(false)}>Batal</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleCreateTx}>Simpan</Button>
        </ModalFooter>
      </Modal>

      {/* Create Category Modal */}
      <Modal isOpen={catModal} onClose={() => setCatModal(false)} title="Tambah Kategori" size="sm">
        <div className="space-y-4">
          <Input label="Nama Kategori" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Iuran Warga, Belanja, dll" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe</label>
            <select value={catForm.type} onChange={(e) => setCatForm({ ...catForm, type: e.target.value })} className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <Input label="Deskripsi (opsional)" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setCatModal(false)}>Batal</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleCreateCat}>Simpan</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
