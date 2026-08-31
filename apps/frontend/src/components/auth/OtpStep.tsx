import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { otpSchema, type OtpFormData } from '@/lib/validations/auth';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface OtpStepProps {
  phoneNumber: string;
  onBack: () => void;
  redirectTo: string;
}

const OTP_COOLDOWN_SECONDS = 60;

export function OtpStep({ phoneNumber, onBack, redirectTo }: OtpStepProps) {
  const { verifyOtp, requestOtp } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState('');
  const [cooldown, setCooldown] = useState(OTP_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Countdown timer untuk resend OTP
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto focus OTP input
  useEffect(() => {
    setFocus('otp');
  }, [setFocus]);

  async function onSubmit(data: OtpFormData) {
    setServerError('');
    try {
      await verifyOtp(phoneNumber, data.otp);
      navigate(redirectTo, { replace: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Kode OTP salah atau sudah kedaluwarsa.';
      setServerError(message);
    }
  }

  async function handleResendOtp() {
    setIsResending(true);
    setServerError('');
    try {
      await requestOtp(phoneNumber);
      setCooldown(OTP_COOLDOWN_SECONDS);
      // Restart countdown
      intervalRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setServerError('Gagal mengirim ulang OTP. Coba lagi nanti.');
    } finally {
      setIsResending(false);
    }
  }

  // Mask nomor telepon untuk display
  const maskedPhone = phoneNumber.slice(0, 6) + '****' + phoneNumber.slice(-3);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[0.82rem] text-[#64748B] dark:text-gray-400 hover:text-brand-500 dark:hover:text-blue-400 transition-colors duration-200 mb-5 min-h-[44px]"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span>Ganti nomor</span>
      </button>

      {/* Header */}
      <h2 className="text-xl font-bold text-[#0F172A] dark:text-gray-100 mb-1.5">Verifikasi OTP</h2>
      <p className="text-[0.875rem] text-[#64748B] dark:text-gray-400 mb-6 leading-relaxed">
        Kode 6 digit telah dikirim ke{' '}
        <span className="font-medium text-[#374151] dark:text-gray-300">{maskedPhone}</span>
      </p>

      {/* OTP Input */}
      <div className="w-full">
        <label
          htmlFor="otp-input"
          className="block text-[0.875rem] font-medium text-[#374151] dark:text-gray-300 mb-2.5"
        >
          Kode OTP
        </label>
        <input
          id="otp-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className={`
            w-full min-h-[52px] px-4 py-3.5 text-center text-2xl font-mono tracking-[0.5em]
            border rounded-lg
            bg-white dark:bg-gray-800
            text-[#0F172A] dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
            transition-all duration-200
            ${errors.otp ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-[#E2E8F0] dark:border-gray-600'}
          `}
          aria-invalid={errors.otp ? 'true' : 'false'}
          aria-describedby={errors.otp ? 'otp-error' : undefined}
          {...register('otp')}
        />
        {errors.otp && (
          <p id="otp-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.otp.message}
          </p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mt-3 p-3.5 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/30 rounded-xl">
          <p className="text-[0.82rem] text-red-700 dark:text-red-400 leading-relaxed" role="alert">
            {serverError}
          </p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="
          mt-5 w-full min-h-[52px] px-6
          bg-brand-500 hover:bg-brand-600 active:bg-brand-700
          disabled:opacity-55 disabled:cursor-not-allowed
          text-white font-semibold text-[0.95rem]
          rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2
          flex items-center justify-center
        "
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2.5 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Memverifikasi...</span>
          </>
        ) : (
          <span>Verifikasi</span>
        )}
      </button>

      {/* Resend OTP */}
      <div className="mt-6 flex items-center justify-center">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={cooldown > 0 || isResending}
          className="inline-flex items-center gap-1.5 text-[0.82rem] text-brand-500 dark:text-blue-400 hover:text-brand-600 dark:hover:text-blue-300 disabled:text-[#94A3B8] dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px]"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
          <span>
            {cooldown > 0
              ? `Kirim ulang dalam ${cooldown}s`
              : isResending
                ? 'Mengirim...'
                : 'Kirim ulang OTP'}
          </span>
        </button>
      </div>
    </form>
  );
}
