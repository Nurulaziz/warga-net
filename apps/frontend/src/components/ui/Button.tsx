import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Base styles - minimum 44x44px touch target
    const baseStyles =
      'inline-flex items-center justify-center font-bold uppercase tracking-[0.04em] rounded-sm border-2 border-ink dark:border-gray-300 shadow-[3px_3px_0_#171717] dark:shadow-[3px_3px_0_#d4d4d4] transition-[transform,box-shadow,background-color] duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#171717] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

    // Variant styles dengan high contrast dan dark mode support
    const variantStyles = {
      primary:
        'bg-brand-500 text-white hover:bg-brand-600 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
      secondary:
        'bg-white text-ink hover:bg-warm-100 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
      ghost:
        'bg-transparent text-gray-700 shadow-none border-transparent hover:border-ink hover:bg-white focus:ring-gray-500 dark:text-gray-200 dark:hover:bg-gray-800',
    };

    // Size styles - minimum 44x44px untuk mobile
    const sizeStyles = {
      sm: 'min-h-[44px] px-4 py-2 text-sm',
      md: 'min-h-[44px] px-6 py-3 text-base',
      lg: 'min-h-[48px] px-8 py-4 text-lg',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5"
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
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
