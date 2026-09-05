import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { PhoneStep } from '@/components/auth/PhoneStep';
import { OtpStep } from '@/components/auth/OtpStep';
import { XMarkIcon } from '@heroicons/react/24/outline';

type LoginStep = 'phone' | 'otp';

interface LoginSlidePanelProps {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
}

/**
 * Panel login editorial — meluncur dari kanan, tanpa nested card.
 * Wordmark-only, heading editorial, motion halus, focus trap + focus return.
 * Auth logic tidak disentuh.
 */
export function LoginSlidePanel({ open, onClose, redirectTo = '/' }: LoginSlidePanelProps) {
  const { settings } = useSettings();
  const [step, setStep] = useState<LoginStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Simpan elemen pemicu saat panel dibuka — untuk focus return
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
    }
  }, [open]);

  // Reset ke langkah nomor setiap kali panel dibuka ulang
  useEffect(() => {
    if (open) setStep('phone');
  }, [open]);

  // Escape menutup panel + kunci scroll body + focus trap
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Focus trap — Tab cycle inside panel
      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll<HTMLElement>(
          'input, button, [tabindex]:not([tabindex="-1"]), a[href]',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Fokus ke input di dalam panel
    const focusTimer = window.setTimeout(() => {
      const phoneInput = panelRef.current?.querySelector<HTMLInputElement>('#phone-input');
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'input, button, [tabindex]:not([tabindex="-1"])',
      );
      (phoneInput || firstFocusable)?.focus();
    }, 280);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  // Focus return saat panel ditutup
  useEffect(() => {
    if (!open && triggerRef.current) {
      const el = triggerRef.current;
      triggerRef.current = null;
      // Tunggu animasi close selesai
      const t = window.setTimeout(() => {
        el?.focus?.();
      }, 210);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  function handlePhoneSubmitted(phone: string) {
    setPhoneNumber(phone);
    setStep('otp');
  }

  return (
    <>
      {/* Overlay — fade only, no blur */}
      <div
        aria-hidden={!open}
        onClick={handleClose}
        className={`fixed inset-0 z-40 bg-[#111]/30 transition-opacity duration-160 ease-linear ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel — editorial side panel, no nested card */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Masuk ke WargaNet"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-[clamp(410px,28vw,460px)] max-w-full flex-col border-l-2 border-ink bg-warm-50 dark:border-gray-500 dark:bg-gray-900 ${
          open
            ? 'translate-x-0 opacity-100 duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
            : 'translate-x-5 opacity-0 pointer-events-none duration-[200ms] ease-in'
        }`}
      >
        {/* Header: wordmark + close */}
        <div className="flex items-center justify-between px-7 pt-7 sm:px-8">
          <div className="leading-tight">
            <p className="font-display text-[1.5rem] font-extrabold tracking-[-0.035em] text-ink dark:text-gray-100">
              {settings.app_name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup"
            className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-ink bg-white text-ink-secondary shadow-[2px_2px_0_#171717] transition-[transform,box-shadow] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_#171717] dark:border-gray-500 dark:bg-gray-800 dark:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Isi — scrollable, tanpa nested card */}
        <div className="flex flex-1 flex-col overflow-y-auto px-7 py-8 sm:px-8">
          {/* Intro editorial */}
          <div className="mb-8 border-b-2 border-ink pb-6 dark:border-gray-500">
            {step === 'phone' ? (
              <>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-500">
                  MASUK
                </p>
                <h2 className="mt-3 font-display text-[26px] font-bold leading-[1.1] tracking-tight text-ink dark:text-gray-50">
                  Masuk ke lingkungan
                  <br />
                  Anda.
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-secondary dark:text-gray-400">
                  Gunakan nomor WhatsApp yang terdaftar
                  <br />
                  untuk melanjutkan.
                </p>
              </>
            ) : (
              <>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-500">
                  KODE OTP
                </p>
                <h2 className="mt-3 font-display text-[26px] font-bold leading-[1.1] tracking-tight text-ink dark:text-gray-50">
                  Verifikasi kode.
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-secondary dark:text-gray-400">
                  Kode 6 digit dikirim ke{' '}
                  <span className="font-medium text-ink dark:text-gray-200">
                    {phoneNumber.slice(0, 6)}****{phoneNumber.slice(-3)}
                  </span>
                </p>
              </>
            )}
          </div>

          {/* Form — langsung di atas surface panel */}
          {step === 'phone' && <PhoneStep onSubmitted={handlePhoneSubmitted} />}
          {step === 'otp' && (
            <OtpStep
              phoneNumber={phoneNumber}
              onBack={() => setStep('phone')}
              redirectTo={redirectTo}
            />
          )}

          {/* Legal copy — natural flow, tidak dipaksa ke bawah */}
          <div className="mt-8 border-t-2 border-ink pt-6 dark:border-gray-500">
            <p className="text-[12px] leading-relaxed text-ink-muted dark:text-gray-500">
              Dengan melanjutkan, Anda menyetujui{' '}
              <a
                href="#"
                className="text-ink-secondary underline underline-offset-2 decoration-ink-secondary/30 transition-colors hover:text-brand-500 hover:decoration-brand-500/50 dark:text-gray-400 dark:hover:text-blue-400"
              >
                Ketentuan Penggunaan
              </a>{' '}
              dan{' '}
              <a
                href="#"
                className="text-ink-secondary underline underline-offset-2 decoration-ink-secondary/30 transition-colors hover:text-brand-500 hover:decoration-brand-500/50 dark:text-gray-400 dark:hover:text-blue-400"
              >
                Kebijakan Privasi
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
