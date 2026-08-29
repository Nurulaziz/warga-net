import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageMeta } from '@/lib/page-meta';
import { useSettings } from './useSettings';

// Set judul tab browser sesuai halaman aktif: "Halaman - AppName"
export function useDocumentTitle() {
  const location = useLocation();
  const { settings } = useSettings();

  useEffect(() => {
    const { title } = getPageMeta(location.pathname);
    document.title = `${title} - ${settings.app_name}`;
  }, [location.pathname, settings.app_name]);
}
