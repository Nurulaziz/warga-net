import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { PhoneStep } from '@/components/auth/PhoneStep';
import { OtpStep } from '@/components/auth/OtpStep';
import { HomeModernIcon } from '@heroicons/react/24/outline';

type LoginStep = 'phone' | 'otp';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  const [step, setStep] = useState<LoginStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] dark:bg-gray-900">
        <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full" />
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

  function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={`rounded-xl flex items-center justify-center ${size === 'lg' ? 'w-11 h-11' : 'w-10 h-10'} ${settings.app_logo_url ? '' : 'bg-white/15 backdrop-blur-sm border border-white/20'}`}
        >
          {settings.app_logo_url ? (
            <img
              src={settings.app_logo_url}
              alt={settings.app_name}
              className={`object-contain rounded-xl ${size === 'lg' ? 'w-11 h-11' : 'w-10 h-10'}`}
            />
          ) : (
            <HomeModernIcon className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
          )}
        </div>
        <div>
          <h1
            className={
              size === 'lg'
                ? 'text-xl font-bold tracking-tight'
                : 'text-2xl font-bold text-gray-900 dark:text-gray-100'
            }
          >
            {settings.app_name}
          </h1>
          <p
            className={
              size === 'lg'
                ? 'text-sm text-blue-200/90'
                : 'text-[0.8rem] text-gray-500 dark:text-gray-400'
            }
          >
            Sistem Manajemen RT
          </p>
        </div>
      </div>
    );
  }

  function LegalFooter() {
    return (
      <p className="text-center text-[0.8rem] text-[#94A3B8] dark:text-gray-500 leading-relaxed">
        Dengan melanjutkan, Anda menyetujui{' '}
        <a
          href="#"
          className="text-[#64748B] dark:text-gray-400 hover:text-brand-500 dark:hover:text-blue-400 underline underline-offset-2 transition-colors"
        >
          Ketentuan Penggunaan
        </a>{' '}
        dan{' '}
        <a
          href="#"
          className="text-[#64748B] dark:text-gray-400 hover:text-brand-500 dark:hover:text-blue-400 underline underline-offset-2 transition-colors"
        >
          Kebijakan Privasi
        </a>
        .
      </p>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT PANEL – BRANDING (desktop only) */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[55%] relative text-white flex-col p-12 xl:p-14 overflow-hidden">
        {/* Background: mesh gradient */}
        <div
          className="absolute inset-0 mesh-animate"
          style={{
            background: [
              'radial-gradient(ellipse 80% 60% at 15% 55%, rgba(56,189,248,0.18) 0%, transparent 55%)',
              'radial-gradient(ellipse 60% 50% at 85% 25%, rgba(255,255,255,0.10) 0%, transparent 45%)',
              'radial-gradient(ellipse 50% 70% at 50% 90%, rgba(3,105,161,0.25) 0%, transparent 50%)',
              'linear-gradient(165deg, #0054A6 0%, #003A77 100%)',
            ].join(', '),
          }}
        />

        {/* Geometric dot pattern overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dot-pattern"
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </svg>

        {/* Decorative glassmorphism shapes */}
        <div className="absolute top-[15%] right-[10%] w-72 h-72 rounded-full bg-white/[0.04] blur-2xl" />
        <div className="absolute bottom-[20%] left-[5%] w-56 h-56 rounded-full bg-blue-300/[0.06] blur-3xl" />
        <div className="absolute top-[60%] right-[25%] w-40 h-40 rounded-full bg-white/[0.03] blur-xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div>
            <BrandMark size="lg" />
          </div>

          {/* Headline & Description — grouped naturally */}
          <div className="flex-1 flex flex-col justify-center max-w-[480px] mt-16 mb-16">
            <h2 className="text-4xl xl:text-[2.75rem] font-bold leading-[1.15] mb-5">
              Urusan RT Beres,
              <br />
              Warga Tenang.
            </h2>
            <p className="text-blue-100/85 text-[1.05rem] xl:text-lg leading-[1.65] max-w-[420px]">
              Atur iuran, data warga, dan kegiatan RT dalam satu platform. Cepat, simpel, aman.
            </p>
          </div>

          {/* Subtle bottom accent line */}
          <div className="w-12 h-[2px] bg-white/20 rounded-full" />
        </div>
      </div>

      {/* RIGHT PANEL – LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F7F9FC] dark:bg-gray-900 px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="relative z-10 w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-9">
            <div className="inline-flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.app_logo_url ? '' : 'bg-brand-500'}`}
              >
                {settings.app_logo_url ? (
                  <img
                    src={settings.app_logo_url}
                    alt={settings.app_name}
                    className="w-10 h-10 object-contain rounded-xl"
                  />
                ) : (
                  <HomeModernIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {settings.app_name}
                </h1>
                <p className="text-[0.8rem] text-gray-500 dark:text-gray-400">
                  Sistem Manajemen RT
                </p>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-7">
            <h2 className="text-[1.75rem] sm:text-[2rem] font-bold text-[#172033] dark:text-gray-100 leading-tight">
              Masuk ke WargaNet
            </h2>
            <p className="mt-2 text-[0.9375rem] text-[#667085] dark:text-gray-400">
              Masukkan nomor WhatsApp untuk melanjutkan
            </p>
          </div>

          {/* Mobile — no card */}
          <div className="lg:hidden">
            {step === 'phone' && <PhoneStep onSubmitted={handlePhoneSubmitted} />}

            {step === 'otp' && (
              <OtpStep phoneNumber={phoneNumber} onBack={handleBackToPhone} redirectTo={from} />
            )}
          </div>

          {/* Desktop — card */}
          <div className="hidden lg:block">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#DDE3EA] dark:border-gray-600 p-7 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              {step === 'phone' && <PhoneStep onSubmitted={handlePhoneSubmitted} />}

              {step === 'otp' && (
                <OtpStep phoneNumber={phoneNumber} onBack={handleBackToPhone} redirectTo={from} />
              )}
            </div>
          </div>

          {/* Legal footer — inside form area */}
          <div className="mt-6">
            <LegalFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
