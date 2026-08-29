import { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { authClient } from '@/lib/auth-client';
import { Button } from './Button';

/**
 * Banner yang tampil saat admin sedang impersonate user lain.
 * Menampilkan warning dan tombol untuk stop impersonating.
 */
export function ImpersonationBanner() {
  const { data: session } = authClient.useSession();
  const [stopping, setStopping] = useState(false);

  // Cek apakah session saat ini adalah impersonation session
  const isImpersonating = !!(session?.session as { impersonatedBy?: string } | undefined)?.impersonatedBy;

  if (!isImpersonating) return null;

  async function handleStopImpersonating() {
    setStopping(true);
    try {
      await authClient.admin.stopImpersonating();
      window.location.reload();
    } catch {
      setStopping(false);
    }
  }

  return (
    <div className="bg-amber-500 dark:bg-amber-600 text-white px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">
          Anda sedang melihat sebagai <strong>{session?.user?.name}</strong>
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        loading={stopping}
        onClick={handleStopImpersonating}
        className="bg-white text-amber-700 hover:bg-amber-50 border-0"
      >
        Kembali ke Akun Admin
      </Button>
    </div>
  );
}
