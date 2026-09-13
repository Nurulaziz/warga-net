import { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * HeroVisual — komposisi fragment produk editorial untuk hero landing page.
 *
 * Berisi 3 fragmen UI WargaNet (Pengumuman, Polling, Suara Warga) yang saling
 * tumpang tindih tipis, dengan dot-grid sebagai tekstur halus.
 * Mobile: satu fragmen Polling saja. Murni dekoratif — tidak ada logika bisnis.
 */

function PollFragment({ className = '' }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden border-2 border-ink bg-white shadow-[4px_4px_0_#171717] dark:border-gray-400 dark:bg-gray-900 dark:shadow-[4px_4px_0_#737373] ${className}`}
      style={{ borderRadius: 2 }}
    >
      <div className="border-b-2 border-ink px-4 py-2.5 dark:border-gray-500">
        <span className="editorial-label">Polling Warga</span>
      </div>
      <div className="space-y-3 px-4 py-3.5">
        <p className="text-[13px] font-semibold leading-snug text-ink dark:text-gray-100">
          Waktu kerja bakti yang paling cocok?
        </p>
        <div className="space-y-2.5">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-ink-secondary dark:text-gray-400">07.00–09.00</span>
              <span className="text-[11px] font-semibold text-ink dark:text-gray-200">52%</span>
            </div>
            <div className="mt-1 h-2 w-full bg-ink/5 dark:bg-gray-700">
              <div className="h-full w-[52%] bg-brand-500" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-ink-secondary dark:text-gray-400">09.00–11.00</span>
              <span className="text-[11px] font-semibold text-ink dark:text-gray-200">31%</span>
            </div>
            <div className="mt-1 h-2 w-full bg-ink/5 dark:bg-gray-700">
              <div className="h-full w-[31%] bg-accent-green" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-ink-secondary dark:text-gray-400">Sore</span>
              <span className="text-[11px] font-semibold text-ink dark:text-gray-200">17%</span>
            </div>
            <div className="mt-1 h-2 w-full bg-ink/5 dark:bg-gray-700">
              <div className="h-full w-[17%] bg-accent-orange" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnouncementFragment() {
  return (
    <div className="h-[190px] w-full overflow-hidden border-2 border-ink bg-white shadow-[4px_4px_0_#171717] dark:border-gray-400 dark:bg-gray-900 dark:shadow-[4px_4px_0_#737373]">
      <div className="border-b-2 border-ink px-4 py-2.5 dark:border-gray-500">
        <span className="editorial-label">Pengumuman</span>
      </div>
      <div className="space-y-3 px-4 py-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wide text-ink-muted">
            Minggu, 07.00
          </p>
          <p className="mt-1 text-sm font-bold text-ink dark:text-gray-100">
            Kerja Bakti Lingkungan
          </p>
        </div>
        <div className="border-t border-ink pt-3 dark:border-gray-500">
          <p className="font-mono text-[9px] uppercase tracking-wide text-ink-muted">Rabu, 19.30</p>
          <p className="mt-1 text-[13px] font-medium text-ink-secondary dark:text-gray-300">
            Rapat RT Bulanan
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentFragment() {
  return (
    <div className="h-[190px] w-full overflow-hidden border-2 border-ink bg-white shadow-[4px_4px_0_#171717] dark:border-gray-400 dark:bg-gray-900 dark:shadow-[4px_4px_0_#737373]">
      <div className="flex items-center gap-2 border-b-2 border-ink px-4 py-3 dark:border-gray-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
          RT
        </span>
        <div>
          <p className="text-xs font-bold text-ink dark:text-gray-100">Iuran September</p>
          <p className="font-mono text-[8px] uppercase tracking-wide text-ink-muted">
            Pembayaran online
          </p>
        </div>
      </div>
      <div className="px-4 py-4">
        <p className="text-sm font-bold text-ink dark:text-gray-100">QRIS &amp; Virtual Account</p>
        <div className="mt-3 flex items-center justify-between border-t border-ink pt-3 text-[10px] dark:border-gray-500">
          <span className="font-bold text-accent-green">Lunas · otomatis</span>
          <span className="text-ink-muted">Laporan siap</span>
        </div>
      </div>
    </div>
  );
}

export function HeroVisual() {
  const [mobileSlide, setMobileSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const slides = [
    { label: 'Polling warga', content: <PollFragment className="h-[190px] w-full" /> },
    { label: 'Pengumuman warga', content: <AnnouncementFragment /> },
    { label: 'Pembayaran iuran', content: <PaymentFragment /> },
  ];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(
      () => setMobileSlide((current) => (current + 1) % slides.length),
      4500,
    );
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => setMobileSlide((index + slides.length) % slides.length);

  return (
    <div className="relative select-none">
      {/* Dot-grid halus (sm+) */}
      <div
        className="absolute inset-0 hidden sm:block"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(21,21,21,0.10) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 90% 90% at 50% 40%, black 40%, transparent 95%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 90% at 50% 40%, black 40%, transparent 95%)',
        }}
      />

      {/* ── Versi mobile: carousel fitur, dapat digeser ── */}
      <div className="sm:hidden">
        <div
          className="relative mx-auto w-[min(82vw,310px)]"
          role="region"
          aria-roledescription="carousel"
          aria-label="Fitur WargaNet"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return;
            const distance =
              (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
            if (Math.abs(distance) > 40) goToSlide(mobileSlide + (distance < 0 ? 1 : -1));
            touchStartX.current = null;
          }}
        >
          <div
            key={mobileSlide}
            className="flex h-[194px] items-center animate-[wordReveal_0.3s_ease-out]"
            aria-live="polite"
            aria-label={slides[mobileSlide].label}
          >
            {slides[mobileSlide].content}
          </div>
        </div>
        <div className="mx-auto mt-4 flex w-[min(82vw,310px)] items-center justify-between">
          <button
            type="button"
            onClick={() => goToSlide(mobileSlide - 1)}
            aria-label="Fitur sebelumnya"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-selected)] text-ink shadow-[var(--shadow-small)] transition-transform focus:outline-none focus:ring-2 focus:ring-[var(--accent)] active:translate-x-px active:translate-y-px active:shadow-none"
          >
            <ChevronLeftIcon className="h-5 w-5 stroke-[2.5]" />
          </button>
          <div
            className="flex items-center justify-center gap-2"
            aria-label={`Slide ${mobileSlide + 1} dari ${slides.length}`}
          >
            {slides.map((slide, index) => (
              <button
                key={slide.label}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Tampilkan ${slide.label}`}
                aria-current={index === mobileSlide ? 'true' : undefined}
                className={`h-2.5 border border-ink transition-all ${index === mobileSlide ? 'w-7 bg-brand-500' : 'w-2.5 bg-white'}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goToSlide(mobileSlide + 1)}
            aria-label="Fitur berikutnya"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-selected)] text-ink shadow-[var(--shadow-small)] transition-transform focus:outline-none focus:ring-2 focus:ring-[var(--accent)] active:translate-x-px active:translate-y-px active:shadow-none"
          >
            <ChevronRightIcon className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ── Komposisi lengkap (sm+): 3 fragmen ── */}
      <div aria-hidden className="relative hidden min-h-[620px] sm:block">
        {/* Baris atas: fragmen Pengumuman */}
        <div className="absolute right-0 top-3 z-10">
          <div
            className="w-[290px] rotate-2 border-2 border-ink bg-white shadow-[5px_5px_0_#171717] dark:border-gray-400 dark:bg-gray-900 dark:shadow-[5px_5px_0_#737373]"
            style={{ borderRadius: 2 }}
          >
            <div className="border-b-2 border-ink px-4 py-2.5 dark:border-gray-500">
              <span className="editorial-label">Pengumuman</span>
            </div>
            <div className="space-y-3 px-4 py-3.5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-muted">
                  Minggu, 07.00
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-ink dark:text-gray-100">
                  Kerja Bakti
                </p>
              </div>
              <div className="border-t border-ink pt-3 dark:border-gray-600">
                <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-muted">
                  Rabu, 19.30
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-ink-secondary dark:text-gray-400">
                  Rapat RT Bulanan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Baris tengah: fragmen Polling */}
        <div className="absolute left-0 top-[155px] z-20">
          <PollFragment className="w-[330px] -rotate-2 !shadow-[5px_5px_0_#171717]" />
        </div>

        {/* Baris bawah: fragmen pembayaran iuran */}
        <div className="absolute right-[-6px] top-[326px] z-30">
          <div
            className="w-[310px] rotate-1 border-2 border-ink bg-white shadow-[5px_5px_0_#171717] dark:border-gray-400 dark:bg-gray-900 dark:shadow-[5px_5px_0_#737373]"
            style={{ borderRadius: 2 }}
          >
            <div className="border-b-2 border-ink px-4 py-2.5 dark:border-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white">
                  R
                </div>
                <div>
                  <p className="text-[11px] font-semibold leading-none text-ink dark:text-gray-100">
                    Iuran September
                  </p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-wide text-ink-muted">
                    pembayaran online
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-[12px] font-semibold leading-relaxed text-ink dark:text-gray-100">
                QRIS &amp; Virtual Account
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-ink pt-2.5 text-[10px] dark:border-gray-600">
                <span className="font-medium text-accent-green">Lunas · tercatat otomatis</span>
                <span className="text-ink-muted">Laporan siap</span>
              </div>
            </div>
          </div>
        </div>

        {/* Baris keempat: laporan keuangan otomatis */}
        <div className="absolute left-3 top-[455px] z-40">
          <div className="w-[285px] -rotate-3 border-2 border-ink bg-[#FF9A3C] shadow-[5px_5px_0_#171717] dark:border-gray-400">
            <div className="border-b-2 border-ink px-4 py-2.5">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink">
                Laporan Keuangan
              </p>
            </div>
            <div className="flex items-end justify-between px-4 py-3">
              <div>
                <p className="font-display text-[17px] font-bold text-ink">Rp12,4 jt</p>
                <p className="mt-0.5 text-[9px] text-ink/70">Saldo bulan berjalan</p>
              </div>
              <span className="font-mono text-[9px] font-bold uppercase text-ink">
                Auto generate
              </span>
            </div>
          </div>
        </div>

        {/* Baris kelima: percakapan warga */}
        <div className="absolute right-4 top-[520px] z-50">
          <div className="w-[300px] rotate-2 border-2 border-ink bg-white shadow-[5px_5px_0_#171717] dark:border-gray-400 dark:bg-gray-900 dark:shadow-[5px_5px_0_#737373]">
            <div className="flex items-center gap-2 border-b-2 border-ink px-3 py-2 dark:border-gray-500">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
                RS
              </div>
              <div>
                <p className="text-[10px] font-bold leading-none text-ink dark:text-gray-100">
                  Rina · Blok A
                </p>
                <p className="mt-1 font-mono text-[8px] uppercase text-ink-muted">Suara Warga</p>
              </div>
            </div>
            <p className="px-3 py-2.5 text-[10px] leading-relaxed text-ink-secondary dark:text-gray-400">
              “Jadwal kerja baktinya sudah tersedia?”
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
