import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'utility';
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
    ref,
  ) => {
    const isUtility = variant === 'utility';

    // Base styles - minimum 44x44px touch target
    const baseStyles = isUtility
      ? 'inline-flex items-center justify-center font-medium tracking-normal rounded-[var(--radius-control)] border border-edge-subtle dark:border-gray-600 shadow-none transition-[background-color,border-color] duration-150 hover:bg-warm-100 hover:border-ink focus:outline-none focus:ring-2 focus:ring-ink/30 focus:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed'
      : 'inline-flex items-center justify-center font-bold uppercase tracking-[0.04em] rounded-[var(--radius-control)] border-2 border-ink dark:border-gray-300 shadow-[var(--shadow-small)] transition-[transform,box-shadow,background-color] duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-ink/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

    // Variant styles dengan high contrast dan dark mode support
    const variantStyles = {
      primary: 'bg-[var(--accent)] text-white hover:brightness-90',
      secondary:
        'bg-white text-ink hover:bg-warm-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
      danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
      ghost:
        'bg-transparent text-gray-700 shadow-none border-transparent hover:border-ink hover:bg-white dark:text-gray-200 dark:hover:bg-gray-800',
      utility:
        'bg-transparent text-ink-secondary hover:text-ink dark:text-gray-400 dark:hover:text-gray-200',
    };

    // Size styles - minimum 44x44px untuk mobile (utility uses compact sizes)
    const sizeStyles = isUtility
      ? {
          sm: 'h-8 px-3 text-xs',
          md: 'h-9 px-4 text-sm',
          lg: 'h-10 px-5 text-sm',
        }
      : {
          sm: 'min-h-[var(--control-height)] px-[var(--control-padding-x)] py-2 text-sm',
          md: 'min-h-[var(--control-height)] px-[calc(var(--control-padding-x)*1.5)] py-2 text-base',
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
  },
);

Button.displayName = 'Button';
