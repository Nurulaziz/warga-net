import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDownIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useDismissibleLayer } from '@/hooks/useDismissibleLayer';

export function ProfileMenu() {
  const { user, currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { rootRef, triggerRef } = useDismissibleLayer(open, () => setOpen(false));
  const name = currentUser?.fullName || user?.name || 'Pengguna';
  const role = currentUser?.role.name?.replace(/_/g, ' ') || 'Warga';
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  async function signOut() {
    setOpen(false);
    await logout();
    navigate('/');
  }

  return (
    <div ref={rootRef} className="relative">
      <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Menu profil" onClick={() => setOpen((value) => !value)} className="flex h-9 items-center gap-2 rounded-sm border-2 border-ink bg-[#fffdf8] px-2 text-ink shadow-[2px_2px_0_#171717] hover:border-ink hover:bg-warm-100 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/30 focus:ring-offset-1">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-brand-500 text-[9px] font-black text-white">{initials}</span>
        <span className="hidden max-w-28 truncate text-xs font-black sm:inline">{name}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 rounded-sm border-2 border-ink bg-[#fffdf8] p-2 text-ink shadow-[4px_4px_0_#171717]">
          <div className="border-b-2 border-ink px-3 py-2"><p className="truncate text-sm font-black">{name}</p><p className="text-[11px] font-bold uppercase text-ink-secondary">{role}</p></div>
          <Link role="menuitem" to="/profile" onClick={() => setOpen(false)} className="mt-2 flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-bold hover:bg-warm-100 focus:outline-none focus:ring-2 focus:ring-ink/30"><UserCircleIcon className="h-4 w-4" />Profil Saya</Link>
          <button role="menuitem" type="button" onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-ink/30"><ArrowRightOnRectangleIcon className="h-4 w-4" />Keluar</button>
        </div>
      )}
    </div>
  );
}
