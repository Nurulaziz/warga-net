import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PlusIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentMagnifyingGlassIcon,
  PencilIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';

interface BillType {
  id: string;
  name: string;
  amount: number;
  period: string;
  description?: string | null;
  isActive: boolean;
  autoGenerate: boolean;
  generateDay: number;
  dueDay: number;
}

// Label periode jenis iuran
const PERIOD_LABELS: Record<string, string> = {
  monthly: 'Bulanan',
  yearly: 'Tahunan',
  once: 'Sekali Bayar',
};

interface Bill {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  period: string;
  billType: { id: string; name: string };
  family: { id: string; headOfFamily: string };
  payments: {
    id: string;
    amount: number;
    paidAt: string;
    method?: string;
    transactionStatus?: string | null;
    paidBy?: string | null;
    proofUrl?: string | null;
    proofName?: string | null;
    orderId?: string | null;
    referenceNo?: string | null;
    paymentType?: string | null;
  }[];
}

// Ambil pembayaran yang benar-benar sah (untuk menampilkan info lunas)
function getSettledPayment(bill: Bill) {
  return bill.payments.find(
    (p) =>
      p.method === 'cash' ||
      p.method === 'transfer' ||
      p.transactionStatus === 'settlement' ||
      p.transactionStatus === 'capture',
  );
}

// Label metode pembayaran yang ramah pengguna
const METHOD_LABELS: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  midtrans: 'Online',
};

// ID container untuk Snap embedded
const SNAP_CONTAINER_ID = 'snap-container';

