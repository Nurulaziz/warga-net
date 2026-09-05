import { useEffect, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { LoginSlidePanel } from '@/components/auth/LoginSlidePanel';
import { HeroVisual } from '@/components/landing/HeroVisual';
import {
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowUpIcon,
  ChatBubbleOvalLeftIcon,
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  { label: 'Produk', href: '#produk' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Untuk Warga', href: '#untuk-warga' },
  { label: 'Untuk Pengurus', href: '#untuk-pengurus' },
  { label: 'FAQ', href: '#faq' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Masuk dengan WhatsApp',
    desc: 'Cukup nomor WhatsApp dan kode OTP.',
  },
  {
    step: '02',
    title: 'Peran dikenali otomatis',
    desc: 'Warga atau pengurus dikenali dari data akun.',
  },
  {
    step: '03',
    title: 'Mulai Terhubung',
    desc: 'Informasi, kegiatan, dan layanan tersedia dalam satu tempat.',
  },
];

const INFO_COMPONENTS = [
  { date: '14 SEP', text: 'Kerja Bakti Lingkungan' },
  { date: '10 SEP', text: 'Pembayaran Iuran' },
  { date: '08 SEP', text: 'Perbaikan Saluran Air' },
];

const POLL_OPTIONS = [
  { label: '07.00–09.00', pct: 52, color: 'bg-brand-500' },
  { label: '09.00–11.00', pct: 31, color: 'bg-accent-green' },
  { label: 'Sore', pct: 17, color: 'bg-accent-orange' },
];

const SERVICES = ['Lapor Masalah', 'Usulan Warga', 'Iuran', 'Surat Pengantar', 'Booking Fasilitas'];
const HERO_WORDS = ['sederhana', 'tertata', 'transparan', 'terhubung'];
const CTA_WORDS = ['terhubung', 'tertata', 'transparan', 'berdaya'];

const FINANCE_FEATURES = [
  {
    number: '01',
    title: 'Bayar lebih praktis',
    desc: 'Warga dapat membayar iuran melalui QRIS dan virtual account.',
  },
  {
    number: '02',
    title: 'Tercatat otomatis',
    desc: 'Pembayaran yang berhasil langsung masuk ke pembukuan tanpa input ulang.',
  },
  {
    number: '03',
    title: 'Laporan siap pakai',
    desc: 'Laporan pemasukan, pengeluaran, dan saldo dibuat otomatis dan transparan.',
  },
];

const SERVICE_PREVIEWS: Record<string, { title: string; lines: string[] }> = {
  'Lapor Masalah': {
    title: 'LAPOR MASALAH',
    lines: ['Formulir aduan warga untuk masalah lingkungan'],
  },
  'Usulan Warga': { title: 'USULAN WARGA', lines: ['Sampaikan usulan perbaikan lingkungan'] },
  Iuran: {
    title: 'IURAN SEPTEMBER',
    lines: ['Status', 'Sudah dibayar', 'Jatuh tempo', '10 September'],
  },
  'Surat Pengantar': { title: 'SURAT PENGANTAR', lines: ['Pengajuan surat resmi dari RT'] },
  'Booking Fasilitas': { title: 'BOOKING FASILITAS', lines: ['Reservasi fasilitas lingkungan'] },
};

export function LandingPage() {
  const { settings } = useSettings();
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [heroWordIndex, setHeroWordIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroWordIndex((current) => (current + 1) % HERO_WORDS.length);
    }, 2400);

    return () => window.clearInterval(interval);
  }, []);

  const openLogin = () => {
    setMobileMenuOpen(false);
    setLoginOpen(true);
  };

  const previewService = activeRow || 'Lapor Masalah';
  const preview = SERVICE_PREVIEWS[previewService];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-warm-50 dark:bg-gray-950">
      {/* Konten landing — bergeser ke kiri + sedikit meredup saat panel login terbuka */}
      <div
        className={`transition-[transform,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLoginOpen ? 'lg:-translate-x-[8%] lg:brightness-[0.97] lg:blur-[1px]' : ''
        }`}
      >
        {/* ─── NAVBAR ─── */}
        <header className="sticky top-0 z-30 border-b-2 border-ink bg-warm-50 dark:border-gray-600 dark:bg-gray-950">
          <nav
            className="mx-auto flex max-w-[1220px] items-center gap-4 px-5 sm:px-8"
            style={{ height: 68 }}
          >
            {/* Left: wordmark */}
            <a href="#top" className="flex shrink-0 items-center gap-2.5">
              <p className="font-display text-[1.4rem] font-extrabold tracking-[-0.035em] text-ink dark:text-gray-100 sm:text-[1.5rem]">
                {settings.app_name}
              </p>
            </a>

            {/* Center: nav links (desktop) */}
            <ul className="ml-12 hidden items-center gap-7 lg:flex">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="font-display text-[14px] font-semibold tracking-[-0.01em] text-ink transition-colors hover:text-brand-600 dark:text-gray-200 dark:hover:text-blue-400"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Right: single auth action (desktop) */}
            <div className="ml-auto hidden items-center gap-3 lg:flex">
              <button type="button" onClick={openLogin} className="btn-brutal btn-brutal-primary">
                Masuk
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile: hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Buka menu"
              className="ml-auto flex h-11 w-11 items-center justify-center rounded text-ink hover:bg-warm-100 dark:text-gray-200 dark:hover:bg-gray-800 lg:hidden"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </nav>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="border-t-2 border-ink bg-warm-50 px-5 py-4 dark:border-gray-600 dark:bg-gray-950 lg:hidden">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded px-3 py-2.5 text-[0.95rem] font-medium text-ink hover:bg-warm-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-warm-300 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={openLogin}
                  className="btn-brutal btn-brutal-primary w-full"
                >
                  Masuk <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </header>

        <main id="top">
          {/* ─── HERO ─── */}
          <section className="py-14 sm:py-20">
            <div className="mx-auto max-w-[1220px] px-5 sm:px-8">
              <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-12">
                {/* Kiri: konten */}
                <div className="sm:col-span-6 lg:col-span-7">
                  <div className="flex items-center gap-3">
                    <div className="h-[2px] w-8 bg-brand-500" />
                    <span className="editorial-label !font-semibold !text-ink-secondary dark:!text-gray-300">Warganet</span>
                  </div>

                  <h1 className="mt-6 font-display text-[34px] font-bold leading-[1.02] tracking-[-0.04em] text-ink dark:text-gray-50 min-[420px]:text-[38px] sm:text-[52px] lg:text-[60px] xl:text-[64px]">
                    Urusan warga,
                    <br />
                    <span className="whitespace-nowrap">
                      jadi lebih{' '}
                      <span
                        key={HERO_WORDS[heroWordIndex]}
                        className="inline-block animate-[wordReveal_0.35s_ease-out] text-brand-500"
                      >
                        {HERO_WORDS[heroWordIndex]}.
                      </span>
                    </span>
                  </h1>

                  <p className="mt-6 max-w-[500px] text-[16px] leading-[1.6] text-ink-secondary dark:text-gray-300 sm:text-base">
                    Informasi, layanan, dan komunikasi lingkungan
                    <br className="hidden sm:block" /> dalam satu tempat.
                  </p>

                  <div className="mt-9">
                    <a
                      href="#produk"
                      className="btn-brutal btn-brutal-primary px-6 py-3.5 text-[15px]"
                    >
                      Jelajahi fitur <ArrowRightIcon className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Kanan: komposisi komunitas */}
                <div className="sm:col-span-6 lg:col-span-5">
                  <HeroVisual />
                </div>
              </div>
            </div>
          </section>

          {/* ─── 01 / KENAPA WARGANET ─── */}
          <section className="border-y-2 border-ink dark:border-gray-600">
            <div className="mx-auto max-w-[1220px] px-5 py-[72px] sm:py-[96px] sm:px-8">
              <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] lg:gap-16">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] font-semibold text-brand-500">01</span>
                    <span className="text-[12px] uppercase tracking-[0.12em] text-ink-muted">
                      / Kenapa WargaNet
                    </span>
                  </div>
                  <h2 className="mt-5 font-display font-bold leading-[1.05] tracking-[-0.02em] text-ink dark:text-gray-50 text-[32px] sm:text-[40px] lg:text-[48px]">
                    Informasi lingkungan seharusnya
                    <br />
                    tidak tenggelam di grup chat.
                  </h2>
                  <p className="mt-6 max-w-[600px] text-[16px] leading-[1.65] text-ink-secondary dark:text-gray-300">
                    Pengumuman, aspirasi, kegiatan, dan layanan warga punya tempatnya masing-masing —
                    tetapi tetap terhubung dalam satu lingkungan digital.
                  </p>
                </div>

                <div className="relative mx-auto w-full max-w-[360px]">
                  <div className="absolute inset-x-4 bottom-2 h-3 bg-ink/15 blur-sm dark:bg-white/10" />
                  <img
                    src="/assets/warganet-community.png"
                    alt="Warga bergotong royong membersihkan lingkungan"
                    className="relative block h-auto w-full drop-shadow-[4px_5px_0_rgba(23,23,23,0.16)]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ─── 02 / PRODUK — 3 product stories ─── */}
          <section id="produk" className="mx-auto max-w-[1220px] px-5 sm:px-8">
            {/* SUARA WARGA — showcase besar */}
            <div id="untuk-warga" className="grid min-h-[390px] grid-cols-1 items-center gap-10 py-12 sm:py-14 lg:grid-cols-2 lg:py-16">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] font-semibold text-brand-500">01</span>
                  <span className="text-[12px] uppercase tracking-[0.12em] text-ink-muted">
                    / Suara Warga
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[34px] font-bold leading-[1.05] tracking-[-0.02em] text-ink dark:text-gray-50 sm:text-[40px]">
                  BICARA.
                  <br />
                  DENGAR.
                  <br />
                  TERHUBUNG.
                </h3>
                <p className="mt-5 max-w-[480px] text-[16px] leading-[1.65] text-ink-secondary dark:text-gray-300">
                  Ruang bagi warga untuk berbagi informasi, bertanya, berdiskusi, dan menyampaikan
                  aspirasi.
                </p>
              </div>

              {/* Mock post */}
              <div
                className="border-2 border-ink bg-white shadow-[4px_4px_0_#171717] dark:border-gray-400 dark:bg-gray-900 dark:shadow-[4px_4px_0_#737373]"
                style={{ borderRadius: 2 }}
              >
                <div className="border-b-2 border-ink px-5 py-3 dark:border-gray-500">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-[13px] font-semibold text-white">
                      RS
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold leading-tight text-ink dark:text-gray-100">
                        Rina Sari · Blok A
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wide text-ink-muted dark:text-gray-400">
                        2 jam lalu
                      </p>
                    </div>
                    <span className="ml-auto rounded border border-edge-default dark:border-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink dark:text-gray-200">
                      Suara Warga
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="font-display text-[17px] font-bold text-ink dark:text-gray-100">
                    Kerja Bakti Minggu Depan
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary dark:text-gray-400">
                    Assalamu'alaikum warga, minggu depan kita akan mengadakan kerja bakti
                    membersihkan area perumahan. Mohon partisipasinya!
                  </p>
                  <div className="mt-4 flex items-center gap-5 border-t border-warm-300 dark:border-gray-700 pt-3 text-[12px] text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <ArrowUpIcon className="h-3.5 w-3.5" /> 24 suka
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ChatBubbleOvalLeftIcon className="h-3.5 w-3.5" /> 8 komentar
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* INFORMASI LINGKUNGAN — satu ekosistem, shared border-t */}
            <div className="border-t-2 border-ink py-16 dark:border-gray-600 sm:py-20 lg:py-24">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[13px] font-semibold text-brand-500">02</span>
                <span className="text-[12px] uppercase tracking-[0.12em] text-ink-muted">
                  / Informasi Lingkungan
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-12">
                {/* Pengumuman — list */}
                <div className="lg:col-span-5">
                  <h3 className="text-[20px] font-bold tracking-tight text-ink dark:text-gray-50">
                    Pengumuman Terbaru
                  </h3>
                  <div className="mt-4">
                    {INFO_COMPONENTS.map((item) => (
                      <div
                        key={item.date}
                        className="flex items-center gap-5 border-b border-warm-300 dark:border-gray-700 py-3 last:border-b-0"
                      >
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                          {item.date}
                        </span>
                        <span className="text-[14px] font-medium text-ink dark:text-gray-100">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Polling + Kegiatan — stacked, aligned */}
                <div className="lg:col-span-7 lg:pl-8">
                  <h3 className="text-[20px] font-bold tracking-tight text-ink dark:text-gray-50">
                    Polling Warga
                  </h3>
                  <div className="mt-4 space-y-3.5">
                    {POLL_OPTIONS.map((r) => (
                      <div key={r.label}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[13px] text-ink-secondary dark:text-gray-400">
                            {r.label}
                          </span>
                          <span className="font-mono text-[13px] font-semibold text-ink dark:text-gray-100">
                            {r.pct}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 w-full bg-ink/5 dark:bg-gray-700">
                          <div className={`h-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 border-t border-warm-300 dark:border-gray-700 pt-6">
                    <div className="flex items-start gap-5">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-display text-[44px] font-bold leading-none text-brand-500">
                          14
                        </span>
                        <span className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                          SEP
                        </span>
                      </div>
                      <div className="pt-1">
                        <p className="font-display text-[20px] font-bold tracking-tight text-ink dark:text-gray-50">
                          KERJA BAKTI
                        </p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">
                          07.00 WIB · Area Perumahan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KEUANGAN RT — pembayaran sampai laporan dalam satu alur */}
            <div className="border-t-2 border-ink py-16 dark:border-gray-600 sm:py-20 lg:py-24">
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] font-semibold text-brand-500">03</span>
                    <span className="text-[12px] uppercase tracking-[0.12em] text-ink-muted">
                      / Keuangan RT
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-[30px] font-bold leading-[1.08] tracking-tight text-ink dark:text-gray-50 sm:text-[38px]">
                    Dari pembayaran
                    <br />
                    sampai laporan.
                  </h3>
                  <p className="mt-5 max-w-[390px] text-[15px] leading-relaxed text-ink-secondary dark:text-gray-300">
                    Iuran lebih mudah dibayar, langsung tercatat, dan dapat dipantau bersama.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3 lg:col-span-8">
                  {FINANCE_FEATURES.map((feature) => (
                    <article
                      key={feature.number}
                      className="border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#171717] dark:border-gray-400 dark:bg-gray-900 dark:shadow-[4px_4px_0_#737373]"
                    >
                      <span className="font-mono text-[12px] font-bold text-brand-500">
                        {feature.number}
                      </span>
                      <h4 className="mt-8 font-display text-[18px] font-bold leading-tight text-ink dark:text-gray-100">
                        {feature.title}
                      </h4>
                      <p className="mt-3 text-[13px] leading-relaxed text-ink-secondary dark:text-gray-400">
                        {feature.desc}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            {/* LAYANAN WARGA — list + preview kontekstual */}
            <div className="border-t-2 border-ink py-16 dark:border-gray-600 sm:py-20 lg:py-24">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[13px] font-semibold text-brand-500">04</span>
                <span className="text-[12px] uppercase tracking-[0.12em] text-ink-muted">
                  / Layanan Warga
                </span>
              </div>
              <h3 className="mt-4 text-[24px] font-bold tracking-tight text-ink dark:text-gray-50 sm:text-[28px]">
                Layanan Warga
              </h3>

              <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <div>
                    {SERVICES.map((item) => (
                      <a
                        key={item}
                        href="#untuk-warga"
                        onMouseEnter={() => setActiveRow(item)}
                        onMouseLeave={() => setActiveRow(null)}
                        className={`group flex items-center justify-between border-b border-warm-300 dark:border-gray-700 py-4 first:border-t border-l-2 transition-colors ${
                          activeRow === item ? 'border-l-brand-500' : 'border-l-transparent'
                        }`}
                      >
                        <span
                          className={`text-[15px] font-medium transition-colors ${
                            activeRow === item ? 'text-brand-500' : 'text-ink dark:text-gray-100'
                          }`}
                        >
                          {item}
                        </span>
                        <ArrowRightIcon
                          className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${
                            activeRow === item ? 'text-brand-500' : 'text-ink-muted'
                          }`}
                        />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Preview kontekstual — show don't explain */}
                <div className="lg:col-span-6 lg:pl-10">
                  {preview && (
                    <div className="border-t border-warm-300 dark:border-gray-700 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10 lg:border-warm-300 dark:lg:border-gray-700">
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                        {preview.title}
                      </p>
                      <div className="mt-3 space-y-1">
                        {preview.lines.map((line, i) => {
                          const isLabel = line === 'Status' || line === 'Jatuh tempo';
                          const isValue = line === 'Sudah dibayar' || line === '10 September';
                          return (
                            <p
                              key={i}
                              className={
                                isLabel
                                  ? 'text-[12px] text-ink-muted dark:text-gray-400'
                                  : isValue
                                    ? 'flex items-center gap-2 text-[13px] font-medium text-ink dark:text-gray-100'
                                    : 'text-[13px] text-ink-secondary dark:text-gray-400'
                              }
                            >
                              {line === 'Sudah dibayar' && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
                              )}
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ─── 03 / UNTUK SIAPA — typography only, no bg ─── */}
          <section id="untuk-pengurus" className="border-t-2 border-ink dark:border-gray-600">
            <div className="mx-auto max-w-[1220px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[13px] font-semibold text-brand-500">05</span>
                <span className="text-[12px] uppercase tracking-[0.12em] text-ink-muted">
                  / Untuk Siapa
                </span>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-16 lg:grid-cols-2">
                {/* Untuk Warga */}
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                    UNTUK WARGA
                  </p>
                  <h3 className="mt-3 font-display text-[28px] font-bold leading-[1.1] tracking-tight text-ink dark:text-gray-50 sm:text-[32px]">
                    Tahu apa yang terjadi
                    <br />
                    di lingkungan.
                  </h3>
                  <div className="mt-6">
                    {['Pengumuman', 'Polling & Aspirasi', 'Kegiatan', 'Layanan'].map((t) => (
                      <a
                        key={t}
                        href="#produk"
                        className="group flex items-center justify-between border-b border-warm-300 dark:border-gray-700 py-3 first:border-t"
                      >
                        <span className="text-[15px] font-medium text-ink dark:text-gray-100">
                          {t}
                        </span>
                        <ArrowRightIcon className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Untuk Pengurus */}
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                    UNTUK PENGURUS
                  </p>
                  <h3 className="mt-3 font-display text-[28px] font-bold leading-[1.1] tracking-tight text-ink dark:text-gray-50 sm:text-[32px]">
                    Kelola lingkungan
                    <br />
                    lebih terorganisir.
                  </h3>
                  <div className="mt-6">
                    {['Informasi', 'Data Warga', 'Layanan & Surat', 'Administrasi'].map((t) => (
                      <a
                        key={t}
                        href="#produk"
                        className="group flex items-center justify-between border-b border-warm-300 dark:border-gray-700 py-3 first:border-t"
                      >
                        <span className="text-[15px] font-medium text-ink dark:text-gray-100">
                          {t}
                        </span>
                        <ArrowRightIcon className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── 04 / CARA KERJA — 3 steps horizontal timeline ─── */}
          <section
            id="cara-kerja"
            className="mx-auto max-w-[1220px] border-t-2 border-ink px-5 py-16 dark:border-gray-600 sm:px-8 sm:py-20 lg:py-24"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-[13px] font-semibold text-brand-500">06</span>
              <span className="text-[12px] uppercase tracking-[0.12em] text-ink-muted">
                / Cara Kerja
              </span>
            </div>
            <h2 className="mt-4 font-display text-[30px] font-bold tracking-tight text-ink dark:text-gray-50 sm:text-[38px]">
              Cara mulai menggunakan {settings.app_name}
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-0 sm:grid-cols-3 lg:gap-0">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.step} className="relative">
                  <div className="relative border-t-2 border-ink pt-5 dark:border-gray-600 sm:pr-10 lg:pr-12">
                    <span className="font-mono text-[15px] font-bold text-brand-500">{s.step}</span>
                    <h3 className="mt-2 font-display text-[18px] font-bold text-ink dark:text-gray-100">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary dark:text-gray-400">
                      {s.desc}
                    </p>
                  </div>
                  {s.step !== HOW_IT_WORKS[HOW_IT_WORKS.length - 1].step && (
                    <div className="h-8 sm:hidden" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ─── FAQ — compact ─── */}
          <section id="faq" className="border-t-2 border-ink dark:border-gray-600">
            <div className="mx-auto max-w-[760px] px-5 py-14 sm:px-8 sm:py-20">
              <h2 className="font-display text-[28px] font-bold tracking-tight text-ink dark:text-gray-50 sm:text-[34px]">
                Pertanyaan umum
              </h2>
              <div className="mt-6">
                {[
                  {
                    q: `Bagaimana cara warga masuk ke ${settings.app_name}?`,
                    a: 'Cukup dengan nomor WhatsApp. Anda akan menerima kode OTP untuk masuk, tanpa perlu mengingat password.',
                  },
                  {
                    q: 'Apakah data warga aman?',
                    a: 'Akses diatur berdasarkan peran. Warga hanya melihat yang relevan, dan pengurus mengelola data sesuai kewenangannya.',
                  },
                  {
                    q: 'Apakah perlu memilih peran saat masuk?',
                    a: 'Tidak. Peran Anda dikenali otomatis dari data akun setelah verifikasi.',
                  },
                ].map((item) => (
                  <details
                    key={item.q}
                    className="group border-b border-warm-300 dark:border-gray-700"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 font-medium text-ink dark:text-gray-100">
                      {item.q}
                      <span className="ml-4 text-[18px] text-ink-muted transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="pb-3.5 text-[14px] leading-relaxed text-ink-secondary dark:text-gray-400">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ─── FINAL CTA — dark #171717, explicit 3-line contrast ─── */}
          <section className="border-y-2 border-ink bg-[#FF9A3C] px-5 py-[72px] sm:px-8 sm:py-[96px] lg:py-[112px]">
            <div className="mx-auto max-w-[1220px]">
              <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
                {/* Kiri: large closing statement — explicit per-line color */}
                <div className="lg:col-span-8">
                  <h2 className="font-display font-bold uppercase leading-[1.08] tracking-[-0.02em] text-[34px] sm:text-[44px] lg:text-[52px]">
                    <span className="text-ink">Lingkungan lebih</span>
                    <br />
                    <span
                      key={`cta-${CTA_WORDS[heroWordIndex]}`}
                      className="inline-block animate-[wordReveal_0.35s_ease-out] text-brand-700"
                    >
                      {CTA_WORDS[heroWordIndex]}
                    </span>
                    <br />
                    <span className="text-ink">dimulai dari sini.</span>
                  </h2>
                </div>

                {/* Kanan: supporting text + CTA */}
                <div className="lg:col-span-4 lg:pt-4">
                  <p className="text-[14px] font-medium leading-relaxed text-ink">
                    Semua informasi lingkungan dalam satu tempat.
                  </p>
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={openLogin}
                      className="btn-brutal btn-brutal-primary px-6 py-3.5 text-[15px]"
                    >
                      Masuk ke {settings.app_name} <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── FOOTER — 3 columns ─── */}
          <footer className="border-t-2 border-ink bg-warm-50 dark:border-gray-600 dark:bg-gray-950">
            <div className="mx-auto max-w-[1220px] px-5 py-12 sm:px-8">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div>
                  <p className="font-display text-[15px] font-bold text-ink dark:text-gray-100">
                    {settings.app_name}
                  </p>
                  <p className="mt-2 text-[13px] text-ink-muted dark:text-gray-500">
                    Komunitas lebih dekat.
                  </p>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink dark:text-gray-200">Produk</p>
                  <ul className="mt-2 space-y-1.5">
                    {['Fitur', 'Cara Kerja', 'Untuk Warga', 'Untuk Pengurus'].map((t) => (
                      <li key={t}>
                        <a
                          href="#produk"
                          className="text-[13px] text-ink-muted hover:text-brand-500 dark:text-gray-500"
                        >
                          {t}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink dark:text-gray-200">Legal</p>
                  <ul className="mt-2 space-y-1.5">
                    {['Ketentuan Penggunaan', 'Kebijakan Privasi'].map((t) => (
                      <li key={t}>
                        <a
                          href="#"
                          className="text-[13px] text-ink-muted hover:text-brand-500 dark:text-gray-500"
                        >
                          {t}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-10 border-t-2 border-ink pt-6 dark:border-gray-600">
                <p className="text-[12px] text-ink-muted dark:text-gray-500">
                  © {new Date().getFullYear()} {settings.app_name}. Seluruh hak cipta dilindungi.
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Panel login geser dari kanan */}
      <LoginSlidePanel open={isLoginOpen} onClose={() => setLoginOpen(false)} redirectTo="/" />
    </div>
  );
}
