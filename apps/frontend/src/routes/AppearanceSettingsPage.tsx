import { useEffect, useMemo, useState } from 'react';
import { CheckIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { useAppearance } from '@/contexts/AppearanceContext';
import {
  ACCENT_COLORS,
  DEFAULT_APPEARANCE,
  applyAppearance,
  isAccessibleAccent,
  readCachedAppearance,
  type AppearancePreferences,
} from '@/lib/appearance';

const OPTIONS = {
  mode: [
    ['light', 'Terang'],
    ['dark', 'Gelap'],
    ['system', 'Ikuti sistem'],
  ],
  font: [
    ['geist', 'Geist'],
    ['archivo', 'Archivo'],
    ['mono', 'Geist Mono'],
  ],
  textSize: [
    ['small', 'Kecil'],
    ['standard', 'Standar'],
    ['large', 'Besar'],
  ],
  radius: [
    ['square', 'Siku'],
    ['subtle', 'Sedikit membulat'],
    ['rounded', 'Membulat'],
  ],
  density: [
    ['compact', 'Ringkas'],
    ['comfortable', 'Nyaman'],
  ],
} as const;

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-black text-ink dark:text-white">{label}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map(([option, optionLabel]) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-control)] border-2 border-ink px-3 py-2 text-left text-sm font-bold transition-[transform,box-shadow,background-color] focus:outline-none focus:ring-2 focus:ring-ink/30 dark:border-gray-300 ${
              value === option
                ? 'bg-[var(--surface-selected)] shadow-[var(--shadow-small)]'
                : 'bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] dark:text-white'
            }`}
          >
            <span>{optionLabel}</span>
            {value === option && (
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[var(--accent)] text-white">
                <CheckIcon className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
              </span>
            )}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function AppearanceSettingsPage() {
  const { preferences, preview, save, cancelPreview, reset, saving } = useAppearance();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<AppearancePreferences>(preferences);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => setDraft(preferences), [preferences]);
  useEffect(() => {
    preview(draft);
  }, [draft, preview]);
  useEffect(() => () => applyAppearance(readCachedAppearance()), []);

  const customError = useMemo(() => {
    if (draft.accent !== 'custom') return '';
    if (!/^#[0-9a-f]{6}$/i.test(draft.customAccent || '')) return 'Gunakan format warna #RRGGBB.';
    if (!isAccessibleAccent(draft.customAccent || ''))
      return 'Warna belum memiliki kontras minimum 4,5:1 terhadap teks putih.';
    return '';
  }, [draft.accent, draft.customAccent]);

  function update<K extends keyof AppearancePreferences>(key: K, value: AppearancePreferences[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (customError) return;
    try {
      await save(draft);
      showToast('Preferensi tampilan tersimpan.');
    } catch {
      showToast('Preferensi gagal disimpan. Perubahan belum diterapkan permanen.', 'error');
    }
  }

  function handleCancel() {
    setDraft(preferences);
    cancelPreview();
    showToast('Perubahan tampilan dibatalkan.', 'info');
  }

  async function handleReset() {
    if (!window.confirm('Kembalikan seluruh preferensi tampilan ke bawaan WargaNet?')) return;
    try {
      await reset();
      setDraft(DEFAULT_APPEARANCE);
      showToast('Tampilan dikembalikan ke pengaturan bawaan.');
    } catch {
      showToast('Pengaturan bawaan gagal disimpan.', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-[var(--space-page)]">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border-2 border-ink bg-[var(--accent)] text-white shadow-[var(--shadow-small)]">
          <PaintBrushIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">
            Pengaturan · Tampilan
          </p>
          <h1 className="font-display text-2xl font-black text-ink dark:text-white">
            Preferensi tampilan
          </h1>
          <p className="text-sm text-ink-secondary dark:text-gray-300">
            Sesuaikan tampilan aplikasi sesuai preferensi Anda.
          </p>
        </div>
      </div>

      <div className="sticky top-14 z-20 -mx-2 mb-5 flex flex-col-reverse gap-3 border-y-2 border-ink bg-[var(--surface-page)] px-2 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-400">
        <Button variant="secondary" size="sm" type="button" onClick={() => void handleReset()}>
          Reset ke default
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" type="button" onClick={handleCancel}>
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            loading={saving}
            disabled={Boolean(customError)}
            onClick={() => void handleSave()}
          >
            Simpan pengaturan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <Card className="space-y-[var(--space-control)] p-[var(--space-card)]">
          <ChoiceGroup
            label="Mode tampilan"
            value={draft.mode}
            options={OPTIONS.mode}
            onChange={(value) => update('mode', value)}
          />

          <fieldset>
            <legend className="mb-2 text-sm font-black text-ink dark:text-white">
              Warna aksen
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ['blue', 'Biru'],
                  ['green', 'Hijau'],
                  ['orange', 'Oranye'],
                  ['custom', 'Warna sendiri'],
                ] as const
              ).map(([accent, label]) => (
                <button
                  key={accent}
                  type="button"
                  aria-pressed={draft.accent === accent}
                  onClick={() => update('accent', accent)}
                  className={`relative min-h-14 rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-card)] p-2 pr-7 text-left text-xs font-bold dark:border-gray-300 dark:text-white ${draft.accent === accent ? 'bg-[var(--surface-selected)] shadow-[var(--shadow-small)]' : ''}`}
                >
                  <span
                    className="mb-1 block h-4 w-8 border border-ink"
                    style={{
                      backgroundColor:
                        accent === 'custom'
                          ? draft.customAccent || '#525252'
                          : ACCENT_COLORS[accent],
                    }}
                  />
                  {label}
                  {draft.accent === accent && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                      <CheckIcon className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {draft.accent === 'custom' && (
              <div className="mt-3 grid items-end gap-3 sm:grid-cols-[72px_1fr]">
                <input
                  aria-label="Pilih warna aksen"
                  type="color"
                  value={draft.customAccent || '#1e40af'}
                  onChange={(event) => update('customAccent', event.target.value)}
                  className="h-11 w-full rounded-[var(--radius-control)] border-2 border-ink bg-white p-1"
                />
                <Input
                  label="Kode warna"
                  value={draft.customAccent || ''}
                  placeholder="#1e40af"
                  error={customError}
                  onChange={(event) => update('customAccent', event.target.value)}
                />
              </div>
            )}
          </fieldset>

          <ChoiceGroup
            label="Font"
            value={draft.font}
            options={OPTIONS.font}
            onChange={(value) => update('font', value)}
          />
          <ChoiceGroup
            label="Ukuran teks"
            value={draft.textSize}
            options={OPTIONS.textSize}
            onChange={(value) => update('textSize', value)}
          />
          <ChoiceGroup
            label="Sudut komponen"
            value={draft.radius}
            options={OPTIONS.radius}
            onChange={(value) => update('radius', value)}
          />
          <ChoiceGroup
            label="Kepadatan tampilan"
            value={draft.density}
            options={OPTIONS.density}
            onChange={(value) => update('density', value)}
          />
        </Card>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-ink-secondary dark:text-gray-300">
            Preview langsung
          </p>
          <Card className="space-y-[var(--space-control)] p-[var(--space-card)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-black text-ink dark:text-white">
                  Kegiatan warga
                </p>
                <p className="text-sm text-ink-secondary dark:text-gray-300">Minggu, 07.00 WIB</p>
              </div>
              <span className="rounded-[var(--radius-control)] border border-ink bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                Aktif
              </span>
            </div>
            <Input label="Cari informasi" placeholder="Ketik kata kunci…" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Tombol utama</Button>
              <Button size="sm" variant="secondary" onClick={() => setShowPreviewModal(true)}>
                Lihat modal
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Kerja bakti</TableCell>
                  <TableCell>Terjadwal</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Contoh modal"
      >
        <p className="text-sm text-ink-secondary dark:text-gray-300">
          Modal mengikuti font, ukuran, sudut, kepadatan, dan warna aksen yang sedang dipreview.
        </p>
        <div className="mt-5 flex justify-end">
          <Button size="sm" onClick={() => setShowPreviewModal(false)}>
            Mengerti
          </Button>
        </div>
      </Modal>
    </div>
  );
}
