import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { PhoneStep } from '@/components/auth/PhoneStep';
import { OtpStep } from '@/components/auth/OtpStep';
import {
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  HomeModernIcon,
} from '@heroicons/react/24/outline';

type LoginStep = 'phone' | 'otp';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  const [step, setStep] = useState<LoginStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Redirect ke intended URL atau dashboard jika sudah login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-gray-900">
        <div className="animate-spin h-8 w-8 border-4 border-[#0054A6] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  function handlePhoneSubmitted(phone: string) {
    setPhoneNumber(phone);
    setStep('otp');
  }

  function handleBackToPhone() {
    setStep('phone');
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT PANEL – BRANDING (hidden on mobile/tablet) */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative overflow-hidden text-white flex-col justify-between p-12 xl:p-14"
        style={{
          background: 'linear-gradient(160deg, #0054A6 0%, #003A77 60%, #002D5E 100%)',
        }}
      >
        {/* Background decoration - dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Background decoration - bottom wave + houses silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-48 opacity-[0.07]">
          <svg
            viewBox="0 0 1200 200"
            className="absolute bottom-0 w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Wave */}
            <path
              fill="currentColor"
              d="M0,120 C200,80 400,160 600,120 C800,80 1000,140 1200,100 L1200,200 L0,200 Z"
            />
            {/* Houses silhouette */}
            <rect x="80" y="130" width="40" height="50" fill="currentColor" opacity="0.5" />
            <polygon points="80,130 100,110 120,130" fill="currentColor" opacity="0.5" />
            <rect x="140" y="140" width="35" height="40" fill="currentColor" opacity="0.4" />
            <polygon points="140,140 157,122 175,140" fill="currentColor" opacity="0.4" />
            <rect x="200" y="125" width="45" height="55" fill="currentColor" opacity="0.45" />
            <polygon points="200,125 222,105 245,125" fill="currentColor" opacity="0.45" />
            <rect x="280" y="138" width="38" height="42" fill="currentColor" opacity="0.35" />
            <polygon points="280,138 299,120 318,138" fill="currentColor" opacity="0.35" />
            <rect x="350" y="132" width="42" height="48" fill="currentColor" opacity="0.4" />
            <polygon points="350,132 371,112 392,132" fill="currentColor" opacity="0.4" />
          </svg>
        </div>

        {/* Subtle top-right glow */}
        <div
          className="absolute top-0 right-0 w-80 h-80 opacity-[0.08] rounded-full"
          style={{
            background: 'radial-gradient(circle, #2563EB, transparent 70%)',
          }}
        />

        {/* Top - Logo & Identity */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${settings.app_logo_url ? '' : 'bg-white/15 backdrop-blur-sm border border-white/20'}`}>
              {settings.app_logo_url ? (
                <img src={settings.app_logo_url} alt={settings.app_name} className="w-11 h-11 object-contain rounded-xl" />
              ) : (
                <HomeModernIcon className="w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{settings.app_name}</h1>
              <p className="text-sm text-blue-200/90">Sistem Manajemen RT</p>
            </div>
          </div>
        </div>

        {/* Middle - Headline & Description */}
        <div className="relative z-10">
          <h2 className="text-[2.5rem] xl:text-[2.75rem] font-extrabold leading-[1.1] mb-5">
            Kelola RT
            <br />
            Lebih Mudah,
            <br />
            <span className="text-blue-200">Bersama {settings.app_name}</span>
          </h2>
          <p className="text-blue-100/85 text-[1.05rem] xl:text-lg leading-[1.65] max-w-[440px]">
            Solusi digital untuk pengelolaan data warga, iuran, kegiatan, dan komunikasi RT yang
            lebih terstruktur dan efisien.
          </p>
        </div>

        {/* Bottom - Benefits */}
        <div className="relative z-10 space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheckIcon className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-semibold text-[0.9rem] mb-0.5">Aman & Terpercaya</h3>
              <p className="text-blue-200/75 text-sm leading-relaxed">
                Data warga terlindungi dengan sistem keamanan berlapis.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-semibold text-[0.9rem] mb-0.5">Komunikasi Efektif</h3>
              <p className="text-blue-200/75 text-sm leading-relaxed">
                Informasi penting tersampaikan dengan cepat kepada warga.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
              <ChartBarIcon className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-semibold text-[0.9rem] mb-0.5">Transparansi Keuangan</h3>
              <p className="text-blue-200/75 text-sm leading-relaxed">
                Kelola iuran dan laporan keuangan RT dengan lebih transparan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL – LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-[#F8FAFC] dark:bg-gray-900 px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
        {/* Subtle background radial glow */}
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(0,84,166,0.03) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 w-full max-w-[460px]">
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.app_logo_url ? '' : 'bg-[#0054A6]'}`}>
                {settings.app_logo_url ? (
                  <img src={settings.app_logo_url} alt={settings.app_name} className="w-10 h-10 object-contain rounded-xl" />
                ) : (
                  <HomeModernIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{settings.app_name}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sistem Manajemen RT</p>
          </div>

          {/* Desktop logo badge */}
          <div className="hidden lg:flex items-center gap-2.5 mb-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${settings.app_logo_url ? '' : 'bg-[#0054A6]'}`}>
              {settings.app_logo_url ? (
                <img src={settings.app_logo_url} alt={settings.app_name} className="w-10 h-10 object-contain rounded-xl" />
              ) : (
                <HomeModernIcon className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{settings.app_name}</span>
          </div>

          {/* Header */}
          <div className="mb-7">
            <h2 className="text-[2rem] font-bold text-[#0F172A] dark:text-gray-100 leading-tight">
              Selamat Datang!
            </h2>
            <p className="mt-2 text-[0.95rem] text-[#64748B] dark:text-gray-400">
              Masuk untuk melanjutkan ke {settings.app_name}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E2E8F0] dark:border-gray-700 p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            {step === 'phone' && <PhoneStep onSubmitted={handlePhoneSubmitted} />}

            {step === 'otp' && (
              <OtpStep phoneNumber={phoneNumber} onBack={handleBackToPhone} redirectTo={from} />
            )}
          </div>

          {/* Footer */}
          <p className="mt-7 text-center text-[0.8rem] text-[#94A3B8] dark:text-gray-500 leading-relaxed">
            Dengan login, Anda menyetujui{' '}
            <span className="text-[#64748B] dark:text-gray-400">ketentuan penggunaan</span>{' '}
            {settings.app_name}.
          </p>
        </div>
      </div>
    </div>
  );
}
