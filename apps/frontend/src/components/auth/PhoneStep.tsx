import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { phoneSchema, type PhoneFormData } from '@/lib/validations/auth';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface PhoneStepProps {
  onSubmitted: (phoneNumber: string) => void;
}

// Format nomor: 812 3456 7890
function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)}`;
}

// Cek apakah nomor cukup panjang (minimal 9 digit setelah +62)
function isPhoneValid(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 13;
}

export function PhoneStep({ onSubmitted }: PhoneStepProps) {
  const { requestOtp } = useAuth();
  const [serverError, setServerError] = useState('');
  const [rawDigits, setRawDigits] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: '+62' },
  });

  const phoneValid = isPhoneValid(rawDigits);

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let digits = e.target.value.replace(/\D/g, '');

      // Normalisasi: hilangkan prefix yang salah agar +62 tidak dobel
      // "62812..." -> "812...", "0812..." -> "812..."
      if (digits.startsWith('62')) {
        digits = digits.slice(2);
      } else if (digits.startsWith('0')) {
        digits = digits.replace(/^0+/, '');
      }

      // Limit ke 13 digit (panjang wajar nomor Indonesia tanpa prefix)
      digits = digits.slice(0, 13);

      setRawDigits(digits);
      setValue('phoneNumber', `+62${digits}`, { shouldValidate: digits.length >= 9 });
    },
    [setValue],
  );

  async function onSubmit(data: PhoneFormData) {
    setServerError('');
    try {
      await requestOtp(data.phoneNumber);
      onSubmitted(data.phoneNumber);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal mengirim OTP. Coba lagi nanti.';
      setServerError(message);
    }
  }

  const hasError = !!errors.phoneNumber || !!serverError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Label */}
      <label
        htmlFor="phone-input"
        className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200 mb-2"
      >
        Nomor WhatsApp
      </label>

      {/* Unified phone input field */}
      <div
        className={`
          flex items-center w-full h-[52px] rounded-lg border bg-white dark:bg-gray-800 overflow-hidden transition-all duration-200
          focus-within:ring-[3px] focus-within:border-brand-500
          ${
            hasError
              ? 'border-red-400 focus-within:ring-red-500/15 focus-within:border-red-500'
              : 'border-[#D1D5DB] dark:border-gray-600 focus-within:ring-brand-500/12'
          }
        `}
      >
        {/* Country code prefix */}
        <div className="flex items-center pl-4 pr-3 select-none">
          <span className="text-[0.9rem] font-semibold text-[#1E293B] dark:text-gray-200">+62</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[#E2E8F0] dark:bg-gray-600 flex-shrink-0" />

        {/* Input field */}
        <input
          id="phone-input"
          type="tel"
          inputMode="numeric"
          value={formatPhoneDisplay(rawDigits)}
          onChange={handlePhoneChange}
          placeholder="812 3456 7890"
          className="flex-1 h-full px-3 text-[1rem] tracking-wide bg-transparent text-[#172033] dark:text-gray-100 placeholder:text-[#94A3B8] dark:placeholder:text-gray-500 focus:outline-none"
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? 'phone-error' : 'phone-helper'}
          autoComplete="tel"
        />

        {/* Hidden input untuk react-hook-form */}
        <input type="hidden" {...register('phoneNumber')} />
      </div>

      {/* Error / Helper text */}
      {hasError ? (
        <p
          id="phone-error"
          className="mt-2 text-[0.8rem] text-red-600 dark:text-red-400"
          role="alert"
        >
          {errors.phoneNumber?.message || serverError}
        </p>
      ) : (
        <p id="phone-helper" className="mt-2 text-[0.8rem] text-[#64748B] dark:text-gray-500">
          Kode OTP akan dikirim via WhatsApp ke nomor ini
        </p>
      )}

      {/* Submit button — disabled sampai nomor valid */}
      <button
        type="submit"
        disabled={isSubmitting || !phoneValid}
        className={`
          mt-5 w-full h-[52px] px-6 font-semibold text-[0.95rem] rounded-lg transition-all duration-200
          focus:outline-none focus:ring-[3px] focus:ring-brand-500/25 focus:ring-offset-2
          flex items-center justify-center gap-2
          ${
            phoneValid && !isSubmitting
              ? 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm'
              : 'border-2 border-brand-500/25 text-brand-500/40 dark:text-brand-400/40 bg-transparent cursor-not-allowed'
          }
        `}
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
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
            <span>Mengirim OTP...</span>
          </>
        ) : (
          <>
            <span>Kirim Kode OTP</span>
            <ArrowRightIcon className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Help */}
      <div className="mt-4 text-center">
        <p className="text-[0.8rem] text-[#667085] dark:text-gray-500">
          Butuh bantuan?{' '}
          <span className="font-semibold text-[#475467] dark:text-gray-400 underline underline-offset-2 decoration-[#475467]/30 dark:decoration-gray-400/30">
            Hubungi Admin RT
          </span>
        </p>
      </div>
    </form>
  );
}
