import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  iconBgColor?: string;
}

export function StatCard({ icon, value, label, iconBgColor = 'bg-primary-500' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-200 hover:scale-105">
      {/* Icon container */}
      <div className={`${iconBgColor} p-3 rounded-lg flex items-center justify-center w-fit mb-3`}>
        <div className="w-6 h-6 text-white">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {label}
        </p>
      </div>
    </div>
  );
}
