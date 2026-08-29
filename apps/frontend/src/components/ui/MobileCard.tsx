import { type ReactNode } from 'react';

interface MobileCardListProps {
  children: ReactNode;
  className?: string;
}

// Wrapper untuk menampilkan list sebagai cards di mobile
export function MobileCardList({ children, className = '' }: MobileCardListProps) {
  return <div className={`space-y-3 ${className}`}>{children}</div>;
}

interface MobileCardItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCardItem({ children, className = '', onClick }: MobileCardItemProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 ${onClick ? 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface MobileCardFieldProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function MobileCardField({ label, value, className = '' }: MobileCardFieldProps) {
  return (
    <div className={`flex items-center justify-between py-1 ${className}`}>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

// Responsive container: table di desktop, cards di mobile
interface ResponsiveDataViewProps {
  tableView: ReactNode;
  mobileView: ReactNode;
}

export function ResponsiveDataView({ tableView, mobileView }: ResponsiveDataViewProps) {
  return (
    <>
      {/* Table untuk desktop */}
      <div className="hidden md:block">{tableView}</div>
      {/* Cards untuk mobile */}
      <div className="md:hidden">{mobileView}</div>
    </>
  );
}
