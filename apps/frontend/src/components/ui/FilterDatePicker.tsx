import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDaysIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

interface FilterDatePickerProps {
  mode?: 'date' | 'month';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

function twoDigits(value: number) {
  return String(value).padStart(2, '0');
}

function toDateValue(year: number, month: number, day: number) {
  return `${year}-${twoDigits(month + 1)}-${twoDigits(day)}`;
}

export function FilterDatePicker({ mode = 'date', value, onChange, placeholder, className = '', 'aria-label': ariaLabel }: FilterDatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = value ? new Date(`${value}${mode === 'month' ? '-01' : ''}T00:00:00`) : new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const days = useMemo(() => {
    const count = new Date(viewYear, viewMonth + 1, 0).getDate();
    const mondayOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    return [...Array(mondayOffset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [viewMonth, viewYear]);

  const display = value
    ? mode === 'month'
      ? `${MONTHS[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`
      : new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : placeholder || (mode === 'month' ? 'Pilih periode' : 'Pilih tanggal');

  function moveMonth(step: number) {
    const next = new Date(viewYear, viewMonth + step, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <div ref={rootRef} className={`relative min-w-[180px] ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-11 w-full items-center gap-2 rounded-sm border-2 border-ink bg-white px-3 text-left text-sm font-bold text-ink transition-all focus:outline-none focus:ring-2 focus:ring-ink/25 dark:border-gray-500 dark:bg-gray-800 dark:text-white ${open ? 'translate-x-0.5 translate-y-0.5 bg-[#fff8ec] shadow-none' : 'shadow-[2px_2px_0_#171717] hover:bg-[#fff8ec]'}`}
      >
        <CalendarDaysIcon className="h-4 w-4 flex-none text-ink" />
        <span className={`min-w-0 flex-1 truncate ${value ? '' : 'text-ink-secondary'}`}>{display}</span>
      </button>

      {open && (
        <div role="dialog" aria-label={ariaLabel || 'Pilih tanggal'} className="absolute left-0 z-50 mt-2 w-[292px] rounded-sm border-2 border-ink bg-[#fffdf8] p-3 text-ink shadow-[4px_4px_0_#171717] dark:border-gray-500 dark:bg-gray-800 dark:text-white">
          <div className="mb-3 flex items-center justify-between border-b-2 border-ink pb-2 dark:border-gray-500">
            <button type="button" onClick={() => mode === 'month' ? setViewYear((year) => year - 1) : moveMonth(-1)} aria-label={mode === 'month' ? 'Tahun sebelumnya' : 'Bulan sebelumnya'} className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink bg-white hover:bg-[#f1dfc4] dark:bg-gray-700"><ChevronLeftIcon className="h-4 w-4" /></button>
            <p className="font-mono text-xs font-black uppercase tracking-wide">{mode === 'month' ? viewYear : `${MONTHS[viewMonth]} ${viewYear}`}</p>
            <button type="button" onClick={() => mode === 'month' ? setViewYear((year) => year + 1) : moveMonth(1)} aria-label={mode === 'month' ? 'Tahun berikutnya' : 'Bulan berikutnya'} className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink bg-white hover:bg-[#f1dfc4] dark:bg-gray-700"><ChevronRightIcon className="h-4 w-4" /></button>
          </div>

          {mode === 'month' ? (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((month, index) => {
                const optionValue = `${viewYear}-${twoDigits(index + 1)}`;
                const selected = optionValue === value;
                return <button key={month} type="button" onClick={() => { onChange(optionValue); setOpen(false); }} className={`relative min-h-10 rounded-sm border px-2 text-xs font-bold ${selected ? 'border-ink bg-[#f1dfc4] shadow-[2px_2px_0_#171717]' : 'border-transparent hover:border-ink hover:bg-[#fff8ec]'}`}>{month.slice(0, 3)}{selected && <CheckIcon className="absolute right-1 top-1 h-3 w-3" />}</button>;
              })}
            </div>
          ) : (
            <>
              <div className="mb-1 grid grid-cols-7 gap-1">{WEEKDAYS.map((day) => <span key={day} className="py-1 text-center font-mono text-[9px] font-bold uppercase text-ink-secondary">{day}</span>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => day ? (() => {
                  const optionValue = toDateValue(viewYear, viewMonth, day);
                  const selected = optionValue === value;
                  return <button key={optionValue} type="button" onClick={() => { onChange(optionValue); setOpen(false); }} className={`flex h-8 items-center justify-center rounded-sm text-xs font-bold ${selected ? 'border border-ink bg-[#f1dfc4] shadow-[1px_1px_0_#171717]' : 'hover:bg-[#fff8ec]'}`}>{day}</button>;
                })() : <span key={`blank-${index}`} />)}
              </div>
            </>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-ink pt-2">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="inline-flex min-h-8 items-center gap-1 px-2 text-xs font-bold text-ink-secondary hover:text-ink"><XMarkIcon className="h-3.5 w-3.5" /> Bersihkan</button>
            <button type="button" onClick={() => { const today = new Date(); onChange(mode === 'month' ? `${today.getFullYear()}-${twoDigits(today.getMonth() + 1)}` : toDateValue(today.getFullYear(), today.getMonth(), today.getDate())); setOpen(false); }} className="rounded-sm border border-ink bg-white px-2 py-1 text-xs font-bold hover:bg-[#f1dfc4] dark:bg-gray-700">{mode === 'month' ? 'Bulan ini' : 'Hari ini'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
