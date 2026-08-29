import { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon,
  PrinterIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { api } from '@/services/api';
import { useSettings } from '@/hooks/useSettings';

interface LetterTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  isActive: boolean;
}

interface Letter {
  id: string;
  letterNumber: string;
  recipientName: string;
  purpose: string | null;
  status: string;
  createdAt: string;
  template: { id: string; name: string; type: string };
}

interface Resident {
  id: string;
  fullName: string;
  idNumber: string;
  gender: string;
  family?: { headOfFamily: string; address: string; rt: string; rw: string };
}

// Variable chips yang bisa digunakan di template
const VARIABLE_CHIPS = [
  { key: 'nama', label: 'Nama Warga' },
  { key: 'nik', label: 'NIK' },
  { key: 'alamat', label: 'Alamat' },
  { key: 'rt', label: 'RT' },
  { key: 'rw', label: 'RW' },
  { key: 'keperluan', label: 'Keperluan' },
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'nomor_surat', label: 'No. Surat' },
  { key: 'jenis_kelamin', label: 'Jenis Kelamin' },
];

export function LettersPage() {
  const { settings } = useSettings();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');

  // View modes
  const [view, setView] = useState<'list' | 'create' | 'template'>('list');

  // Create letter form
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [residentSearch, setResidentSearch] = useState('');
  const [showResidentDropdown, setShowResidentDropdown] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [extraVars, setExtraVars] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Template form
  const [templateForm, setTemplateForm] = useState({ name: '', type: 'pengantar', content: '', description: '' });

  useEffect(() => { fetchData(); }, [page, pageSize, statusFilter]);

  // Ubah jumlah per halaman & kembali ke halaman 1
  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }
  useEffect(() => {
    api.get('/letters/templates').then((res) => setTemplates(res.data)).catch(() => {});
    api.get('/residents', { params: { limit: 200 } }).then((res) => setResidents(res.data.data || [])).catch(() => {});
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/letters', { params });
      setLetters(data.data);
      setMeta(data.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  // Filter residents by search
  const filteredResidents = useMemo(() => {
    if (!residentSearch) return residents.slice(0, 10);
    const q = residentSearch.toLowerCase();
    return residents.filter((r) => r.fullName.toLowerCase().includes(q) || r.idNumber.includes(q)).slice(0, 10);
  }, [residents, residentSearch]);

  // Build variables from selected resident
  const variables = useMemo<Record<string, string>>(() => {
    const vars: Record<string, string> = { ...extraVars };
    if (selectedResident) {
      vars.nama = selectedResident.fullName;
      vars.nik = selectedResident.idNumber;
      vars.jenis_kelamin = selectedResident.gender;
      vars.alamat = selectedResident.family?.address || '';
      vars.rt = selectedResident.family?.rt || '';
      vars.rw = selectedResident.family?.rw || '';
    }
    vars.keperluan = purpose || '';
    vars.tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const rtNum = settings.rt_name.replace(/\D/g, '').padStart(2, '0');
    const rwNum = settings.rw_name.replace(/\D/g, '').padStart(3, '0');
    vars.nomor_surat = '___/RT' + rtNum + '/RW' + rwNum + '/' + String(new Date().getMonth() + 1).padStart(2, '0') + '/' + new Date().getFullYear();
    return vars;
  }, [selectedResident, purpose, extraVars, settings]);

  // Render preview
  const previewHtml = useMemo(() => {
    if (!selectedTemplate) return '';
    let html = selectedTemplate.content;
    for (const [key, value] of Object.entries(variables)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `<span class="text-red-400">[${key}]</span>`);
    }
    return html;
  }, [selectedTemplate, variables]);

  // Detect unfilled variables in template
  const templateVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    const matches = selectedTemplate.content.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
  }, [selectedTemplate]);

  async function handleCreateLetter() {
    if (!selectedTemplate || !selectedResident) { setFormError('Pilih template dan warga'); return; }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/letters', {
        templateId: selectedTemplate.id,
        residentId: selectedResident.id,
        recipientName: selectedResident.fullName,
        purpose,
        variables,
      });
      setView('list');
      fetchData();
      resetForm();
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal membuat surat');
    } finally { setSaving(false); }
  }

  async function handleCreateTemplate() {
    if (!templateForm.name || !templateForm.content) { setFormError('Nama dan isi template wajib'); return; }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/letters/templates', templateForm);
      const res = await api.get('/letters/templates');
      setTemplates(res.data);
      setView('list');
      setTemplateForm({ name: '', type: 'pengantar', content: '', description: '' });
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  }

  function resetForm() {
    setSelectedTemplate(null);
    setSelectedResident(null);
    setResidentSearch('');
    setPurpose('');
    setExtraVars({});
    setFormError('');
  }

  async function handleSign(id: string) {
    await api.put(`/letters/${id}/status`, { status: 'signed' });
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus surat ini?')) return;
    await api.delete(`/letters/${id}`);
    fetchData();
  }

  function handlePrint(id: string) {
    window.open(`/api/v1/letters/${id}/html`, '_blank');
  }

  function insertVariable(key: string) {
    setTemplateForm((prev) => ({ ...prev, content: prev.content + `{{${key}}}` }));
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = { draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', signed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400', archived: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' };
    const labels: Record<string, string> = { draft: 'Draft', signed: 'Ditandatangani', archived: 'Arsip' };
    return <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || ''}`}>{labels[status] || status}</span>;
  };

  // === VIEW: CREATE LETTER (Split Screen) ===
  if (view === 'create') {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-gray-100">Buat Surat Baru</h1>
          <Button variant="secondary" size="sm" onClick={() => { setView('list'); resetForm(); }}>← Kembali</Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT: Form Input */}
          <div className="space-y-5">
            {/* Template selection */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100 mb-3">Jenis Template</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templates.filter((t) => t.isActive).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`p-3 rounded-lg border text-left transition-all text-sm ${
                      selectedTemplate?.id === t.id
                        ? 'border-[#0054A6] bg-[#E8F0FF] dark:bg-[#0054A6]/15 text-[#0054A6]'
                        : 'border-[#E2E8F0] dark:border-gray-700 hover:border-[#0054A6]/50'
                    }`}
                  >
                    <DocumentTextIcon className="w-5 h-5 mb-1" />
                    <span className="font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Warga selection */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100 mb-3">Pilih Warga</h3>
              <div className="relative">
                <Input
                  placeholder="Ketik nama atau NIK warga..."
                  value={selectedResident ? selectedResident.fullName : residentSearch}
                  onChange={(e) => { setResidentSearch(e.target.value); setSelectedResident(null); setShowResidentDropdown(true); }}
                  onFocus={() => setShowResidentDropdown(true)}
                />
                {showResidentDropdown && !selectedResident && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-[#E2E8F0] dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredResidents.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">Tidak ditemukan</p>
                    ) : (
                      filteredResidents.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => { setSelectedResident(r); setResidentSearch(''); setShowResidentDropdown(false); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#F8FAFC] dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <p className="text-sm font-medium text-[#0F172A] dark:text-gray-200">{r.fullName}</p>
                          <p className="text-xs text-[#64748B]">NIK: {r.idNumber} • {r.family?.address || '-'}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedResident && (
                <div className="mt-3 p-3 bg-[#F8FAFC] dark:bg-gray-800/50 rounded-lg text-sm space-y-1">
                  <p><span className="text-[#64748B]">NIK:</span> <span className="font-medium">{selectedResident.idNumber}</span></p>
                  <p><span className="text-[#64748B]">Alamat:</span> <span className="font-medium">{selectedResident.family?.address || '-'}</span></p>
                  <p><span className="text-[#64748B]">RT/RW:</span> <span className="font-medium">{selectedResident.family?.rt}/{selectedResident.family?.rw}</span></p>
                </div>
              )}
            </Card>

            {/* Dynamic fields */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100 mb-3">Detail Surat</h3>
              <div className="space-y-3">
                <Input label="Keperluan" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Melamar pekerjaan, urusan administrasi, dll" />
                {/* Extra vars from template that aren't auto-filled */}
                {templateVariables.filter((v) => !['nama', 'nik', 'alamat', 'rt', 'rw', 'keperluan', 'tanggal', 'nomor_surat', 'jenis_kelamin'].includes(v)).map((v) => (
                  <Input key={v} label={v.replace(/_/g, ' ')} value={extraVars[v] || ''} onChange={(e) => setExtraVars({ ...extraVars, [v]: e.target.value })} placeholder={`Isi ${v}`} />
                ))}
              </div>
            </Card>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex gap-3">
              <Button variant="primary" size="md" loading={saving} onClick={handleCreateLetter} disabled={!selectedTemplate || !selectedResident}>
                Buat Surat
              </Button>
              <Button variant="secondary" size="md" onClick={() => { setView('list'); resetForm(); }}>Batal</Button>
            </div>
          </div>

          {/* RIGHT: Live Preview */}
          <div>
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#64748B]">Preview Dokumen</h3>
                {selectedTemplate && (
                  <button onClick={() => window.print()} className="text-xs text-[#0054A6] hover:underline flex items-center gap-1">
                    <PrinterIcon className="w-3.5 h-3.5" /> Cetak
                  </button>
                )}
              </div>
              <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-6 min-h-[600px] flex items-start justify-center">
                {selectedTemplate ? (
                  <div className="bg-white shadow-md w-full max-w-[595px] min-h-[842px] p-10 text-[11px] leading-relaxed font-serif">
                    {/* Kop Surat */}
                    <div className="text-center border-b-[3px] border-double border-black pb-3 mb-5">
                      <p className="text-[13px] font-bold">RUKUN TETANGGA {settings.rt_name.replace(/\D/g, '').padStart(2, '0')} / RUKUN WARGA {settings.rw_name.replace(/\D/g, '').padStart(3, '0')}</p>
                      <p className="text-[10px]">Kelurahan {settings.kelurahan}, Kec. {settings.kecamatan}, Kab. {settings.kabupaten}</p>
                      {settings.housing_complex && <p className="text-[10px]">Perumahan {settings.housing_complex}</p>}
                    </div>
                    {/* Judul surat */}
                    <div className="text-center mb-5">
                      <p className="font-bold text-[12px] underline">{selectedTemplate.name.toUpperCase()}</p>
                      <p className="text-[10px]">Nomor: {variables.nomor_surat}</p>
                    </div>
                    {/* Body */}
                    <div className="whitespace-pre-wrap text-justify" dangerouslySetInnerHTML={{ __html: previewHtml.replace(/\n/g, '<br/>') }} />
                    {/* Tanda tangan */}
                    <div className="mt-12 flex justify-end">
                      <div className="text-center w-48">
                        <p>{settings.kabupaten}, {variables.tanggal}</p>
                        <p>{settings.ketua_rt || `Ketua RT ${settings.rt_name}`}</p>
                        <div className="h-16" />
                        <p className="border-t border-black pt-1">____________________</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center text-[#94A3B8]">
                    <DocumentTextIcon className="w-12 h-12 mb-3" />
                    <p className="text-sm">Pilih template untuk melihat preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === VIEW: CREATE TEMPLATE (Split with Live Preview) ===
  if (view === 'template') {
    // Live preview of template content with variable highlights
    const templatePreviewHtml = templateForm.content
      ? templateForm.content.replace(
          /\{\{(\w+)\}\}/g,
          '<span class="bg-yellow-100 text-yellow-800 px-1 rounded text-[10px] font-mono">{{$1}}</span>',
        )
      : '';

    return (
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0054A6] transition-colors min-h-[40px]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Kembali
          </button>
          <div className="w-px h-5 bg-[#E2E8F0]" />
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-gray-100">Buat Template Surat</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* LEFT: Form & Editor (60%) */}
          <div className="xl:col-span-3 space-y-5">
            {/* Section 1: Informasi Template */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100 mb-3">Informasi Template</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nama Template" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="Surat Pengantar" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Surat</label>
                  <select value={templateForm.type} onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })} className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    <option value="pengantar">Surat Pengantar</option>
                    <option value="domisili">Surat Domisili</option>
                    <option value="keterangan">Surat Keterangan</option>
                    <option value="custom">Lainnya</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Section 2: Variabel Dinamis */}
            <Card className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100">Variabel Dinamis</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Klik badge untuk menyisipkan otomatis ke editor</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {VARIABLE_CHIPS.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => insertVariable(chip.key)}
                    className="group inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/15 text-[#0054A6] dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 cursor-pointer transition-all active:scale-95"
                  >
                    <svg className="w-3 h-3 text-[#0054A6]/60 group-hover:text-[#0054A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    {chip.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Section 3: Editor */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100 mb-3">Isi Template</h3>
              <textarea
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                rows={16}
                className="w-full px-4 py-3 border border-[#E2E8F0] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#0F172A] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0054A6]/20 focus:border-[#0054A6] text-sm leading-[1.8]"
                placeholder={"Yang bertanda tangan di bawah ini menerangkan bahwa:\n\nNama: {{nama}}\nNIK: {{nik}}\nAlamat: {{alamat}}\n\nAdalah benar warga RT {{rt}} / RW {{rw}}...\n\nSurat ini dibuat untuk keperluan: {{keperluan}}\n\nDemikian surat ini dibuat dengan sebenarnya."}
              />
              <Input label="Deskripsi (opsional)" value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} className="mt-3" />
            </Card>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex gap-3">
              <Button variant="primary" size="md" loading={saving} onClick={handleCreateTemplate}>Simpan Template</Button>
              <Button variant="secondary" size="md" onClick={() => setView('list')}>Batal</Button>
            </div>
          </div>

          {/* RIGHT: Live Preview (40%) */}
          <div className="xl:col-span-2">
            <div className="sticky top-6">
              <h3 className="text-sm font-semibold text-[#64748B] mb-3">Live Preview</h3>
              <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-5 min-h-[600px] flex items-start justify-center">
                {templateForm.content ? (
                  <div className="bg-white shadow-lg w-full min-h-[700px] p-8 text-[10px] leading-[1.7] font-serif rounded">
                    {/* Kop Surat */}
                    <div className="text-center border-b-[3px] border-double border-black pb-2 mb-4">
                      <p className="text-[12px] font-bold">RUKUN TETANGGA {settings.rt_name.replace(/\D/g, '').padStart(2, '0')} / RUKUN WARGA {settings.rw_name.replace(/\D/g, '').padStart(3, '0')}</p>
                      <p className="text-[9px]">Kelurahan {settings.kelurahan}, Kec. {settings.kecamatan}, Kab. {settings.kabupaten}</p>
                      {settings.housing_complex && <p className="text-[9px]">Perumahan {settings.housing_complex}</p>}
                    </div>
                    {/* Title */}
                    <div className="text-center mb-4">
                      <p className="font-bold text-[11px] underline">{templateForm.name ? templateForm.name.toUpperCase() : 'JUDUL SURAT'}</p>
                      <p className="text-[9px]">Nomor: ___/RT{settings.rt_name.replace(/\D/g, '').padStart(2, '0')}/RW{settings.rw_name.replace(/\D/g, '').padStart(3, '0')}/MM/YYYY</p>
                    </div>
                    {/* Body with highlighted variables */}
                    <div className="whitespace-pre-wrap text-justify" dangerouslySetInnerHTML={{ __html: templatePreviewHtml.replace(/\n/g, '<br/>') }} />
                    {/* Signature */}
                    <div className="mt-10 flex justify-end">
                      <div className="text-center w-40">
                        <p className="text-[9px]">{settings.kabupaten}, {'{{tanggal}}'}</p>
                        <p className="text-[9px]">{settings.ketua_rt || `Ketua RT ${settings.rt_name}`}</p>
                        <div className="h-12" />
                        <p className="border-t border-black pt-0.5 text-[9px]">____________________</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center text-[#94A3B8]">
                    <DocumentTextIcon className="w-10 h-10 mb-2" />
                    <p className="text-xs">Tulis isi template untuk melihat preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === VIEW: LIST (Default) ===
  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-gray-100">Surat-Menyurat</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setView('template'); setFormError(''); }}>
            <PlusIcon className="w-4 h-4 mr-1" /> Template
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setView('create'); resetForm(); }}>
            <PlusIcon className="w-4 h-4 mr-1" /> Buat Surat
          </Button>
        </div>
      </div>

      {/* Templates summary */}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {templates.filter((t) => t.isActive).map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F8FAFC] dark:bg-gray-800 text-[#64748B] text-xs rounded-lg border border-[#E2E8F0] dark:border-gray-700">
              <DocumentTextIcon className="w-3.5 h-3.5" /> {t.name}
            </span>
          ))}
        </div>
      )}

      {/* Filter status */}
      <FilterBar>
        <FilterSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="signed">Ditandatangani</option>
          <option value="archived">Arsip</option>
        </FilterSelect>
      </FilterBar>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : letters.length === 0 ? (
        <Card className="p-12 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-[#64748B]">Belum ada surat yang dibuat</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={() => { setView('create'); resetForm(); }}>
            Buat Surat Pertama
          </Button>
        </Card>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Surat</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {letters.map((letter) => (
                <TableRow key={letter.id}>
                  <TableCell className="font-mono text-xs">{letter.letterNumber}</TableCell>
                  <TableCell>{letter.template?.name}</TableCell>
                  <TableCell className="font-medium">{letter.recipientName}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{new Date(letter.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                  <TableCell>{statusBadge(letter.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {letter.status === 'draft' && (
                        <button onClick={() => handleSign(letter.id)} className="text-green-600 hover:text-green-800 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Tandatangani">
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handlePrint(letter.id)} className="text-[#0054A6] hover:text-[#003A77] min-h-[44px] min-w-[44px] flex items-center justify-center" title="Cetak">
                        <PrinterIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(letter.id)} className="text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Hapus">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
              itemLabel="surat"
            />
          )}
        </>
      )}
    </div>
  );
}
