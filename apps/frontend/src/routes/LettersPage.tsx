import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeftIcon,
  ArrowsPointingOutIcon,
  PlusIcon,
  PrinterIcon,
  DocumentTextIcon,
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
import { Card } from '@/components/ui/Card';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { TableActionButton } from '@/components/ui/TableActionButton';
import { api } from '@/services/api';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useDismissibleLayer } from '@/hooks/useDismissibleLayer';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import type { SystemSettings } from '@/hooks/useSettings';

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

function getLocalDateValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function LetterDocumentPreview({
  settings,
  template,
  variables,
  previewHtml,
}: {
  settings: SystemSettings;
  template: LetterTemplate;
  variables: Record<string, string>;
  previewHtml: string;
}) {
  return (
    <div className="letter-print-preview min-h-[842px] w-full max-w-[595px] border border-ink/20 bg-white p-10 font-serif text-[11px] leading-relaxed text-black shadow-[var(--shadow-small)]">
      <div className="mb-5 grid grid-cols-[56px_1fr_56px] items-center border-b-[3px] border-double border-black pb-3 text-center">
        <div className="flex justify-center">
          {settings.gov_logo_url && (
            <img
              src={settings.gov_logo_url}
              alt="Logo pemerintah atau lingkungan"
              className="max-h-14 max-w-14 object-contain"
            />
          )}
        </div>
        <div>
          <p className="text-[13px] font-bold">
            RUKUN TETANGGA {settings.rt_name.replace(/\D/g, '').padStart(2, '0')} / RUKUN WARGA{' '}
            {settings.rw_name.replace(/\D/g, '').padStart(3, '0')}
          </p>
          <p className="text-[10px]">
            Kelurahan {settings.kelurahan}, Kec. {settings.kecamatan}, Kab. {settings.kabupaten}
          </p>
          {settings.housing_complex && (
            <p className="text-[10px]">Perumahan {settings.housing_complex}</p>
          )}
        </div>
        <div aria-hidden="true" />
      </div>
      <div className="mb-5 text-center">
        <p className="text-[12px] font-bold underline">{template.name.toUpperCase()}</p>
        <p className="text-[10px]">Nomor: {variables.nomor_surat}</p>
      </div>
      <div
        className="whitespace-pre-wrap text-justify"
        dangerouslySetInnerHTML={{ __html: previewHtml.replace(/\n/g, '<br/>') }}
      />
      <div className="mt-12 flex justify-end">
        <div className="w-48 text-center">
          <p>
            {settings.kabupaten}, {variables.tanggal}
          </p>
          <p>{settings.ketua_rt || `Ketua RT ${settings.rt_name}`}</p>
          <div className="h-16" />
          <p className="border-t border-black pt-1">____________________</p>
        </div>
      </div>
    </div>
  );
}

