import { type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes, forwardRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Toolbar pembungkus search + filter agar sejajar & rapi (tinggi seragam 44px)
export function FilterBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 mb-4 ${className}`}>
      {children}
    </div>
  );
}

// Input pencarian dengan ikon di dalam, lebar tetap, tinggi seragam
interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  onSearch?: () => void;
  className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onKeyDown, className = '', ...props }, ref) => {
    return (
      <div className={`relative ${className || 'w-full sm:w-72'}`}>
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={ref}
          type="text"
          className="w-full h-11 pl-9 pr-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch?.();
            onKeyDown?.(e);
          }}
          {...props}
        />
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

// Dropdown filter dengan gaya & tinggi seragam
interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export const FilterSelect = forwardRef<HTMLSelectElement, FilterSelectProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`h-11 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);
FilterSelect.displayName = 'FilterSelect';
