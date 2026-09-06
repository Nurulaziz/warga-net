import { useEffect, useState } from 'react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { api } from '@/services/api';
import { useDismissibleLayer } from '@/hooks/useDismissibleLayer';

type Notification = { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const { rootRef, triggerRef } = useDismissibleLayer(open, () => setOpen(false));
  async function load() { try { const { data } = await api.get('/notifications', { params: { limit: 20 } }); setItems(data.data); setUnread(data.unread); } catch { /* fitur bersifat non-blocking */ } }
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 60000); return () => window.clearInterval(timer); }, []);
  async function read(id: string) { await api.patch(`/notifications/${id}/read`).catch(() => {}); void load(); }
  async function readAll() { await api.patch('/notifications/read-all').catch(() => {}); void load(); }

  return (
    <div ref={rootRef} className="relative">
      <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`} onClick={() => setOpen((value) => !value)} className="relative flex h-9 w-9 items-center justify-center rounded-sm border-2 border-ink bg-[#fffdf8] text-ink shadow-[2px_2px_0_#171717] hover:border-ink hover:bg-warm-100 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/30 focus:ring-offset-1">
        <BellIcon className="h-4 w-4" />
        {unread > 0 && <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-brand-500 px-1 text-[10px] font-black text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Daftar notifikasi" className="absolute right-0 mt-2 w-80 rounded-sm border-2 border-ink bg-[#fffdf8] shadow-[4px_4px_0_#171717]">
          <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3"><span className="font-black">Notifikasi</span>{unread > 0 && <button onClick={() => void readAll()} className="text-xs font-bold underline focus:outline-none focus:ring-2 focus:ring-ink/30">Tandai semua dibaca</button>}</div>
          <div className="max-h-96 overflow-y-auto">{items.length ? items.map((item) => <button key={item.id} onClick={() => !item.isRead && void read(item.id)} className={`w-full border-b border-ink/15 px-4 py-3 text-left hover:bg-warm-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ink/30 ${!item.isRead ? 'bg-blue-50' : ''}`}><div className="flex gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-black">{item.title}</p><p className="mt-1 text-xs font-medium text-ink-secondary">{item.message}</p><p className="mt-1 text-[10px] text-ink-muted">{new Date(item.createdAt).toLocaleString('id-ID')}</p></div>{!item.isRead && <CheckIcon className="h-4 w-4 flex-none text-brand-600" />}</div></button>) : <p className="px-4 py-10 text-center text-sm font-bold text-ink-secondary">Belum ada notifikasi</p>}</div>
        </div>
      )}
    </div>
  );
}
