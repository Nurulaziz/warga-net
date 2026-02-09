import { StatsGrid, FinancialSummary, ProjectsOverview } from '../components/dashboard';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Selamat datang di WargaNet
          </p>
        </div>

        {/* Stats Grid */}
        <StatsGrid />

        {/* Financial Summary & Projects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FinancialSummary />
          <ProjectsOverview />
        </div>
      </div>
    </div>
  );
}
