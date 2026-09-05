import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { phoneSchema, type PhoneFormData } from '@/lib/validations/auth';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface PhoneStepProps {
  onSubmitted: (phoneNumber: string) => void;
}

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)}`;
}

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
      if (digits.startsWith('62')) {
        digits = digits.slice(2);
      } else if (digits.startsWith('0')) {
        digits = digits.replace(/^0+/, '');
      }
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
        className="block text-[13px] font-semibold text-ink dark:text-gray-200 mb-2"
      >
        Nomor WhatsApp
      </label>

      {/* Input — one unified control */}
      <div
        className={`
          flex items-center w-full h-11 sm:h-12 rounded-sm border-2 border-ink bg-white shadow-[3px_3px_0_#171717] dark:border-gray-400 dark:bg-gray-800 dark:shadow-[3px_3px_0_#737373]
          focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25
          transition-shadow duration-150
          ${
            hasError
              ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20'
              : 'border-ink dark:border-gray-400'
          }
        `}
      >
        {/* Country code prefix — clickable label focuses input */}
        <label
          htmlFor="phone-input"
          className="flex h-full items-center border-r-2 border-ink bg-warm-50 px-3 select-none cursor-text dark:border-gray-400 dark:bg-gray-700"
        >
          <span className="font-mono text-[15px] font-bold tracking-tight text-ink dark:text-gray-100">+62</span>
        </label>

        {/* Input field */}
        <input
          id="phone-input"
          type="tel"
          inputMode="numeric"
          value={formatPhoneDisplay(rawDigits)}
          onChange={handlePhoneChange}
          placeholder="812 3456 7890"
          className="flex-1 h-full px-3 font-mono text-[15px] font-semibold tracking-tight bg-transparent text-ink dark:text-gray-100 placeholder:font-normal placeholder:text-ink-muted dark:placeholder:text-gray-500 focus:outline-none"
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? 'phone-error' : 'phone-helper'}
          autoComplete="tel"
          autoFocus
        />

        <input type="hidden" {...register('phoneNumber')} />
      </div>

      {/* Error / Helper text */}
      {hasError ? (
        <p
          id="phone-error"
          className="mt-2 text-[12px] text-red-600 dark:text-red-400"
          role="alert"
        >
          {errors.phoneNumber?.message || serverError}
        </p>
      ) : (
        <p id="phone-helper" className="mt-2 text-[12px] text-ink-muted dark:text-gray-500">
          Kode OTP akan dikirim melalui WhatsApp.
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting || !phoneValid}
        className="btn-brutal btn-brutal-primary mt-5 w-full h-11 sm:h-12 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2"
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
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
            <span>Mengirim kode...</span>
          </>
        ) : (
          <>
            <span>Kirim kode OTP</span>
            <ArrowRightIcon className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Help — left-aligned text link */}
      <div className="mt-4">
        <p className="text-[12px] text-ink-muted dark:text-gray-500">
          Butuh bantuan?{' '}
          <span className="font-semibold text-ink-secondary dark:text-gray-400">
            Hubungi Admin RT <span aria-hidden="true">→</span>
          </span>
        </p>
      </div>
    </form>
  );
}
