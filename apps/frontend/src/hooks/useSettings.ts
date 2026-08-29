import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

export interface SystemSettings {
  rt_name: string;
  rw_name: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  housing_complex: string;
  ketua_rt: string;
  bendahara: string;
  sekretaris: string;
  app_name: string;
  app_logo_url: string;
  gov_logo_url: string;
}

const DEFAULTS: SystemSettings = {
  rt_name: '04',
  rw_name: '010',
  kelurahan: 'Satriamekar',
  kecamatan: 'Tambun Utara',
  kabupaten: 'Bekasi',
  provinsi: 'Jawa Barat',
  housing_complex: 'Satriamekar Raya Residence 2',
  ketua_rt: '',
  bendahara: '',
  sekretaris: '',
  app_name: 'WargaNet',
  app_logo_url: '',
  gov_logo_url: '',
};

// Cache sederhana supaya tidak fetch berulang kali
let cachedSettings: SystemSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 menit

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>(cachedSettings || DEFAULTS);
  const [loading, setLoading] = useState(!cachedSettings);

  const fetchSettings = useCallback(async () => {
    // Pakai cache jika masih fresh
    if (cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/settings');
      const map: Record<string, string> = {};
      (data as { key: string; value: string }[]).forEach((s) => {
        map[s.key] = s.value;
      });

      const resolved: SystemSettings = {
        rt_name: map['rt_name'] || DEFAULTS.rt_name,
        rw_name: map['rw_name'] || DEFAULTS.rw_name,
        kelurahan: map['kelurahan'] || DEFAULTS.kelurahan,
        kecamatan: map['kecamatan'] || DEFAULTS.kecamatan,
        kabupaten: map['kabupaten'] || DEFAULTS.kabupaten,
        provinsi: map['provinsi'] || DEFAULTS.provinsi,
        housing_complex: map['housing_complex'] || DEFAULTS.housing_complex,
        ketua_rt: map['ketua_rt'] || DEFAULTS.ketua_rt,
        bendahara: map['bendahara'] || DEFAULTS.bendahara,
        sekretaris: map['sekretaris'] || DEFAULTS.sekretaris,
        app_name: map['app_name'] || DEFAULTS.app_name,
        app_logo_url: map['app_logo_url'] || DEFAULTS.app_logo_url,
        gov_logo_url: map['gov_logo_url'] || DEFAULTS.gov_logo_url,
      };

      cachedSettings = resolved;
      cacheTimestamp = Date.now();
      setSettings(resolved);
    } catch {
      // Gunakan defaults jika gagal fetch
      setSettings(cachedSettings || DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Invalidate cache (misal setelah save settings)
  const invalidateCache = useCallback(() => {
    cachedSettings = null;
    cacheTimestamp = 0;
  }, []);

  return { settings, loading, refetch: fetchSettings, invalidateCache };
}

// Export defaults untuk dipakai komponen lain
export { DEFAULTS as SETTING_DEFAULTS };
