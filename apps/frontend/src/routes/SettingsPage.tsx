import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { api } from '@/services/api';
import { useSettings } from '@/hooks/useSettings';

interface Setting {
  id: string;
  key: string;
  value: string;
  label: string | null;
  group: string;
}

// RT/RW hanya angka — dipisah agar bisa diberi input & validasi khusus
const RT_RW_SETTINGS = [
  { key: 'rt_name', label: 'Nomor RT', group: 'rt_info', default: '04', prefix: 'RT' },
  { key: 'rw_name', label: 'Nomor RW', group: 'rt_info', default: '010', prefix: 'RW' },
];

const RT_INFO_SETTINGS = [
  ...RT_RW_SETTINGS,
  { key: 'kelurahan', label: 'Kelurahan', group: 'rt_info', default: '' },
  { key: 'kecamatan', label: 'Kecamatan', group: 'rt_info', default: '' },
  { key: 'kabupaten', label: 'Kabupaten/Kota', group: 'rt_info', default: '' },
  { key: 'provinsi', label: 'Provinsi', group: 'rt_info', default: '' },
  { key: 'housing_complex', label: 'Nama Perumahan', group: 'rt_info', default: '' },
  { key: 'ketua_rt', label: 'Nama Ketua RT', group: 'rt_info', default: '' },
  { key: 'bendahara', label: 'Nama Bendahara', group: 'rt_info', default: '' },
  { key: 'sekretaris', label: 'Nama Sekretaris', group: 'rt_info', default: '' },
];

// Field lokasi non-RT/RW (dirender sebagai input teks biasa)
const LOCATION_SETTINGS = RT_INFO_SETTINGS.filter(
  (d) => !RT_RW_SETTINGS.some((r) => r.key === d.key),
);

const BRANDING_SETTINGS = [
  { key: 'app_name', label: 'Nama Aplikasi', group: 'branding', default: 'WargaNet' },
];

const FINANCE_SETTINGS = [
  {
    key: 'bill_due_day',
    label: 'Default Tanggal Jatuh Tempo Iuran',
    group: 'finance',
    default: '10',
  },
];

const ALL_SETTINGS = [...RT_INFO_SETTINGS, ...BRANDING_SETTINGS, ...FINANCE_SETTINGS];

export function SettingsPage() {
  const { invalidateCache } = useSettings();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingApp, setUploadingApp] = useState(false);
  const [uploadingGov, setUploadingGov] = useState(false);
  const appLogoRef = useRef<HTMLInputElement>(null);
  const govLogoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await api.get('/settings');
        const map: Record<string, string> = {};
        (data as Setting[]).forEach((s) => {
          map[s.key] = s.value;
        });
        // Isi default jika belum ada
        ALL_SETTINGS.forEach((d) => {
          if (!map[d.key]) map[d.key] = d.default;
        });
        setSettings(map);
      } catch {
        const map: Record<string, string> = {};
        ALL_SETTINGS.forEach((d) => {
          map[d.key] = d.default;
        });
        setSettings(map);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const batch = ALL_SETTINGS.map((d) => ({
        key: d.key,
        value: settings[d.key] || '',
        label: d.label,
        group: d.group,
      }));
      await api.put('/settings', { settings: batch });
      invalidateCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(type: 'app_logo' | 'gov_logo') {
    const ref = type === 'app_logo' ? appLogoRef : govLogoRef;
    const file = ref.current?.files?.[0];
    if (!file) return;

    const setUploading = type === 'app_logo' ? setUploadingApp : setUploadingGov;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const { data } = await api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update local state dengan URL logo baru
      const urlKey = type === 'app_logo' ? 'app_logo_url' : 'gov_logo_url';
      setSettings((prev) => ({ ...prev, [urlKey]: (data as { url: string }).url }));
      invalidateCache();
    } catch {
      // silent
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Pengaturan Sistem
      </h1>

      {/* Branding */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Branding Aplikasi
        </h2>
        <div className="space-y-4">
          <Input
            label="Nama Aplikasi"
            value={settings['app_name'] || ''}
            onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
            placeholder="WargaNet"
          />

          {/* Logo Aplikasi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo Aplikasi
            </label>
            <div className="flex items-center gap-4">
              {settings['app_logo_url'] ? (
                <img
                  src={settings['app_logo_url']}
                  alt="Logo Aplikasi"
                  className="w-16 h-16 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 text-xs">
                  Kosong
                </div>
              )}
              <div>
                <input
                  ref={appLogoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={() => handleLogoUpload('app_logo')}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  loading={uploadingApp}
                  onClick={() => appLogoRef.current?.click()}
                >
                  {settings['app_logo_url'] ? 'Ganti Logo' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG. Maks 2MB.</p>
              </div>
            </div>
          </div>

          {/* Logo Pemerintah */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo Pemerintah / Kabupaten
            </label>
            <div className="flex items-center gap-4">
              {settings['gov_logo_url'] ? (
                <img
                  src={settings['gov_logo_url']}
                  alt="Logo Pemerintah"
                  className="w-16 h-16 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 text-xs">
                  Kosong
                </div>
              )}
              <div>
                <input
                  ref={govLogoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={() => handleLogoUpload('gov_logo')}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  loading={uploadingGov}
                  onClick={() => govLogoRef.current?.click()}
                >
                  {settings['gov_logo_url'] ? 'Ganti Logo' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG. Maks 2MB.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Informasi RT/RW */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Informasi RT/RW
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Nomor RT/RW cukup diisi angka saja (mis. 04, 010). Label &quot;RT&quot;/&quot;RW&quot;
          ditambahkan otomatis.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* RT/RW: input khusus angka dengan prefix */}
          {RT_RW_SETTINGS.map((d) => (
            <div key={d.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {d.label}
              </label>
              <div className="flex items-stretch">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
                  {d.prefix}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={settings[d.key] || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, [d.key]: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder={d.default}
                  className="w-full min-h-[44px] px-4 py-2 text-base border rounded-r-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ))}

          {/* Field lokasi lainnya */}
          {LOCATION_SETTINGS.map((d) => (
            <Input
              key={d.key}
              label={d.label}
              value={settings[d.key] || ''}
              onChange={(e) => setSettings({ ...settings, [d.key]: e.target.value })}
            />
          ))}
        </div>
      </Card>

      {/* Keuangan / Iuran */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Iuran Bulanan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Default Tanggal Jatuh Tempo"
            type="number"
            min={1}
            max={28}
            value={settings['bill_due_day'] || '10'}
            onChange={(e) => setSettings({ ...settings, bill_due_day: e.target.value })}
            helperText="Dipakai sebagai default saat membuat jenis iuran baru (1–28). Jadwal terbit & jatuh tempo tiap jenis iuran diatur di halaman Iuran → Jenis Iuran."
          />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="md" loading={saving} onClick={handleSave}>
          Simpan Pengaturan
        </Button>
        {saved && <span className="text-sm text-green-600">Tersimpan!</span>}
      </div>
    </div>
  );
}
