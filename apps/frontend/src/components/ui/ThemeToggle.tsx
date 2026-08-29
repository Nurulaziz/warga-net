import { useTheme } from '@/hooks/useTheme';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';

interface ThemeToggleProps {
  // Tampilkan label teks di samping switch
  showLabel?: boolean;
}

export const ThemeToggle = ({ showLabel = false }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-[13px] font-medium text-[#64748B] dark:text-gray-400">
          {isDark ? 'Mode Gelap' : 'Mode Terang'}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        title="Ubah Tema"
        aria-label={`Ubah ke mode ${isDark ? 'terang' : 'gelap'}`}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#0054A6] focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
          isDark ? 'bg-[#0054A6]' : 'bg-gray-300'
        }`}
      >
        {/* Knob dengan ikon kontekstual */}
        <span
          className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ${
            isDark ? 'translate-x-[22px]' : 'translate-x-[2px]'
          }`}
        >
          {isDark ? (
            <MoonIcon className="h-3 w-3 text-[#0054A6]" aria-hidden="true" />
          ) : (
            <SunIcon className="h-3 w-3 text-amber-500" aria-hidden="true" />
          )}
        </span>
      </button>
    </div>
  );
};
