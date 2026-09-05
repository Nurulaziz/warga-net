import {
  type ReactNode,
  type SelectHTMLAttributes,
  type InputHTMLAttributes,
  forwardRef,
} from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Toolbar pembungkus search + filter agar sejajar & rapi
export function FilterBar({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-wrap items-center gap-3 mb-5 ${className}`}>{children}</div>;
}

// Input pencarian dengan ikon di dalam — menyatu dengan desain WargaNet
interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  onSearch?: () => void;
  className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onKeyDown, className = '', ...props }, ref) => {
    return (
      <div className={`relative ${className || 'w-full sm:w-72'}`}>
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input
          ref={ref}
          type="text"
          className="w-full h-10 pl-9 pr-3 text-sm font-body border-2 border-ink dark:border-gray-500 rounded-sm bg-white dark:bg-gray-800 text-ink dark:text-gray-100 placeholder:text-ink/60 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20"
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

// Dropdown filter dengan gaya seragam
interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export const FilterSelect = forwardRef<HTMLSelectElement, FilterSelectProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`h-10 px-3 pr-8 text-sm font-semibold border-2 border-ink dark:border-gray-500 rounded-sm bg-white dark:bg-gray-800 text-ink dark:text-gray-300 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23171717%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22/%3E%3C/svg%3E')] bg-[length:20px] bg-[right_4px_center] bg-no-repeat ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);
FilterSelect.displayName = 'FilterSelect';