export function LettersPage() {
  const { showToast } = useToast();
  const { settings } = useSettings();
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [lettersLoadError, setLettersLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');

  // View modes
  const [view, setView] = useState<'list' | 'create' | 'template'>('list');

  // Create letter form
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [residentSearch, setResidentSearch] = useState('');
  const [showResidentDropdown, setShowResidentDropdown] = useState(false);
  const { rootRef: residentDropdownRef } = useDismissibleLayer(
    showResidentDropdown && !selectedResident,
    () => setShowResidentDropdown(false),
  );
  const [purpose, setPurpose] = useState('');
  const [letterDate, setLetterDate] = useState(getLocalDateValue);
  const [extraVars, setExtraVars] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'pengantar',
    content: '',
    description: '',
  });
  const templateEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, statusFilter]);

  // Ubah jumlah per halaman & kembali ke halaman 1
  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }
  useEffect(() => {
    void Promise.all([
      api.get('/letters/templates'),
      api.get('/residents', { params: { limit: 200 } }),
    ])
      .then(([templateResponse, residentResponse]) => {
        setTemplates(templateResponse.data);
        setResidents(residentResponse.data.data || []);
      })
      .catch(() => showToast('Template atau data warga gagal dimuat. Silakan coba lagi.', 'error'));
  }, [showToast]);

  async function fetchData() {
    setLoading(true);
    setLettersLoadError(false);
    try {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/letters', { params });
      setLetters(data.data);
      setMeta(data.meta);
    } catch {
      setLetters([]);
      setLettersLoadError(true);
      showToast('Daftar surat gagal dimuat. Periksa koneksi lalu coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Filter residents by search
  const filteredResidents = useMemo(() => {
    if (!residentSearch) return residents.slice(0, 10);
    const q = residentSearch.toLowerCase();
    return residents
      .filter((r) => r.fullName.toLowerCase().includes(q) || r.idNumber.includes(q))
      .slice(0, 10);
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
    vars.tanggal = new Date(`${letterDate}T00:00:00`).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const rtNum = settings.rt_name.replace(/\D/g, '').padStart(2, '0');
    const rwNum = settings.rw_name.replace(/\D/g, '').padStart(3, '0');
    const seq = '1'.padStart(Number(settings.letter_number_padding || 3), '0');
    vars.nomor_surat = (settings.letter_number_format || '{seq}/RT{rt}/RW{rw}/{month}/{year}')
      .replace(/\{seq\}/g, seq)
      .replace(/\{rt\}/g, rtNum)
      .replace(/\{rw\}/g, rwNum)
      .replace(
        /\{month\}/g,
        String(new Date(`${letterDate}T00:00:00`).getMonth() + 1).padStart(2, '0'),
      )
      .replace(/\{year\}/g, String(new Date(`${letterDate}T00:00:00`).getFullYear()));
    return vars;
  }, [selectedResident, purpose, extraVars, settings, letterDate]);

  // Render preview
  const previewHtml = useMemo(() => {
    if (!selectedTemplate) return '';
    let html = selectedTemplate.content;
    for (const [key, value] of Object.entries(variables)) {
      html = html.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        value || `<span class="text-red-400">[${key}]</span>`,
      );
    }
    return html.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      const label =
        key === 'rt' || key === 'rw' ? 'Pilih warga untuk RT/RW' : key.replace(/_/g, ' ');
      return `<span class="rounded bg-amber-100 px-1 text-amber-700">[${label}]</span>`;
    });
  }, [selectedTemplate, variables]);

  // Detect unfilled variables in template
  const templateVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    const matches = selectedTemplate.content.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
  }, [selectedTemplate]);

  const visibleTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    return templates
      .filter((template) => template.isActive)
      .filter((template) => !templateCategory || template.type === templateCategory)
      .filter(
        (template) =>
          !query ||
          template.name.toLowerCase().includes(query) ||
          template.type.toLowerCase().includes(query),
      );
  }, [templates, templateSearch, templateCategory]);

  async function handleCreateLetter() {
    if (!selectedTemplate || !selectedResident) {
      setFormError('Pilih template dan warga');
      return;
    }
    if (!letterDate) {
      setFormError('Tentukan tanggal surat');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/letters', {
        templateId: selectedTemplate.id,
        residentId: selectedResident.id,
        recipientName: selectedResident.fullName,
        purpose,
        letterDate,
        variables,
      });
      setView('list');
      fetchData();
      resetForm();
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal membuat surat',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTemplate() {
    if (!templateForm.name || !templateForm.content) {
      setFormError('Nama dan isi template wajib');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/letters/templates', templateForm);
      const res = await api.get('/letters/templates');
      setTemplates(res.data);
      setView('list');
      setTemplateForm({ name: '', type: 'pengantar', content: '', description: '' });
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan',
      );
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setSelectedTemplate(null);
    setTemplateSearch('');
    setTemplateCategory('');
    setShowAllTemplates(false);
    setSelectedResident(null);
    setResidentSearch('');
    setPurpose('');
    setLetterDate(getLocalDateValue());
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
    const token = `{{${key}}}`;
    const editor = templateEditorRef.current;
    const currentContent = templateForm.content;
    const start = editor?.selectionStart ?? currentContent.length;
    const end = editor?.selectionEnd ?? start;
    const nextContent = currentContent.slice(0, start) + token + currentContent.slice(end);

    setTemplateForm((prev) => ({ ...prev, content: nextContent }));
    requestAnimationFrame(() => {
      if (!templateEditorRef.current) return;
      const nextCursor = start + token.length;
      templateEditorRef.current.focus();
      templateEditorRef.current.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handlePrintPreview() {
    const documentElement = document.querySelector('#letter-print-document .letter-print-preview');
    if (!documentElement) {
      showToast('Pilih jenis surat sebelum mencetak.', 'error');
      return;
    }

    const inheritedStyles = Array.from(
      document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
        'link[rel="stylesheet"], style',
      ),
    )
      .map((node) => node.outerHTML)
      .join('\n');
    const title = selectedTemplate?.name || 'Surat Warga';
    const safeTitle = title.replace(/[<>&"']/g, '');
    const documentMarkup = documentElement.outerHTML.replace(
      /src="\/(uploads\/[^"]+)"/g,
      `src="${window.location.origin}/$1"`,
    );
    const printableHtml = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle} — Pratinjau Cetak</title>
    ${inheritedStyles}
    <style>
      @page { size: A4 portrait; margin: 0; }
      body { margin: 0; background: white; color: #171717; }
      .print-stage { display: flex; justify-content: center; }
      .letter-print-preview { width: 210mm; max-width: 210mm; min-height: 0; height: auto; padding: 15mm;
        border: 0; box-shadow: 4px 4px 0 #171717; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid; font-size: 12pt; line-height: 1.6; }
      .letter-print-preview > .whitespace-pre-wrap { font-size: 12pt; line-height: 1.6; }
      .letter-print-preview .grid p { font-size: 11pt; }
      @media print {
        body { background: white; }
        .print-stage { display: block; padding: 0; }
        .letter-print-preview { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <main class="print-stage">${documentMarkup}</main>
  </body>
</html>`;

    let printStarted = false;
    window.addEventListener('beforeprint', () => (printStarted = true), { once: true });
    const printRoot = document.createElement('div');
    printRoot.id = 'letter-print-root';
    printRoot.appendChild(documentElement.cloneNode(true));
    document.body.appendChild(printRoot);
    document.body.classList.add('letter-print-mode');
    window.print();

    window.setTimeout(() => {
      document.body.classList.remove('letter-print-mode');
      printRoot.remove();
      if (printStarted) return;

      const url = URL.createObjectURL(new Blob([printableHtml], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'surat'}.html`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Dialog cetak tidak didukung. Dokumen siap-cetak telah diunduh.', 'info');
    }, 500);
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
      signed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      archived: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    };
    const labels: Record<string, string> = {
      draft: 'Draft',
      signed: 'Ditandatangani',
      archived: 'Arsip',
    };
    return (
      <span
        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || ''}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  // === VIEW: CREATE LETTER (Split Screen) ===
  if (view === 'create') {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-6 flex items-center gap-4 border-b-2 border-ink pb-5 dark:border-gray-300">
          <Button
            variant="secondary"
            size="sm"
            aria-label="Kembali ke daftar surat"
            onClick={() => {
              setView('list');
              resetForm();
            }}
          >
            <ArrowLeftIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Kembali
          </Button>
          <div className="border-l-2 border-ink pl-4 dark:border-gray-300">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
              Surat warga
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink dark:text-gray-100">
              Buat surat baru
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT: Form Input */}
          <div className="space-y-5">
            {/* Template selection */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100 mb-3">
                Jenis Template
              </h3>
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px]">
                <Input
                  aria-label="Cari template surat"
                  placeholder="Cari template..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                />
                <select
                  aria-label="Filter kategori template"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="min-h-[var(--control-height)] rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-card)] px-[var(--control-padding-x)] text-base text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 dark:border-gray-300 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Semua kategori</option>
                  {[...new Set(templates.filter((t) => t.isActive).map((t) => t.type))].map(
                    (type) => (
                      <option key={type} value={type}>
                        {type === 'pengantar'
                          ? 'Pengantar'
                          : type === 'domisili'
                            ? 'Domisili'
                            : type === 'keterangan'
                              ? 'Keterangan'
                              : type === 'custom'
                                ? 'Lainnya'
                                : type}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {visibleTemplates
                  .slice(0, showAllTemplates || templateSearch || templateCategory ? undefined : 6)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={selectedTemplate?.id === t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`min-h-[92px] rounded-[var(--radius-control)] border-2 border-ink p-3 text-left text-sm transition-[transform,box-shadow,background-color] dark:border-gray-300 ${
                        selectedTemplate?.id === t.id
                          ? 'translate-x-[2px] translate-y-[2px] bg-[var(--accent)] text-white shadow-none'
                          : 'bg-[var(--surface-card)] text-ink shadow-[var(--shadow-small)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[var(--surface-hover)] hover:shadow-none dark:text-gray-100'
                      }`}
                    >
                      <DocumentTextIcon className="mb-2 h-5 w-5" aria-hidden="true" />
                      <span className="font-display font-bold leading-snug">{t.name}</span>
                    </button>
                  ))}
                {visibleTemplates.length === 0 && (
                  <p className="col-span-full border-2 border-dashed border-ink/40 p-4 text-center text-sm text-ink-secondary dark:border-gray-500 dark:text-gray-300">
                    Template tidak ditemukan. Coba kata kunci atau kategori lain.
                  </p>
                )}
              </div>
              {visibleTemplates.length > 6 && !templateSearch && !templateCategory && (
                <button
                  type="button"
                  onClick={() => setShowAllTemplates((current) => !current)}
                  className="mt-3 min-h-[40px] border-b-2 border-ink font-display text-sm font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-ink/20"
                >
                  {showAllTemplates
                    ? 'Tampilkan lebih sedikit'
                    : `Tampilkan semua (${visibleTemplates.length})`}
                </button>
              )}
              {selectedTemplate && templateVariables.length > 0 && (
                <p className="mt-3 border-t border-ink/20 pt-3 text-xs text-ink-secondary dark:border-gray-600 dark:text-gray-300">
                  Data yang digunakan:{' '}
                  <span className="font-bold text-ink dark:text-gray-100">
                    {templateVariables
                      .map((v) =>
                        v === 'rt' || v === 'rw'
                          ? 'RT/RW warga'
                          : v === 'tanggal'
                            ? 'tanggal surat'
                            : v.replace(/_/g, ' '),
                      )
                      .filter((v, index, list) => list.indexOf(v) === index)
                      .join(', ')}
                  </span>
                </p>
              )}
            </Card>

            {/* Warga selection */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100 mb-3">
                Pilih Warga
              </h3>
              <div ref={residentDropdownRef} className="relative">
                <Input
                  placeholder="Ketik nama atau NIK warga..."
                  value={selectedResident ? selectedResident.fullName : residentSearch}
                  onChange={(e) => {
                    setResidentSearch(e.target.value);
                    setSelectedResident(null);
                    setShowResidentDropdown(true);
                  }}
                  onFocus={() => setShowResidentDropdown(true)}
                />
                {showResidentDropdown && !selectedResident && (
                  <div
                    role="listbox"
                    aria-label="Pilih warga"
                    className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-[#E2E8F0] dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {filteredResidents.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">Tidak ditemukan</p>
                    ) : (
                      filteredResidents.map((r) => (
                        <button
                          key={r.id}
                          role="option"
                          onClick={() => {
                            setSelectedResident(r);
                            setResidentSearch('');
                            setShowResidentDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#F8FAFC] dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <p className="text-sm font-medium text-[#0F172A] dark:text-gray-200">
                            {r.fullName}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            NIK: {r.idNumber} • {r.family?.address || '-'}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedResident && (
                <div className="mt-3 rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-selected)] p-3 text-sm shadow-[var(--shadow-small)] dark:border-gray-300 dark:bg-gray-800/50">
                  <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                    Data otomatis dari warga
                  </p>
                  <div className="space-y-1">
                    <p>
                      <span className="text-[#64748B]">NIK:</span>{' '}
                      <span className="font-medium">{selectedResident.idNumber}</span>
                    </p>
                    <p>
                      <span className="text-[#64748B]">Alamat:</span>{' '}
                      <span className="font-medium">{selectedResident.family?.address || '-'}</span>
                    </p>
                    <p>
                      <span className="text-[#64748B]">RT/RW:</span>{' '}
                      <span className="font-medium">
                        {selectedResident.family?.rt}/{selectedResident.family?.rw}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Dynamic fields */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100 mb-3">
                Detail Surat
              </h3>
              <div className="space-y-3">
                <Input
                  label="Keperluan"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Melamar pekerjaan, urusan administrasi, dll"
                />
                <Input
                  id="tanggal-surat"
                  type="date"
                  label="Tanggal surat"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  helperText="Tanggal ini akan tampil pada surat dan hasil cetak."
                />
                {/* Extra vars from template that aren't auto-filled */}
                {templateVariables
                  .filter(
                    (v) =>
                      ![
                        'nama',
                        'nik',
                        'alamat',
                        'rt',
                        'rw',
                        'keperluan',
                        'tanggal',
                        'nomor_surat',
                        'jenis_kelamin',
                      ].includes(v),
                  )
                  .map((v) => (
                    <Input
                      key={v}
                      label={v.replace(/_/g, ' ')}
                      value={extraVars[v] || ''}
                      onChange={(e) => setExtraVars({ ...extraVars, [v]: e.target.value })}
                      placeholder={`Isi ${v}`}
                    />
                  ))}
              </div>
            </Card>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                loading={saving}
                onClick={handleCreateLetter}
                disabled={!selectedTemplate || !selectedResident}
              >
                Buat Surat
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setView('list');
                  resetForm();
                }}
              >
                Batal
              </Button>
            </div>
          </div>

          {/* RIGHT: Live Preview */}
          <div>
            <div className="sticky top-6">
              <div className="mb-3 flex items-center justify-between border-b-2 border-ink pb-3 dark:border-gray-300">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
                    Dokumen surat
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-ink dark:text-gray-100">
                    Pratinjau
                  </h3>
                </div>
                {selectedTemplate && (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowFullscreenPreview(true)}
                    >
                      <ArrowsPointingOutIcon className="mr-1.5 h-4 w-4" /> Layar penuh
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handlePrintPreview}>
                      <PrinterIcon className="mr-1.5 h-4 w-4" /> Cetak
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex min-h-[600px] items-start justify-center rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-selected)] p-5 shadow-[var(--shadow-card)] dark:border-gray-300">
                {selectedTemplate ? (
                  <div id="letter-print-document" className="flex w-full justify-center">
                    <LetterDocumentPreview
                      settings={settings}
                      template={selectedTemplate}
                      variables={variables}
                      previewHtml={previewHtml}
                    />
                  </div>
                ) : (
                  <div className="flex h-[400px] flex-col items-center justify-center text-center text-ink-secondary dark:text-gray-300">
                    <DocumentTextIcon className="w-12 h-12 mb-3" />
                    <p className="font-display text-base font-bold text-ink dark:text-gray-100">
                      Pratinjau belum tersedia
                    </p>
                    <p className="mt-1 text-sm">Pilih jenis surat untuk menampilkan dokumen.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          isOpen={showFullscreenPreview && !!selectedTemplate}
          onClose={() => setShowFullscreenPreview(false)}
          title="Pratinjau surat"
          size="full"
          contentClassName="bg-[var(--surface-selected)] p-4 sm:p-8"
          headerExtra={
            <Button variant="secondary" size="sm" onClick={handlePrintPreview}>
              <PrinterIcon className="mr-1.5 h-4 w-4" /> Cetak
            </Button>
          }
        >
          {selectedTemplate && (
            <div className="mx-auto flex w-full justify-center overflow-auto py-2">
              <LetterDocumentPreview
                settings={settings}
                template={selectedTemplate}
                variables={variables}
                previewHtml={previewHtml}
              />
            </div>
          )}
        </Modal>
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
        <div className="mb-6 flex items-center gap-4 border-b-2 border-ink pb-5 dark:border-gray-300">
          <Button
            variant="secondary"
            size="sm"
            aria-label="Kembali ke daftar surat"
            onClick={() => setView('list')}
          >
            <ArrowLeftIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Kembali
          </Button>
          <div className="border-l-2 border-ink pl-4 dark:border-gray-300">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
              Surat warga
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink dark:text-gray-100">
              Buat template surat
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* LEFT: Form & Editor (60%) */}
          <div className="xl:col-span-3 space-y-5">
            {/* Section 1: Informasi Template */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100 mb-3">
                Informasi Template
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nama Template"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Surat Pengantar"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jenis Surat
                  </label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                    className="w-full min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
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
                  <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100">
                    Variabel Dinamis
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Klik badge untuk menyisipkan otomatis ke editor
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {VARIABLE_CHIPS.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => insertVariable(chip.key)}
                    className="group inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-card))] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-all hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_18%,var(--surface-card))] active:scale-95"
                  >
                    <svg
                      className="h-3 w-3 opacity-60 group-hover:opacity-100"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {chip.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Section 3: Editor */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-100 mb-3">
                Isi Template
              </h3>
              <textarea
                ref={templateEditorRef}
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                rows={16}
                className="w-full rounded-sm border-2 border-ink bg-white px-4 py-3 text-sm leading-[1.8] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder={
                  'Yang bertanda tangan di bawah ini menerangkan bahwa:\n\nNama: {{nama}}\nNIK: {{nik}}\nAlamat: {{alamat}}\n\nAdalah benar warga RT {{rt}} / RW {{rw}}...\n\nSurat ini dibuat untuk keperluan: {{keperluan}}\n\nDemikian surat ini dibuat dengan sebenarnya.'
                }
              />
              <Input
                label="Deskripsi (opsional)"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                className="mt-3"
              />
            </Card>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex gap-3">
              <Button variant="primary" size="md" loading={saving} onClick={handleCreateTemplate}>
                Simpan Template
              </Button>
              <Button variant="secondary" size="md" onClick={() => setView('list')}>
                Batal
              </Button>
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
                    <div className="mb-4 grid grid-cols-[48px_1fr_48px] items-center border-b-[3px] border-double border-black pb-2 text-center">
                      <div className="flex justify-center">
                        {settings.gov_logo_url && (
                          <img
                            src={settings.gov_logo_url}
                            alt="Logo pemerintah atau lingkungan"
                            className="max-h-12 max-w-12 object-contain"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold">
                          RUKUN TETANGGA {settings.rt_name.replace(/\D/g, '').padStart(2, '0')} /
                          RUKUN WARGA {settings.rw_name.replace(/\D/g, '').padStart(3, '0')}
                        </p>
                        <p className="text-[9px]">
                          Kelurahan {settings.kelurahan}, Kec. {settings.kecamatan}, Kab.{' '}
                          {settings.kabupaten}
                        </p>
                        {settings.housing_complex && (
                          <p className="text-[9px]">Perumahan {settings.housing_complex}</p>
                        )}
                      </div>
                      <div aria-hidden="true" />
                    </div>
                    {/* Title */}
                    <div className="text-center mb-4">
                      <p className="font-bold text-[11px] underline">
                        {templateForm.name ? templateForm.name.toUpperCase() : 'JUDUL SURAT'}
                      </p>
                      <p className="text-[9px]">
                        Nomor: ___/RT{settings.rt_name.replace(/\D/g, '').padStart(2, '0')}/RW
                        {settings.rw_name.replace(/\D/g, '').padStart(3, '0')}/MM/YYYY
                      </p>
                    </div>
                    {/* Body with highlighted variables */}
                    <div
                      className="whitespace-pre-wrap text-justify"
                      dangerouslySetInnerHTML={{
                        __html: templatePreviewHtml.replace(/\n/g, '<br/>'),
                      }}
                    />
                    {/* Signature */}
                    <div className="mt-10 flex justify-end">
                      <div className="text-center w-40">
                        <p className="text-[9px]">
                          {settings.kabupaten}, {'{{tanggal}}'}
                        </p>
                        <p className="text-[9px]">
                          {settings.ketua_rt || `Ketua RT ${settings.rt_name}`}
                        </p>
                        <div className="h-12" />
                        <p className="border-t border-black pt-0.5 text-[9px]">
                          ____________________
                        </p>
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
          {admin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setView('template');
                setFormError('');
              }}
            >
              <PlusIcon className="w-4 h-4 mr-1" /> Template
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setView('create');
              resetForm();
            }}
          >
            <PlusIcon className="w-4 h-4 mr-1" /> Buat Surat
          </Button>
        </div>
      </div>

      {/* Templates summary */}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {templates
            .filter((t) => t.isActive)
            .map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F8FAFC] dark:bg-gray-800 text-[#64748B] text-xs rounded-lg border border-[#E2E8F0] dark:border-gray-700"
              >
                <DocumentTextIcon className="w-3.5 h-3.5" /> {t.name}
              </span>
            ))}
        </div>
      )}

      {/* Filter status */}
      <FilterBar>
        <FilterSelect
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="signed">Ditandatangani</option>
          <option value="archived">Arsip</option>
        </FilterSelect>
      </FilterBar>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : lettersLoadError ? (
        <Card className="flex min-h-52 flex-col items-start justify-center px-6 py-10">
          <p className="font-display text-lg font-bold text-ink dark:text-gray-100">
            Daftar surat belum dapat dimuat
          </p>
          <p className="mt-1 max-w-md text-sm font-medium text-ink-secondary dark:text-gray-300">
            Periksa koneksi atau layanan aplikasi, kemudian coba kembali.
          </p>
          <Button variant="secondary" size="sm" className="mt-5" onClick={() => void fetchData()}>
            Coba lagi
          </Button>
        </Card>
      ) : letters.length === 0 ? (
        <Card className="flex min-h-52 flex-col items-center justify-center bg-[#fff8ec] px-6 py-12 text-center dark:bg-gray-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-ink bg-[#f1dfc4] shadow-[3px_3px_0_#171717] dark:border-gray-400 dark:bg-gray-700 dark:shadow-[3px_3px_0_#a3a3a3]">
            <DocumentTextIcon className="h-7 w-7 text-ink dark:text-white" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-display text-lg font-bold text-ink dark:text-gray-100">
            Belum ada surat
          </h2>
          <p className="mt-1 max-w-sm text-sm font-medium text-gray-700 dark:text-gray-300">
            Surat yang dibuat untuk warga akan tersimpan dan dapat dikelola di sini.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-5"
            onClick={() => {
              setView('create');
              resetForm();
            }}
          >
            <PlusIcon className="mr-1 h-4 w-4" /> Buat surat pertama
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
                  <TableCell className="text-sm whitespace-nowrap">
                    {new Date(letter.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>{statusBadge(letter.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {admin && letter.status === 'draft' && (
                        <TableActionButton
                          action="approve"
                          label={`Tandatangani surat ${letter.letterNumber}`}
                          onClick={() => handleSign(letter.id)}
                        />
                      )}
                      <TableActionButton
                        action="print"
                        label={`Cetak surat ${letter.letterNumber}`}
                        onClick={() => handlePrint(letter.id)}
                      />
                      {admin && (
                        <TableActionButton
                          action="delete"
                          label={`Hapus surat ${letter.letterNumber}`}
                          onClick={() => handleDelete(letter.id)}
                        />
                      )}
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
