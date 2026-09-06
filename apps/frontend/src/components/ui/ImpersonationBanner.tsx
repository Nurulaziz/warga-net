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
    <div className="sticky top-0 z-40 border-b-2 border-ink bg-brand-500 px-4 py-2.5 text-ink shadow-[0_2px_0_#171717] dark:border-gray-300 dark:bg-brand-600">
      <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-2 border-ink bg-warm-50 shadow-[2px_2px_0_#171717]">
            <ExclamationTriangleIcon className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold leading-tight sm:text-sm">
            Anda sedang melihat sebagai <strong>{session?.user?.name}</strong>
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={stopping}
          onClick={handleStopImpersonating}
          className="ml-auto shrink-0 border-2 border-ink bg-warm-50 px-3 text-xs font-black text-ink shadow-[2px_2px_0_#171717] hover:bg-[#f1dfc4] dark:border-gray-300 dark:bg-gray-100 dark:text-gray-900"
        >
          Kembali ke Akun Admin
        </Button>
      </div>
    </div>
  );
}
