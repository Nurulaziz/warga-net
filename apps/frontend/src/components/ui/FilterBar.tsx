import {
  Children,
  isValidElement,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type InputHTMLAttributes,
  forwardRef,
} from 'react';
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon, QueueListIcon } from '@heroicons/react/24/outline';
import { useDismissibleLayer } from '@/hooks/useDismissibleLayer';

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
      <div className={`relative flex h-11 overflow-hidden rounded-sm border-2 border-ink bg-white text-ink shadow-[2px_2px_0_#171717] transition-colors focus-within:bg-[#fff8ec] focus-within:ring-2 focus-within:ring-ink/20 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:shadow-[2px_2px_0_#a3a3a3] ${className || 'w-full sm:w-72'}`}>
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-gray-400" />
        <input
          ref={ref}
          type="text"
          className="h-full min-w-0 flex-1 border-0 bg-transparent pl-9 pr-3 font-body text-sm text-ink outline-none placeholder:text-ink/55 dark:text-gray-100 dark:placeholder:text-gray-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch?.();
            onKeyDown?.(e);
          }}
          {...props}
        />
        {onSearch && (
          <button
            type="button"
            aria-label="Cari"
            onClick={onSearch}
            className="flex h-full w-11 flex-none items-center justify-center border-l-2 border-ink bg-[#fffdf8] transition-colors hover:bg-[#f1dfc4] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ink/30 dark:border-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

// Dropdown filter dengan gaya seragam
interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  icon?: ReactNode;
}

export const FilterSelect = forwardRef<HTMLSelectElement, FilterSelectProps>(
  ({ children, className = '', value, defaultValue, onChange, disabled, id, name, icon, 'aria-label': ariaLabel }, forwardedRef) => {
    const selectRef = useRef<HTMLSelectElement>(null);
    const [open, setOpen] = useState(false);
    const { rootRef, triggerRef } = useDismissibleLayer(open, () => setOpen(false));
    const [activeIndex, setActiveIndex] = useState(0);
    useImperativeHandle(forwardedRef, () => selectRef.current as HTMLSelectElement);

    const options = Children.toArray(children)
      .filter(isValidElement)
      .map((option) => ({
        value: String((option.props as { value?: string | number }).value ?? ''),
        label: (option.props as { children?: ReactNode }).children,
        disabled: Boolean((option.props as { disabled?: boolean }).disabled),
      }));
    const selectedValue = String(value ?? defaultValue ?? '');
    const selected = options.find((option) => option.value === selectedValue) ?? options[0];

    function selectOption(nextValue: string) {
      if (disabled) return;
      onChange?.({
        target: { value: nextValue },
        currentTarget: { value: nextValue },
      } as ChangeEvent<HTMLSelectElement>);
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      if (disabled) return;
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!open) setOpen(true);
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex((index) => (index + step + options.length) % options.length);
      } else if ((event.key === 'Enter' || event.key === ' ') && open) {
        event.preventDefault();
        const option = options[activeIndex];
        if (option && !option.disabled) selectOption(option.value);
      }
    }

    return (
      <div ref={rootRef} className={`relative min-w-[168px] ${className}`}>
        <select ref={selectRef} id={id} name={name} value={selectedValue} onChange={onChange} disabled={disabled} tabIndex={-1} aria-hidden="true" className="sr-only">
          {children}
        </select>
        <button
          ref={triggerRef}
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => {
            setActiveIndex(Math.max(0, options.findIndex((option) => option.value === selectedValue)));
            setOpen((current) => !current);
          }}
          onKeyDown={handleKeyDown}
          className={`flex h-11 w-full items-center gap-2 rounded-sm border-2 border-ink bg-white px-3 text-left text-sm font-bold text-ink transition-all focus:outline-none focus:ring-2 focus:ring-ink/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100 ${open ? 'translate-x-0.5 translate-y-0.5 bg-[#fff8ec] shadow-none' : 'shadow-[2px_2px_0_#171717] hover:bg-[#fff8ec]'}`}
        >
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-sm border border-ink bg-[#f1dfc4] text-ink">
            {icon || <QueueListIcon className="h-3.5 w-3.5" />}
          </span>
          <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
          <ChevronDownIcon className={`h-4 w-4 flex-none transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div role="listbox" aria-label={ariaLabel || 'Pilihan filter'} className="absolute left-0 z-50 mt-2 max-h-64 min-w-full overflow-y-auto rounded-sm border-2 border-ink bg-[#fffdf8] p-1 shadow-[4px_4px_0_#171717] dark:border-gray-500 dark:bg-gray-800">
            {options.map((option, index) => {
              const isSelected = option.value === selectedValue;
              return (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option.value)}
                  className={`flex min-h-10 w-full items-center gap-2 rounded-sm border px-3 text-left text-sm font-semibold transition-colors disabled:opacity-40 ${isSelected ? 'border-ink bg-[#f1dfc4] font-black text-ink shadow-[1px_1px_0_#171717]' : index === activeIndex ? 'border-transparent bg-[#fff8ec] text-ink dark:bg-gray-700 dark:text-white' : 'border-transparent text-ink hover:bg-[#fff8ec] dark:text-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected && <CheckIcon className="h-4 w-4 flex-none" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);
FilterSelect.displayName = 'FilterSelect';
