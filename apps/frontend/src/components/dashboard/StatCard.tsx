import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  iconBgColor?: string;
  valueClassName?: string;
  badge?: { text: string; className: string };
  to?: string;
}

export function StatCard({ icon, value, label, valueClassName = '', badge, to }: StatCardProps) {
  const content = (
    <>
      {/* Icon container */}
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm border-2 border-ink bg-[#f1dfc4] dark:border-gray-500 dark:bg-gray-700">
        <div className="h-6 w-6 text-ink dark:text-white">{icon}</div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <p
          className={`font-display text-2xl font-bold text-ink dark:text-gray-100 ${valueClassName}`}
        >
          {value}
          {badge && (
            <span
              className={`ml-2 inline-block align-middle px-2 py-0.5 text-[11px] font-semibold rounded-full ${badge.className}`}
            >
              {badge.text}
            </span>
          )}
        </p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      </div>
    </>
  );

  const baseClass =
    'rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-card)] p-5 shadow-[var(--shadow-card)] transition-[transform,background-color] duration-150 dark:border-gray-400';

  if (to) {
    return (
      <Link
        to={to}
        className={`${baseClass} cursor-pointer hover:-translate-y-0.5 hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-ink/30 focus:ring-offset-2`}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
