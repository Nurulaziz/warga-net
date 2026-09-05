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
        className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border-2 border-ink bg-white text-ink shadow-[2px_2px_0_#171717] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-300 dark:bg-gray-800 dark:text-white dark:shadow-[2px_2px_0_#d4d4d4]"
      >
        <span className="inline-flex items-center justify-center">
          {isDark ? (
            <MoonIcon className="h-[18px] w-[18px] text-brand-500" aria-hidden="true" />
          ) : (
            <SunIcon className="h-[18px] w-[18px] text-accent-orange" aria-hidden="true" />
          )}
        </span>
      </button>
    </div>
  );
};
