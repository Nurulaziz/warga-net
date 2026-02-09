import { Card } from '../ui/Card';

interface ProjectStatProps {
  value: string;
  change: string;
  label: string;
  isPositive: boolean;
  barColor: string;
  barHeights: number[];
}

function ProjectStat({ value, change, label, isPositive, barColor, barHeights }: ProjectStatProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <span className={`text-xs font-medium ${isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {change}
            </span>
            <svg
              className={`w-3 h-3 ${isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isPositive ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              )}
            </svg>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-1.5 h-16">
        {barHeights.map((height, index) => (
          <div
            key={index}
            className={`${barColor} w-2 rounded-t transition-all hover:opacity-80`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ProjectsOverview() {
  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Ringkasan Aktivitas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Minggu ini
          </p>
        </div>
        <select className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg border-none focus:ring-2 focus:ring-primary-400 cursor-pointer">
          <option>Minggu ini</option>
          <option>Bulan ini</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-4">
        <ProjectStat
          value="Rp 36.4jt"
          change="+12%"
          label="Total Iuran Bulan Ini"
          isPositive={true}
          barColor="bg-purple-500"
          barHeights={[60, 85, 45, 70, 40, 90, 75]}
        />
        <ProjectStat
          value="78"
          change="+9%"
          label="Transaksi Minggu Ini"
          isPositive={true}
          barColor="bg-primary-500"
          barHeights={[55, 75, 50, 65, 45, 80, 70]}
        />
      </div>
    </Card>
  );
}
