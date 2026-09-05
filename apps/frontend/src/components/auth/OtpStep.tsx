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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted dark:text-gray-400 hover:text-brand-500 dark:hover:text-blue-400 transition-colors duration-200 mb-5 min-h-[44px]"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        <span>Ganti nomor</span>
      </button>

      {/* Label */}
      <label
        htmlFor="otp-input"
        className="block text-[13px] font-semibold text-ink dark:text-gray-200 mb-2"
      >
        Kode OTP
      </label>

      {/* OTP Input */}
      <input
        id="otp-input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        className={`
          w-full h-11 sm:h-12 px-4 text-center text-2xl font-mono tracking-[0.5em]
          rounded-sm border-2 bg-white dark:bg-gray-800
          text-ink dark:text-gray-100
          focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25
          transition-shadow duration-150
          ${errors.otp ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-edge-default dark:border-white/25'}
        `}
        aria-invalid={errors.otp ? 'true' : 'false'}
        aria-describedby={errors.otp ? 'otp-error' : undefined}
        {...register('otp')}
      />
      {errors.otp && (
        <p id="otp-error" className="mt-2 text-[12px] text-red-600 dark:text-red-400" role="alert">
          {errors.otp.message}
        </p>
      )}

      {/* Server error — small red text, no alert card */}
      {serverError && (
        <p className="mt-2 text-[12px] text-red-600 dark:text-red-400" role="alert">
          {serverError}
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-brutal btn-brutal-primary mt-5 w-full h-11 sm:h-12 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2"
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
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
      <div className="mt-6 flex items-center justify-start">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={cooldown > 0 || isResending}
          className="inline-flex items-center gap-1.5 text-[12px] text-brand-500 dark:text-blue-400 hover:text-brand-600 dark:hover:text-blue-300 disabled:text-ink-muted dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px]"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
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
