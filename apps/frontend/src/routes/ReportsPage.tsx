import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownTrayIcon, DocumentMagnifyingGlassIcon, DocumentTextIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterSelect } from '@/components/ui/FilterBar';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';

type Summary = { totalBills: number; totalAmount: number; paidAmount: number; outstandingAmount: number; paid: number; partial: number; unpaid: number; overdue: number; collectionRate: number };
type Row = { period: string; billType: string; family: string; amount: number; paid: number; outstanding: number; status: 'paid' | 'partial' | 'unpaid' | 'overdue'; dueDate: string; paidAt: string | null; methods: string; reference: string };
type Report = { summary: Summary; rows: Row[] };
type BillType = { id: string; name: string };

const currentPeriod = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; };
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
const statusMeta = { paid: ['Lunas', 'bg-green-100'], partial: ['Sebagian', 'bg-yellow-100'], unpaid: ['Belum Bayar', 'bg-white'], overdue: ['Jatuh Tempo', 'bg-red-100'] } as const;

export function ReportsPage() {
  const { showToast } = useToast();
  const [from, setFrom] = useState(currentPeriod);
  const [to, setTo] = useState(currentPeriod);
  const [billTypeId, setBillTypeId] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [types, setTypes] = useState<BillType[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const params = useMemo(() => ({ periodFrom: from || undefined, periodTo: to || undefined, billTypeId: billTypeId || undefined, status: status || undefined, method: method || undefined }), [from, to, billTypeId, status, method]);
  const load = useCallback(async () => {
    if (from && to && from > to) { showToast('Periode awal tidak boleh melewati periode akhir', 'error'); return; }
    setLoading(true);
    try { const { data } = await api.get<Report>('/export/reports/bills', { params }); setReport(data); }
    catch (error: any) { showToast(error.response?.data?.message || 'Laporan gagal dimuat', 'error'); }
    finally { setLoading(false); }
  }, [from, to, params, showToast]);

  useEffect(() => { api.get<BillType[]>('/bills/types').then(({ data }) => setTypes(data)).catch(() => setTypes([])); }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function fetchFile(extension: 'pdf' | 'xlsx' | 'csv', preview = false) {
    setExporting(preview ? 'preview' : extension);
    try {
      const { data } = await api.get(`/export/reports/bills.${extension}`, { params: { ...params, download: preview ? undefined : '1' }, responseType: 'blob', timeout: 60000 });
      const url = URL.createObjectURL(data);
      if (preview) { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(url); }
      else { const link = document.createElement('a'); link.href = url; link.download = `laporan-iuran-${from || 'semua'}-${to || 'semua'}.${extension}`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
    } catch (error: any) { showToast(error.response?.data?.message || `Gagal membuat ${extension.toUpperCase()}`, 'error'); }
    finally { setExporting(''); }
  }

  function downloadPreviewPdf() {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `laporan-iuran-${from || 'semua'}-${to || 'semua'}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const cards = report ? [
    ['Ditagihkan', money(report.summary.totalAmount), `${report.summary.totalBills} tagihan`],
    ['Diterima', money(report.summary.paidAmount), `${report.summary.paid} lunas`],
    ['Sisa Piutang', money(report.summary.outstandingAmount), `${report.summary.overdue} jatuh tempo`],
    ['Kolektibilitas', `${report.summary.collectionRate}%`, `${report.summary.partial} pembayaran sebagian`],
  ] : [];

  return (
    <div className="p-6 text-ink dark:text-gray-100">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Keuangan</p><h1 className="text-2xl font-black">Laporan Iuran</h1><p className="mt-1 text-sm font-medium text-ink-secondary dark:text-gray-300">Ringkasan penagihan dan pembayaran warga per periode.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" loading={exporting === 'preview'} onClick={() => void fetchFile('pdf', true)}><DocumentMagnifyingGlassIcon className="mr-2 h-5 w-5" />Preview PDF</Button>
          <Button variant="secondary" size="sm" loading={exporting === 'pdf'} onClick={() => void fetchFile('pdf')}><DocumentTextIcon className="mr-2 h-5 w-5" />PDF</Button>
          <Button variant="secondary" size="sm" loading={exporting === 'xlsx'} onClick={() => void fetchFile('xlsx')}><TableCellsIcon className="mr-2 h-5 w-5" />Excel</Button>
          <Button variant="secondary" size="sm" loading={exporting === 'csv'} onClick={() => void fetchFile('csv')}><ArrowDownTrayIcon className="mr-2 h-5 w-5" />CSV</Button>
        </div>
      </div>

      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-xs font-black uppercase">Periode Awal<input type="month" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-11 w-full rounded-sm border-2 border-ink bg-white px-3 text-sm font-bold text-ink shadow-[2px_2px_0_#171717] transition-colors hover:bg-[#fff8ec] focus:outline-none focus:ring-2 focus:ring-ink/25 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="text-xs font-black uppercase">Periode Akhir<input type="month" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-11 w-full rounded-sm border-2 border-ink bg-white px-3 text-sm font-bold text-ink shadow-[2px_2px_0_#171717] transition-colors hover:bg-[#fff8ec] focus:outline-none focus:ring-2 focus:ring-ink/25 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="text-xs font-black uppercase">Jenis Iuran<FilterSelect className="mt-1" value={billTypeId} onChange={(e) => setBillTypeId(e.target.value)} aria-label="Jenis iuran"><option value="">Semua Jenis</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</FilterSelect></label>
          <label className="text-xs font-black uppercase">Status<FilterSelect className="mt-1" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">Semua Status</option><option value="paid">Lunas</option><option value="partial">Sebagian</option><option value="unpaid">Belum Bayar</option><option value="overdue">Jatuh Tempo</option></FilterSelect></label>
          <label className="text-xs font-black uppercase">Metode<FilterSelect className="mt-1" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Metode pembayaran"><option value="">Semua Metode</option><option value="cash">Tunai</option><option value="transfer">Transfer</option><option value="qris">QRIS</option><option value="bank_transfer">Bank Transfer</option><option value="gopay">GoPay</option></FilterSelect></label>
        </div>
      </Card>

      {loading ? <div className="py-20 text-center font-bold">Memuat laporan...</div> : report && <>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, note]) => <Card key={label} className="p-5"><p className="text-xs font-black uppercase tracking-wider text-ink-secondary">{label}</p><p className="mt-2 text-2xl font-black">{value}</p><p className="mt-1 text-xs font-semibold text-ink-secondary">{note}</p></Card>)}</div>
        <Card className="overflow-hidden p-0">
          <Table><TableHeader><TableRow><TableHead>Periode</TableHead><TableHead>Jenis Iuran</TableHead><TableHead>Keluarga</TableHead><TableHead className="text-right">Tagihan</TableHead><TableHead className="text-right">Dibayar</TableHead><TableHead className="text-right">Sisa</TableHead><TableHead>Status</TableHead><TableHead>Jatuh Tempo</TableHead><TableHead>Metode</TableHead></TableRow></TableHeader>
          <TableBody>{report.rows.length ? report.rows.map((row, index) => <TableRow key={`${row.period}-${row.family}-${row.billType}-${index}`}><TableCell>{row.period}</TableCell><TableCell className="font-bold">{row.billType}</TableCell><TableCell>{row.family}</TableCell><TableCell className="text-right font-bold">{money(row.amount)}</TableCell><TableCell className="text-right">{money(row.paid)}</TableCell><TableCell className="text-right font-bold">{money(row.outstanding)}</TableCell><TableCell><span className={`inline-flex rounded-sm border-2 border-ink px-2 py-1 text-xs font-black ${statusMeta[row.status][1]}`}>{statusMeta[row.status][0]}</span></TableCell><TableCell>{date(row.dueDate)}</TableCell><TableCell>{row.methods}</TableCell></TableRow>) : <TableRow><TableCell colSpan={9} className="py-16 text-center font-bold">Tidak ada data untuk filter yang dipilih.</TableCell></TableRow>}</TableBody></Table>
        </Card>
      </>}

      <Modal isOpen={Boolean(previewUrl)} onClose={() => setPreviewUrl('')} title="Preview Laporan Iuran" size="xl"><div className="h-[72vh] overflow-hidden rounded-sm border-2 border-ink bg-white shadow-[3px_3px_0_#171717]">{previewUrl && <iframe title="Preview PDF laporan iuran" src={previewUrl} className="h-full w-full" />}</div><div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={() => setPreviewUrl('')}>Tutup</Button><Button onClick={downloadPreviewPdf}>Download PDF</Button></div></Modal>
    </div>
  );
}
