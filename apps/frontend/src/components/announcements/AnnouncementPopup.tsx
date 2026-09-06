import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { AnnouncementDetailDialog, type AnnouncementDetail } from './AnnouncementDetailDialog';
import { Button } from '@/components/ui/Button';

// Key localStorage untuk menandai pengumuman yang sudah dilihat via popup
const SEEN_KEY = 'warganet_seen_announcement_id';

export function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchLatest() {
      try {
        // Ambil pengumuman terbaru (backend otomatis menyaring sesuai role & hanya terbit untuk warga)
        const { data } = await api.get('/announcements', { params: { limit: 1 } });
        const latest: AnnouncementDetail | undefined = data.data?.[0];
        if (!latest) return;

        // Hanya tampilkan jika belum pernah dilihat pada sesi/perangkat ini
        const seenId = localStorage.getItem(SEEN_KEY);
        if (seenId !== latest.id) {
          setAnnouncement(latest);
          setOpen(true);
        }
      } catch {
        // silent
      }
    }
    fetchLatest();
  }, []);

  function handleClose() {
    if (announcement) {
      localStorage.setItem(SEEN_KEY, announcement.id);
    }
    setOpen(false);
  }

  if (!open || !announcement) return null;

  return (
    <AnnouncementDetailDialog
      announcement={announcement}
      onClose={handleClose}
      footer={
        <>
          <Link
            to="/announcements"
            onClick={handleClose}
            className="text-sm font-bold text-brand-600 hover:underline"
          >
            Lihat semua pengumuman
          </Link>
          <Button type="button" onClick={handleClose}>
            Mengerti
          </Button>
        </>
      }
    />
  );
}