interface Summary {
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export function BillsPage() {
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const { settings } = useSettings();
  const [bills, setBills] = useState<Bill[]>([]);
  const [billTypes, setBillTypes] = useState<BillType[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  // Default periode = bulan berjalan (YYYY-MM) agar data langsung terfilter
  const [periodFilter, setPeriodFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [billTypeFilter, setBillTypeFilter] = useState('');
  const [search, setSearch] = useState(''); // query pencarian aktif
  const [searchInput, setSearchInput] = useState(''); // teks di kotak pencarian
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()); // tagihan terpilih (bulk)
  const [bulkPaying, setBulkPaying] = useState(false); // proses bayar massal berjalan

  // Modals
  const [typeModal, setTypeModal] = useState(false); // modal kelola jenis iuran
  const [typeView, setTypeView] = useState<'list' | 'form'>('list'); // tampilan di dalam modal
  const [editingType, setEditingType] = useState<BillType | null>(null);
  const [generateModal, setGenerateModal] = useState(false);
  const [payModal, setPayModal] = useState<Bill | null>(null);
  const [detailModal, setDetailModal] = useState<Bill | null>(null);

  // Forms
  const [typeForm, setTypeForm] = useState({
    name: '',
    amount: '',
    period: 'monthly',
    description: '',
    autoGenerate: true,
    generateDay: '1',
    dueDay: '10',
  });
  const [typeActionId, setTypeActionId] = useState<string | null>(null); // id yang sedang di-toggle
  const [generateForm, setGenerateForm] = useState({ billTypeId: '', period: '', dueDate: '' });
  const [payForm, setPayForm] = useState({ amount: '', paidBy: '', method: 'cash', note: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [payingOnline, setPayingOnline] = useState<string | null>(null); // billId yang sedang proses
  const [generatingMonthly, setGeneratingMonthly] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState(false);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState(false);
  // Bukti bayar: preview (lightbox) + proses unggah
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const proofFileInput = useRef<HTMLInputElement | null>(null);

  // Notifikasi inline (pengganti alert)
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const toastTimer = useRef<number | null>(null);
  // Konfirmasi sebelum membuka pembayaran online (Midtrans Snap)
  const [confirmPay, setConfirmPay] = useState<Bill | null>(null);
  // Modal pembayaran Snap embedded (di dalam halaman, bukan popup)
  const [snapBill, setSnapBill] = useState<Bill | null>(null);

  // Tampilkan toast, auto-hilang setelah 4 detik
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  // Bersihkan timer toast saat unmount
  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  // Load Midtrans Snap.js
  useEffect(() => {
    async function loadSnap() {
      try {
        const { data } = await api.get('/bills/midtrans/config');
        const { clientKey, isProduction } = data as { clientKey: string; isProduction: boolean };
        if (!clientKey) return;

        const scriptUrl = isProduction
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';

        // Cek apakah script sudah ada
        if (document.querySelector(`script[src="${scriptUrl}"]`)) return;

        const script = document.createElement('script');
        script.src = scriptUrl;
        script.setAttribute('data-client-key', clientKey);
        script.async = true;
        document.head.appendChild(script);
      } catch {
        // Midtrans tidak dikonfigurasi — abaikan
      }
    }
    loadSnap();
  }, []);

  // Tutup modal pembayaran embedded & bersihkan instance Snap
  const closeSnapModal = useCallback(() => {
    try {
      (window as any).snap?.hide?.();
    } catch {
      // abaikan
    }
    const container = document.getElementById(SNAP_CONTAINER_ID);
    if (container) container.innerHTML = '';
    setSnapBill(null);
  }, []);

  // Bayar online via Midtrans Snap (mode embedded di dalam halaman)
  const handlePayOnline = useCallback(
    async (bill: Bill) => {
      setPayingOnline(bill.id);
      try {
        const { data } = await api.post(`/bills/pay/${bill.id}`);
        const { token } = data as { token: string };

        // Verifikasi status ke backend (fallback jika webhook Midtrans tak sampai di lokal)
        const verifyAndRefresh = async () => {
          try {
            await api.post(`/bills/verify/${bill.id}`);
          } catch {
            // abaikan; tetap refresh
          }
          fetchData();
          api
            .get('/bills/summary', { params: { period: periodFilter || undefined } })
            .then((res) => setSummary(res.data))
            .catch(() => {});
        };

        // Tampilkan modal dulu supaya elemen container tersedia, lalu embed Snap
        setSnapBill(bill);
        setPayingOnline(null);

        // Tunggu container ter-render pada DOM
        setTimeout(() => {
          const snap = (window as any).snap;
          const container = document.getElementById(SNAP_CONTAINER_ID);
          if (!snap?.embed || !container) {
            closeSnapModal();
            showToast('error', 'Layanan pembayaran belum siap. Coba lagi sebentar.');
            return;
          }
          container.innerHTML = '';
          snap.embed(token, {
            embedId: SNAP_CONTAINER_ID,
            onSuccess: async () => {
              await verifyAndRefresh();
              closeSnapModal();
              showToast('success', 'Pembayaran berhasil. Terima kasih!');
            },
            onPending: async () => {
              await verifyAndRefresh();
              closeSnapModal();
              showToast('info', 'Pembayaran sedang diproses. Status akan diperbarui otomatis.');
            },
            onError: () => {
              closeSnapModal();
              showToast('error', 'Pembayaran gagal atau dibatalkan.');
            },
            onClose: () => {
              verifyAndRefresh();
              setSnapBill(null);
            },
          });
        }, 60);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal memproses pembayaran';
        showToast('error', msg);
        setPayingOnline(null);
      }
    },
    [periodFilter, showToast, closeSnapModal],
  );

  useEffect(() => {
    fetchData();
    setSelectedIds(new Set()); // reset pilihan saat filter/halaman berubah
  }, [page, pageSize, statusFilter, periodFilter, billTypeFilter, search]);

  // Ubah jumlah per halaman & kembali ke halaman 1
  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  useEffect(() => {
    api
      .get('/bills/types')
      .then((res) => setBillTypes(res.data))
      .catch(() => {});
    api
      .get('/bills/summary', { params: { period: periodFilter || undefined } })
      .then((res) => setSummary(res.data))
      .catch(() => {});
  }, [periodFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      if (periodFilter) params.period = periodFilter;
      if (billTypeFilter) params.billTypeId = billTypeFilter;
      if (search) params.search = search;
      const { data } = await api.get('/bills', { params });
      setBills(data.data);
      setMeta(data.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function refreshBillTypes() {
    const res = await api.get('/bills/types');
    setBillTypes(res.data);
  }

  function openCreateType() {
    setEditingType(null);
    setTypeForm({
      name: '',
      amount: '',
      period: 'monthly',
      description: '',
      autoGenerate: true,
      generateDay: '1',
      dueDay: '10',
    });
    setFormError('');
    setTypeView('form');
  }

  function openEditType(t: BillType) {
    setEditingType(t);
    setTypeForm({
      name: t.name,
      amount: String(t.amount),
      period: t.period,
      description: t.description || '',
      autoGenerate: t.autoGenerate,
      generateDay: String(t.generateDay ?? 1),
      dueDay: String(t.dueDay ?? 10),
    });
    setFormError('');
    setTypeView('form');
  }

  async function handleSaveType() {
    if (!typeForm.name || !typeForm.amount) {
      setFormError('Nama dan nominal wajib diisi');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const isMonthly = typeForm.period === 'monthly';
      const payload = {
        name: typeForm.name,
        amount: parseFloat(typeForm.amount),
        period: typeForm.period,
        description: typeForm.description,
        // Penjadwalan hanya relevan untuk iuran bulanan
        autoGenerate: isMonthly ? typeForm.autoGenerate : false,
        generateDay: parseInt(typeForm.generateDay, 10) || 1,
        dueDay: parseInt(typeForm.dueDay, 10) || 10,
      };
      if (editingType) {
        await api.put(`/bills/types/${editingType.id}`, payload);
      } else {
        await api.post('/bills/types', payload);
      }
      setTypeView('list');
      await refreshBillTypes();
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan',
      );
    } finally {
      setSaving(false);
    }
  }

  // Nonaktifkan / aktifkan kembali jenis iuran
  async function handleToggleTypeActive(t: BillType) {
    setTypeActionId(t.id);
    try {
      if (t.isActive) {
        await api.delete(`/bills/types/${t.id}`); // soft delete -> isActive false
      } else {
        await api.put(`/bills/types/${t.id}`, { isActive: true });
      }
      await refreshBillTypes();
    } catch {
      // silent
    } finally {
      setTypeActionId(null);
    }
  }

  async function handleGenerate() {
    if (!generateForm.billTypeId || !generateForm.period || !generateForm.dueDate) {
      setFormError('Semua field wajib diisi');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/bills/generate', generateForm);
      setGenerateModal(false);
      fetchData();
      const res = await api.get('/bills/summary', {
        params: { period: periodFilter || undefined },
      });
      setSummary(res.data);
      showToast('success', 'Tagihan berhasil dibuat.');
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal generate',
      );
    } finally {
      setSaving(false);
    }
  }

  // Generate tagihan untuk semua jenis iuran bulanan aktif (periode berjalan)
  async function handleGenerateMonthly() {
    setGeneratingMonthly(true);
    try {
      const { data } = await api.post('/bills/generate-monthly');
      fetchData();
      const res = await api.get('/bills/summary', {
        params: { period: periodFilter || undefined },
      });
      setSummary(res.data);
      showToast(
        'success',
        `Tagihan bulan ${data.period}: ${data.totalCreated} dibuat, ${data.totalSkipped} sudah ada.`,
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal generate tagihan bulanan';
      showToast('error', msg);
    } finally {
      setGeneratingMonthly(false);
    }
  }

  // Hapus pembayaran: menghapus entri kas terkait & mengembalikan status tagihan
  async function handleDeletePayment() {
    if (!detailModal) return;
    const settled = getSettledPayment(detailModal);
    if (!settled) return;
    setDeletingPayment(true);
    try {
      await api.delete(`/bills/payments/${settled.id}`);
      setDetailModal(null);
      setConfirmDeletePayment(false);
      fetchData();
      const res = await api.get('/bills/summary', {
        params: { period: periodFilter || undefined },
      });
      setSummary(res.data);
      showToast('success', 'Pembayaran dihapus dan status tagihan dikembalikan.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menghapus pembayaran';
      showToast('error', msg);
    } finally {
      setDeletingPayment(false);
    }
  }

  // Unggah bukti bayar (foto struk transfer / bukti manual) untuk pembayaran yang ditampilkan
  async function handleUploadProof(file: File) {
    if (!detailModal) return;
    const settled = getSettledPayment(detailModal);
    if (!settled) return;
    setUploadingProof(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post(`/bills/payments/${settled.id}/proof`, form);
      const updatedPayment = { ...settled, proofUrl: data.proofUrl, proofName: data.proofName };
      setDetailModal({
        ...detailModal,
        payments: detailModal.payments.map((p) => (p.id === settled.id ? updatedPayment : p)),
      });
      showToast('success', 'Bukti bayar berhasil diunggah.');
      fetchData();
    } catch (err: unknown) {
      showToast(
        'error',
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal mengunggah bukti bayar',
      );
    } finally {
      setUploadingProof(false);
    }
  }

  // Pemicu input file tersembunyi; reset value agar file yang sama bisa dipilih lagi
  function handleProofFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUploadProof(file);
    e.target.value = '';
  }

  // Unduh struk pembayaran digital sebagai gambar PNG (nama keluarga, jenis iuran,
  // nominal, referensi transaksi, dan status pembayaran). Dirender lewat Canvas.
  function downloadStrukImage(
    bill: NonNullable<typeof detailModal>,
    payment: NonNullable<ReturnType<typeof getSettledPayment>>,
  ) {
    const receiptNo = `STK-${payment.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
    const methodLabel = METHOD_LABELS[payment.method || ''] || payment.method || '-';
    const rtClean = (settings.rt_name || '').replace(/^RT\s*/i, '');
    const rwClean = (settings.rw_name || '').replace(/^RW\s*/i, '');
    const address = [
      settings.housing_complex,
      `RT ${rtClean} / RW ${rwClean}`,
      [settings.kelurahan, settings.kecamatan, settings.kabupaten, settings.provinsi]
        .filter(Boolean)
        .join(', '),
    ]
      .filter(Boolean)
      .join(' · ');

    // Skala 2x supaya hasil unduhan tajam
    const S = 2;
    const W = 400;
    const PAD = 24;
    const FONT = "'Segoe UI', Helvetica, Arial, sans-serif";
    const wrapText = (
      ctx: CanvasRenderingContext2D,
      text: string,
      size: number,
      weight: number,
      maxWidth: number,
    ) => {
      ctx.font = `${weight} ${size}px ${FONT}`;
      const words = text.split(' ');
      const lines: string[] = [];
      let line = '';
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines;
    };
    const roundedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // --- Hitung layout (pass pengukuran) ---
    const scratch = document.createElement('canvas');
    const sctx = scratch.getContext('2d')!;
    const contentW = W - PAD * 2;
    const brand = settings.app_name || 'WargaNet';
    const addressLines = wrapText(sctx, address, 11, 400, contentW);
    const titleText = 'BUKTI PEMBAYARAN IURAN';
    const amountLabel = 'TOTAL PEMBAYARAN';
    const amountText = formatCurrency(payment.amount);
    const rows: [string, string][] = [
      ['Keluarga', bill.family?.headOfFamily || '-'],
      ['Jenis Iuran', bill.billType?.name || '-'],
      ['Periode', formatPeriodId(bill.period)],
      ['Tanggal Bayar', `${formatDateTime(payment.paidAt)} WIB`],
      ['Metode', methodLabel],
    ];
    const transactionRef = payment.referenceNo || payment.orderId;
    if (transactionRef) rows.push(['Referensi', transactionRef]);
    const paidBy = (payment.paidBy || '').trim();
    const headOfFamily = bill.family?.headOfFamily || '';
    if (paidBy && paidBy.toLowerCase() !== headOfFamily.toLowerCase()) {
      rows.push(['Dibayar oleh', paidBy]);
    }
    const isOnlinePayment = payment.method === 'midtrans';
    const metaLines = [
      isOnlinePayment ? 'Tercatat otomatis oleh sistem' : 'Dicatat oleh Bendahara / Pengurus RT',
      `Struk dibuat ${formatDateTime(new Date().toISOString())} WIB`,
    ];
    const footText = `Dicetak dari ${settings.app_name || 'WargaNet'} · ${settings.housing_complex || ''}`;

    let y = PAD; // akumulasi tinggi guci
    const brandH = 26;
    y += brandH;
    y += addressLines.length * 15 + 6;
    const titleH = 14;
    y += titleH + 5;
    const receiptMetaH = 15;
    y += receiptMetaH;
    const statusH = 28;
    y += statusH + 8;
    const dashH = 10;
    y += dashH + 8;
    const rowH = 22;
    y += rows.length * rowH + 14;
    const boxH = 58;
    y += boxH + 18;
    y += metaLines.length * 15 + 12;
    y += 14;
    const finalH = Math.ceil(y);

    // --- Gambar final ---
    const canvas = document.createElement('canvas');
    canvas.width = W * S;
    canvas.height = finalH * S;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(S, S);
    ctx.textBaseline = 'alphabetic';

    // Latar
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, finalH);

    let cursor = PAD;

    // Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111827';
    ctx.font = `800 18px ${FONT}`;
    ctx.fillText(brand, W / 2, cursor + 16);
    cursor += brandH;
    ctx.fillStyle = '#6b7280';
    ctx.font = `400 11px ${FONT}`;
    for (let i = 0; i < addressLines.length; i++) {
      ctx.fillText(addressLines[i], W / 2, cursor + 12);
      cursor += 15;
    }
    cursor += 6;
    ctx.fillStyle = '#374151';
    ctx.font = `700 9px ${FONT}`;
    ctx.fillText(titleText, W / 2, cursor + 11);
    cursor += titleH + 5;

    // Nomor struk dan status dibuat eksplisit agar mudah diverifikasi tanpa
    // mengganggu rincian maupun nominal seperti watermark berukuran besar.
    ctx.fillStyle = '#9ca3af';
    ctx.font = `500 9px ${FONT}`;
    ctx.fillText(receiptNo, W / 2, cursor + 10);
    cursor += receiptMetaH;
    const statusW = 66;
    const statusX = (W - statusW) / 2;
    roundedRect(ctx, statusX, cursor + 2, statusW, 22, 11);
    ctx.fillStyle = '#dcfce7';
    ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.font = `800 9px ${FONT}`;
    ctx.fillText('✓  LUNAS', W / 2, cursor + 16);
    cursor += statusH + 8;

    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD, cursor);
    ctx.lineTo(W - PAD, cursor);
    ctx.stroke();
    ctx.setLineDash([]);
    cursor += dashH + 8;

    // Baris rincian (label kiri, nilai kanan)
    ctx.textAlign = 'left';
    for (let index = 0; index < rows.length; index++) {
      const [label, value] = rows[index];
      ctx.fillStyle = '#6b7280';
      ctx.font = `400 11px ${FONT}`;
      ctx.fillText(label, PAD, cursor + 12);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#111827';
      ctx.font = `600 11px ${FONT}`;
      const valueText = value.length > 36 ? `${value.slice(0, 35)}…` : value;
      ctx.fillText(valueText, W - PAD, cursor + 12);
      ctx.textAlign = 'left';
      if (index < rows.length - 1) {
        ctx.strokeStyle = '#f3f4f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD, cursor + rowH - 2);
        ctx.lineTo(W - PAD, cursor + rowH - 2);
        ctx.stroke();
      }
      cursor += rowH;
    }
    cursor += 14;

    // Kotak nominal
    const amountBoxX = PAD + 8;
    const amountBoxW = W - PAD * 2 - 16;
    roundedRect(ctx, amountBoxX, cursor, amountBoxW, boxH, 10);
    ctx.fillStyle = '#f0fdf4';
    ctx.fill();
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#15803d';
    ctx.font = `600 9px ${FONT}`;
    ctx.fillText(amountLabel, W / 2, cursor + 16);
    ctx.fillStyle = '#166534';
    ctx.font = `800 23px ${FONT}`;
    ctx.fillText(amountText, W / 2, cursor + 40);
    cursor += boxH + 18;

    // Meta
    ctx.fillStyle = '#6b7280';
    ctx.font = `400 10px ${FONT}`;
    ctx.textAlign = 'center';
    for (const line of metaLines) {
      ctx.fillText(line, W / 2, cursor + 11);
      cursor += 15;
    }
    cursor += 12;

    // Footer
    ctx.fillStyle = '#9ca3af';
    ctx.font = `400 10px ${FONT}`;
    ctx.fillText(footText, W / 2, cursor + 10);

    // Ekspor PNG → unduh
    const out = document.createElement('canvas');
    out.width = W * S;
    out.height = finalH * S;
    const octx = out.getContext('2d')!;
    octx.drawImage(canvas, 0, 0, W * S, finalH * S, 0, 0, W * S, finalH * S);
    const url = out.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `struk-${payment.id.replace(/-/g, '').slice(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handlePay() {
    if (!payModal || !payForm.amount) {
      setFormError('Nominal wajib diisi');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/bills/payments', {
        billId: payModal.id,
        amount: parseFloat(payForm.amount),
        paidBy: payForm.paidBy,
        method: payForm.method,
        note: payForm.note,
      });
      setPayModal(null);
      fetchData();
      const res = await api.get('/bills/summary', {
        params: { period: periodFilter || undefined },
      });
      setSummary(res.data);
      showToast('success', 'Pembayaran berhasil dicatat.');
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal mencatat',
      );
    } finally {
      setSaving(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // Tanggal + jam (WIB) untuk detail waktu pembayaran
  function formatDateTime(d: string) {
    return new Date(d).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });
  }

  // Format periode YYYY-MM ke Bahasa Indonesia (mis. "Agustus 2026")
  function formatPeriodId(period: string): string {
    if (!period) return '';
    const [year, month] = period.split('-').map(Number);
    if (!year || !month) return period;
    return new Date(year, month - 1, 1).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  }

  // Selisih hari keterlambatan dari tanggal jatuh tempo (positif = terlambat)
  function daysOverdue(dueDate: string): number {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((now.getTime() - due.getTime()) / 86400000);
  }

  // Badge status dengan kontras tinggi (WCAG AA: teks putih di atas warna solid)
  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-600 text-white',
      unpaid: 'bg-amber-500 text-white',
      overdue: 'bg-red-600 text-white',
    };
    const labels: Record<string, string> = {
      paid: 'Lunas',
      unpaid: 'Belum Bayar',
      overdue: 'Tertunggak',
    };
    return (
      <span
        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-500 text-white'}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  // Buka form catat pembayaran tunai (manual, admin)
  const openManualPay = (bill: Bill) => {
    setPayForm({ amount: bill.amount.toString(), paidBy: '', method: 'cash', note: '' });
    setFormError('');
    setPayModal(bill);
  };

  // Hanya tagihan belum lunas yang boleh dipilih untuk bayar massal
  const selectableBills = bills.filter((b) => b.status !== 'paid');
  const selectedBills = bills.filter((b) => selectedIds.has(b.id));
  const selectedTotal = selectedBills.reduce((sum, b) => sum + b.amount, 0);
  const allSelectableSelected =
    selectableBills.length > 0 && selectableBills.every((b) => selectedIds.has(b.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (selectableBills.every((b) => prev.has(b.id))) return new Set();
      return new Set(selectableBills.map((b) => b.id));
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Catat pembayaran tunai untuk banyak tagihan sekaligus (admin)
  async function handleBulkCash() {
    if (selectedBills.length === 0) return;
    setBulkPaying(true);
    let ok = 0;
    let fail = 0;
    for (const bill of selectedBills) {
      try {
        await api.post('/bills/payments', {
          billId: bill.id,
          amount: bill.amount,
          method: 'cash',
          note: 'Pembayaran tunai (massal)',
        });
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    clearSelection();
    fetchData();
    try {
      const res = await api.get('/bills/summary', {
        params: { period: periodFilter || undefined },
      });
      setSummary(res.data);
    } catch {
      // abaikan
    }
    setBulkPaying(false);
    if (fail === 0) {
      showToast('success', `${ok} tagihan berhasil dicatat lunas (tunai).`);
    } else {
      showToast('info', `${ok} berhasil, ${fail} gagal dicatat. Coba ulang yang gagal.`);
    }
  }

  // Aksi tagihan (dipakai di tabel desktop & kartu mobile)
  const renderBillActions = (bill: Bill) => {
    if (bill.status === 'paid') {
      return (
        <Button variant="ghost" size="sm" onClick={() => setDetailModal(bill)}>
          <DocumentMagnifyingGlassIcon className="w-4 h-4 mr-1" /> Detail
        </Button>
      );
    }
    // Warga: satu tombol jelas. Admin: split-button (gateway / tunai).
    return (
      <PayActions
        loading={payingOnline === bill.id}
        admin={admin}
        onPayOnline={() => setConfirmPay(bill)}
        onManual={() => openManualPay(bill)}
      />
    );
  };

  // Info status ringkas: waktu bayar (lunas) atau jatuh tempo / keterlambatan
  const renderStatusMeta = (bill: Bill) => {
    const settled = getSettledPayment(bill);
    if (bill.status === 'paid' && settled?.paidAt) {
      return (
        <span className="text-xs text-gray-400">
          {formatDate(settled.paidAt)}
          {settled.method && METHOD_LABELS[settled.method]
            ? ` · ${METHOD_LABELS[settled.method]}`
            : ''}
        </span>
      );
    }
    if (bill.status !== 'paid' && bill.dueDate) {
      const overdue = daysOverdue(bill.dueDate);
      if (overdue > 0) {
        return (
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            Terlambat {overdue} hari
          </span>
        );
      }
      return <span className="text-xs text-gray-400">Jatuh tempo {formatDate(bill.dueDate)}</span>;
    }
    return null;
  };

  return (
    <div className="p-6">
      {/* Toast notifikasi */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-gray-900 dark:text-gray-100">Iuran & Pembayaran</h1>
        {admin && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormError('');
                setTypeView('list');
                setTypeModal(true);
              }}
            >
              <Cog6ToothIcon className="w-4 h-4 mr-1" /> Jenis Iuran
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setGenerateForm({ billTypeId: '', period: '', dueDate: '' });
                setFormError('');
                setGenerateModal(true);
              }}
            >
              <PlusIcon className="w-4 h-4 mr-1" /> Generate Tagihan
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={generatingMonthly}
              onClick={handleGenerateMonthly}
              title="Buat tagihan untuk semua iuran bulanan aktif di bulan ini"
            >
              <CalendarDaysIcon className="w-4 h-4 mr-1" /> Generate Bulan Ini
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards — sekaligus filter status (klik untuk menyaring) */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <FilterStatCard
            label="Total Tagihan"
            value={formatCurrency(summary.totalAmount)}
            icon={<BanknotesIcon className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50 dark:bg-blue-900/20"
            active={statusFilter === ''}
            activeRing="ring-blue-500"
            onClick={() => {
              setStatusFilter('');
              setPage(1);
            }}
          />
          <FilterStatCard
            label="Terbayar"
            value={formatCurrency(summary.paidAmount)}
            valueClass="text-green-600"
            icon={<CheckCircleIcon className="w-5 h-5 text-green-600" />}
            iconBg="bg-green-50 dark:bg-green-900/20"
            active={statusFilter === 'paid'}
            activeRing="ring-green-500"
            onClick={() => {
              setStatusFilter('paid');
              setPage(1);
            }}
          />
          <FilterStatCard
            label="Belum Bayar"
            value={formatCurrency(summary.unpaidAmount)}
            valueClass="text-amber-600"
            icon={<ClockIcon className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50 dark:bg-amber-900/20"
            active={statusFilter === 'unpaid'}
            activeRing="ring-amber-500"
            onClick={() => {
              setStatusFilter('unpaid');
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Filter periode & jenis iuran */}
      <div className="flex flex-wrap items-end gap-3 mb-4 pb-5 sm:pb-0">
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Periode
          </label>
          <Input
            type="month"
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value);
              setPage(1);
            }}
            className="w-[220px] max-w-full pr-12"
          />
          {periodFilter && (
            <p className="absolute left-0 top-full mt-1 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
              Menampilkan: {formatPeriodId(periodFilter)}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Jenis Iuran
          </label>
          <select
            value={billTypeFilter}
            onChange={(e) => {
              setBillTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 max-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Jenis</option>
            {billTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pencarian nama keluarga (admin) */}
        {admin && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Cari Warga
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                placeholder="Cari nama keluarga..."
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(searchInput.trim());
                    setPage(1);
                  }
                }}
                className="h-11 w-full sm:w-[220px] pl-9 pr-9 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Bersihkan pencarian"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {(periodFilter || billTypeFilter || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-11"
            onClick={() => {
              setPeriodFilter('');
              setBillTypeFilter('');
              setSearch('');
              setSearchInput('');
              setPage(1);
            }}
          >
            Reset filter
          </Button>
        )}
      </div>

      {/* Toolbar pilihan (bayar massal, admin) */}
      {admin && selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 p-3 rounded-lg border border-primary-200 dark:border-primary-800/50 bg-primary-50 dark:bg-primary-900/15">
          <div className="text-sm text-gray-700 dark:text-gray-200">
            <span className="font-semibold">{selectedIds.size} tagihan dipilih</span>
            <span className="text-gray-500 dark:text-gray-400">
              {' '}
              · Total {formatCurrency(selectedTotal)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Batal
            </Button>
            <Button variant="primary" size="sm" loading={bulkPaying} onClick={handleBulkCash}>
              <BanknotesIcon className="w-4 h-4 mr-1" /> Catat Tunai Massal
            </Button>
          </div>
        </div>
      )}

      {/* Daftar tagihan */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : bills.length === 0 ? (
        <Card className="py-16 text-center">
          <BanknotesIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada tagihan</p>
        </Card>
      ) : (
        <>
          {/* Desktop: tabel (disembunyikan di mobile) */}
          <div className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  {admin && (
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Pilih semua tagihan belum lunas"
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        checked={allSelectableSelected}
                        disabled={selectableBills.length === 0}
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-[34%]">Keluarga</TableHead>
                  <TableHead className="w-[12%]">Periode</TableHead>
                  <TableHead className="w-[16%] text-right pr-8">Nominal</TableHead>
                  <TableHead className="w-[20%] pl-6">Status</TableHead>
                  <TableHead className="w-[18%] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    {admin && (
                      <TableCell className="w-10">
                        {bill.status !== 'paid' && (
                          <input
                            type="checkbox"
                            aria-label={`Pilih tagihan ${bill.family?.headOfFamily}`}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                            checked={selectedIds.has(bill.id)}
                            onChange={() => toggleSelect(bill.id)}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {bill.family?.headOfFamily}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {bill.billType?.name}
                      </div>
                    </TableCell>
                    <TableCell>{bill.period}</TableCell>
                    <TableCell className="text-right pr-8 font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(bill.amount)}
                    </TableCell>
                    <TableCell className="pl-6">
                      <div className="flex flex-col items-start gap-1 leading-tight">
                        {statusBadge(bill.status)}
                        {renderStatusMeta(bill)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">{renderBillActions(bill)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: kartu */}
          <div className="md:hidden space-y-3">
            {bills.map((bill) => (
              <Card key={bill.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {admin && bill.status !== 'paid' && (
                      <input
                        type="checkbox"
                        aria-label={`Pilih tagihan ${bill.family?.headOfFamily}`}
                        className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                        checked={selectedIds.has(bill.id)}
                        onChange={() => toggleSelect(bill.id)}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {bill.family?.headOfFamily}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {bill.billType?.name} · {bill.period}
                      </p>
                    </div>
                  </div>
                  {statusBadge(bill.status)}
                </div>
                <div className="flex items-end justify-between gap-3 mt-3">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(bill.amount)}
                    </p>
                    {renderStatusMeta(bill)}
                  </div>
                  {renderBillActions(bill)}
                </div>
              </Card>
            ))}
          </div>

          {meta.total > 0 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              itemLabel="tagihan"
            />
          )}
        </>
      )}

      {/* Kelola Jenis Iuran — satu modal, dua tampilan (daftar / form) */}
      <Modal
        isOpen={typeModal}
        onClose={() => setTypeModal(false)}
        title={
          typeView === 'form'
            ? editingType
              ? 'Edit Jenis Iuran'
              : 'Tambah Jenis Iuran'
            : 'Kelola Jenis Iuran'
        }
        size="lg"
      >
        {typeView === 'list' ? (
          <>
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={openCreateType}>
                  <PlusIcon className="w-4 h-4 mr-1" /> Tambah Jenis Iuran
                </Button>
              </div>

              {billTypes.length === 0 ? (
                <p className="text-center py-8 text-sm text-gray-500">Belum ada jenis iuran</p>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {billTypes.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {t.name}
                          </span>
                          {!t.isActive && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(t.amount)} · {PERIOD_LABELS[t.period] || t.period}
                          {t.description ? ` · ${t.description}` : ''}
                        </p>
                        {t.period === 'monthly' && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {t.autoGenerate
                              ? `Otomatis terbit tgl ${t.generateDay}, jatuh tempo tgl ${t.dueDay}`
                              : `Manual · jatuh tempo tgl ${t.dueDay}`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openEditType(t)}>
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={typeActionId === t.id}
                          onClick={() => handleToggleTypeActive(t)}
                          title={t.isActive ? 'Nonaktifkan' : 'Aktifkan kembali'}
                        >
                          {t.isActive ? (
                            <NoSymbolIcon className="w-4 h-4 text-red-600" />
                          ) : (
                            <ArrowPathIcon className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ModalFooter>
              <Button variant="secondary" size="sm" onClick={() => setTypeModal(false)}>
                Tutup
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setTypeView('list');
                }}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <ChevronLeftIcon className="w-4 h-4" /> Kembali ke daftar
              </button>

              <Input
                label="Nama Iuran"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                placeholder="Iuran Bulanan"
              />
              <Input
                label="Nominal (Rp)"
                type="number"
                value={typeForm.amount}
                onChange={(e) => setTypeForm({ ...typeForm, amount: e.target.value })}
                placeholder="50000"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Periode
                </label>
                <select
                  value={typeForm.period}
                  onChange={(e) => setTypeForm({ ...typeForm, period: e.target.value })}
                  className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                  <option value="once">Sekali Bayar</option>
                </select>
              </div>
              <Input
                label="Deskripsi (opsional)"
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
              />

              {/* Penjadwalan otomatis — hanya untuk iuran bulanan */}
              {typeForm.period === 'monthly' && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeForm.autoGenerate}
                      onChange={(e) => setTypeForm({ ...typeForm, autoGenerate: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Terbitkan tagihan otomatis tiap bulan
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {typeForm.autoGenerate && (
                      <Input
                        label="Tanggal Terbit"
                        type="number"
                        min={1}
                        max={28}
                        value={typeForm.generateDay}
                        onChange={(e) => setTypeForm({ ...typeForm, generateDay: e.target.value })}
                        helperText="Tagihan dibuat tiap tanggal ini (1–28)"
                      />
                    )}
                    <Input
                      label="Tanggal Jatuh Tempo"
                      type="number"
                      min={1}
                      max={28}
                      value={typeForm.dueDay}
                      onChange={(e) => setTypeForm({ ...typeForm, dueDay: e.target.value })}
                      helperText="Batas bayar (1–28)"
                    />
                  </div>
                </div>
              )}

              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>
            <ModalFooter>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFormError('');
                  setTypeView('list');
                }}
              >
                Batal
              </Button>
              <Button variant="primary" size="sm" loading={saving} onClick={handleSaveType}>
                Simpan
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Generate Bills Modal */}
      <Modal
        isOpen={generateModal}
        onClose={() => setGenerateModal(false)}
        title="Generate Tagihan"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Buat tagihan untuk semua keluarga sekaligus.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Jenis Iuran
            </label>
            <select
              value={generateForm.billTypeId}
              onChange={(e) => setGenerateForm({ ...generateForm, billTypeId: e.target.value })}
              className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Pilih jenis iuran</option>
              {billTypes
                .filter((t) => t.isActive)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {formatCurrency(t.amount)}
                  </option>
                ))}
            </select>
          </div>
          <Input
            label="Periode"
            type="month"
            value={generateForm.period}
            onChange={(e) => setGenerateForm({ ...generateForm, period: e.target.value })}
          />
          <Input
            label="Jatuh Tempo"
            type="date"
            value={generateForm.dueDate}
            onChange={(e) => setGenerateForm({ ...generateForm, dueDate: e.target.value })}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setGenerateModal(false)}>
            Batal
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleGenerate}>
            Generate
          </Button>
        </ModalFooter>
      </Modal>

      {/* Pay Modal */}
      <Modal
        isOpen={!!payModal}
        onClose={() => setPayModal(null)}
        title="Catat Pembayaran"
        size="md"
      >
        <div className="space-y-4">
          {/* Ringkasan tagihan */}
          {payModal && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {payModal.billType?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {payModal.family?.headOfFamily} · {payModal.period}
                  </p>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {formatCurrency(payModal.amount)}
                </span>
              </div>
            </div>
          )}

          <Input
            label="Nominal (Rp)"
            type="number"
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
          />
          <Input
            label="Nama Pembayar"
            value={payForm.paidBy}
            onChange={(e) => setPayForm({ ...payForm, paidBy: e.target.value })}
            placeholder="Opsional"
          />

          {/* Metode pembayaran — tombol pilihan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'cash', label: 'Tunai', icon: <BanknotesIcon className="w-5 h-5" /> },
                {
                  value: 'transfer',
                  label: 'Transfer',
                  icon: <CreditCardIcon className="w-5 h-5" />,
                },
              ].map((m) => {
                const active = payForm.method === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPayForm({ ...payForm, method: m.value })}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-2 min-h-[48px] rounded-lg border text-sm font-medium transition-colors ${
                      active
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Catatan (opsional)"
            value={payForm.note}
            onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setPayModal(null)}>
            Batal
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handlePay}>
            Simpan Pembayaran
          </Button>
        </ModalFooter>
      </Modal>

      {/* Detail / Bukti Pembayaran Modal */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => {
          setDetailModal(null);
          setConfirmDeletePayment(false);
        }}
        title="Detail Pembayaran"
        size="md"
        headerExtra={
          admin && detailModal && getSettledPayment(detailModal) ? (
            <button
              type="button"
              onClick={() => setConfirmDeletePayment((v) => !v)}
              title={confirmDeletePayment ? 'Batalkan hapus' : 'Hapus Transaksi'}
              aria-label="Hapus Transaksi"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : undefined
        }
      >
        {detailModal &&
          (() => {
            const settled = getSettledPayment(detailModal);
            const isPaid = detailModal.status === 'paid';
            return (
              <div className="space-y-4">
                {/* Header status */}
                <div
                  className={`flex flex-col items-center text-center py-5 rounded-lg ${
                    isPaid ? 'bg-green-50 dark:bg-green-900/15' : 'bg-amber-50 dark:bg-amber-900/15'
                  }`}
                >
                  {isPaid ? (
                    <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400 mb-2" />
                  ) : (
                    <ClockIcon className="w-10 h-10 text-amber-500 dark:text-amber-400 mb-2" />
                  )}
                  <p
                    className={`text-sm font-semibold ${
                      isPaid
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {isPaid ? 'Pembayaran Lunas' : 'Belum Dibayar'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {formatCurrency(detailModal.amount)}
                  </p>
                </div>

                {/* Rincian */}
                <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <DetailRow label="Keluarga" value={detailModal.family?.headOfFamily || '-'} />
                  <DetailRow label="Jenis Iuran" value={detailModal.billType?.name || '-'} />
                  <DetailRow label="Periode" value={detailModal.period} />
                  {settled?.paidAt && (
                    <DetailRow
                      label="Waktu Bayar"
                      value={`${formatDateTime(settled.paidAt)} WIB`}
                    />
                  )}
                  {settled?.method && (
                    <DetailRow
                      label="Metode"
                      value={METHOD_LABELS[settled.method] || settled.method}
                    />
                  )}
                  {settled && (
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Bukti Pembayaran</span>
                      <span className="flex items-center justify-end gap-2 text-right">
                        {settled.proofUrl ? (
                          <>
                            <button
                              type="button"
                              onClick={() => { if (settled.proofUrl) setProofPreview(settled.proofUrl); }}
                              className="flex items-center gap-1.5 font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            >
                              <img
                                src={settled.proofUrl}
                                alt="Bukti bayar"
                                className="h-8 w-8 rounded object-cover border border-gray-200 dark:border-gray-700"
                                loading="lazy"
                              />
                              <EyeIcon className="w-4 h-4" /> Lihat Bukti
                            </button>
                            {admin && (
                              <button
                                type="button"
                                onClick={() => proofFileInput.current?.click()}
                                className="text-xs text-gray-400 dark:text-gray-500 underline hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                Ganti
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-gray-400 dark:text-gray-500">Belum ada</span>
                            {admin && (
                              <button
                                type="button"
                                onClick={() => proofFileInput.current?.click()}
                                disabled={uploadingProof}
                                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 disabled:opacity-60"
                              >
                                <PaperClipIcon className="w-3.5 h-3.5" />{' '}
                                {uploadingProof ? 'Mengunggah…' : 'Unggah'}
                              </button>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        {/* Konfirmasi hapus (admin) */}
        {admin && confirmDeletePayment && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/15 p-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              Hapus pembayaran ini? Entri kas terkait akan dihapus dan status tagihan dikembalikan
              ke belum bayar.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDeletePayment(false)}>
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deletingPayment}
                onClick={handleDeletePayment}
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        )}
        {detailModal &&
          (() => {
            const settled = getSettledPayment(detailModal);
            const isPaid = detailModal.status === 'paid';
            return (
              <ModalFooter>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDetailModal(null);
                    setConfirmDeletePayment(false);
                  }}
                >
                  Tutup
                </Button>
                {settled && isPaid && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => downloadStrukImage(detailModal, settled)}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> Unduh Struk
                  </Button>
                )}
              </ModalFooter>
            );
          })()}
        <input
          ref={proofFileInput}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="hidden"
          onChange={handleProofFileChange}
        />
      </Modal>

      {/* Preview bukti bayar (lightbox) */}
      <Modal
        isOpen={!!proofPreview}
        onClose={() => setProofPreview(null)}
        title="Bukti Pembayaran"
        size="lg"
      >
        {proofPreview && (
          <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
            <img
              src={proofPreview}
              alt="Bukti pembayaran"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setProofPreview(null)}>
            Tutup
          </Button>
        </ModalFooter>
      </Modal>

      {/* Konfirmasi sebelum lanjut ke pembayaran online (Midtrans) */}
      <Modal
        isOpen={!!confirmPay}
        onClose={() => setConfirmPay(null)}
        title="Konfirmasi Pembayaran"
        size="md"
      >
        {confirmPay && (
          <div className="space-y-5">
            {/* Nominal utama */}
            <div className="text-center py-4 rounded-lg bg-primary-50 dark:bg-primary-900/15">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Total yang harus dibayar
              </p>
              <p className="text-3xl font-bold text-primary-700 dark:text-primary-300">
                {formatCurrency(confirmPay.amount)}
              </p>
            </div>

            {/* Rincian tagihan */}
            <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <DetailRow label="Jenis Iuran" value={confirmPay.billType?.name || '-'} />
              <DetailRow label="Keluarga" value={confirmPay.family?.headOfFamily || '-'} />
              <DetailRow label="Periode" value={confirmPay.period} />
              {confirmPay.dueDate && (
                <DetailRow label="Jatuh Tempo" value={formatDate(confirmPay.dueDate)} />
              )}
            </div>

            {/* Info metode */}
            <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800/40 p-3">
              <CreditCardIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Halaman pembayaran aman akan terbuka di jendela ini. Pilih metode seperti QRIS,
                transfer bank, atau gerai retail. Status tagihan diperbarui otomatis setelah
                pembayaran.
              </p>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setConfirmPay(null)}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={!!confirmPay && payingOnline === confirmPay.id}
            onClick={() => {
              if (!confirmPay) return;
              const bill = confirmPay;
              setConfirmPay(null);
              handlePayOnline(bill);
            }}
          >
            <CreditCardIcon className="w-4 h-4 mr-1" /> Lanjut ke Pembayaran
          </Button>
        </ModalFooter>
      </Modal>

      {/* Pembayaran online — Snap embedded di dalam modal */}
      <Modal
        isOpen={!!snapBill}
        onClose={closeSnapModal}
        title="Selesaikan Pembayaran"
        size="lg"
        panelClassName="overflow-hidden"
        contentClassName="p-0"
      >
        {snapBill && (
          <div className="border-b border-gray-200 bg-gradient-to-br from-primary-50 via-white to-blue-50 px-6 py-5 dark:border-gray-700 dark:from-primary-950/30 dark:via-gray-800 dark:to-blue-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm shadow-primary-600/30">
                  <CreditCardIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                    {snapBill.billType?.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                    {snapBill.family?.headOfFamily} · Periode {snapBill.period}
                  </p>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Total pembayaran
                </p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
                  {formatCurrency(snapBill.amount)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 px-3 py-4 dark:bg-gray-900/50 sm:px-6">
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>Pilih metode pembayaran yang paling nyaman untuk Anda</span>
          </div>
          {/* Container tempat Snap dirender (min. 320x560 sesuai standar Midtrans) */}
          <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
            <div id={SNAP_CONTAINER_ID} className="w-full min-h-[560px]" />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
            Transaksi diproses secara aman oleh Midtrans
          </div>
          <Button variant="secondary" size="sm" onClick={closeSnapModal}>
            Batalkan Pembayaran
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Kartu ringkasan yang berfungsi sebagai filter status
function FilterStatCard({
  label,
  value,
  valueClass = 'text-gray-900 dark:text-gray-100',
  icon,
  iconBg,
  active,
  activeRing,
  onClick,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon: React.ReactNode;
  iconBg: string;
  active: boolean;
  activeRing: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left transition-all ${active ? `ring-2 ${activeRing} ring-offset-1 dark:ring-offset-gray-900` : ''} rounded-lg`}
    >
      <Card className="p-4 flex items-center gap-4 h-full">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
        </div>
      </Card>
    </button>
  );
}

// Baris label-nilai untuk modal detail
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-gray-100 text-right">{value}</span>
    </div>
  );
}

// Tombol aksi bayar: warga = satu tombol; admin = split-button dengan opsi metode
function PayActions({
  loading,
  admin,
  onPayOnline,
  onManual,
}: {
  loading: boolean;
  admin: boolean;
  onPayOnline: () => void;
  onManual: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Warga: satu tombol utama
  if (!admin) {
    return (
      <Button variant="primary" size="sm" loading={loading} onClick={onPayOnline}>
        <CreditCardIcon className="w-4 h-4 mr-1" /> Bayar Sekarang
      </Button>
    );
  }

  // Admin: split-button (aksi utama + opsi)
  return (
    <div ref={ref} className="relative inline-flex">
      <Button
        variant="primary"
        size="sm"
        loading={loading}
        onClick={onPayOnline}
        className="rounded-r-none"
      >
        <CreditCardIcon className="w-4 h-4 mr-1" /> Bayar
      </Button>
      <Button
        variant="primary"
        size="sm"
        aria-label="Opsi cara pembayaran"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-l-none border-l-2 border-primary-800/40 dark:border-black/30 px-2"
      >
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-64 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
        >
          <p className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
            Pilih cara pembayaran
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onPayOnline();
            }}
            className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <CreditCardIcon className="w-4 h-4 mt-0.5 text-primary-600 flex-shrink-0" />
            <span>
              <span className="block text-sm text-gray-700 dark:text-gray-200">Bayar Online</span>
              <span className="block text-xs text-gray-400">QRIS, transfer, e-wallet</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onManual();
            }}
            className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <BanknotesIcon className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <span>
              <span className="block text-sm text-gray-700 dark:text-gray-200">Catat Tunai</span>
              <span className="block text-xs text-gray-400">Pembayaran diterima langsung</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// Notifikasi toast (pojok kanan atas)
function Toast({
  toast,
  onClose,
}: {
  toast: { type: 'success' | 'error' | 'info'; message: string };
  onClose: () => void;
}) {
  const config = {
    success: {
      icon: <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />,
      ring: 'border-green-200 dark:border-green-800/50',
    },
    error: {
      icon: <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />,
      ring: 'border-red-200 dark:border-red-800/50',
    },
    info: {
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      ring: 'border-amber-200 dark:border-amber-800/50',
    },
  }[toast.type];

  return (
    <div className="fixed top-4 right-4 z-[60]">
      <div
        role="status"
        aria-live="polite"
        className={`flex items-start gap-3 max-w-sm px-4 py-3 rounded-lg shadow-lg border bg-white dark:bg-gray-800 ${config.ring}`}
      >
        <span className="flex-shrink-0 mt-0.5">{config.icon}</span>
        <p className="text-sm text-gray-800 dark:text-gray-100 flex-1">{toast.message}</p>
        <button
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
