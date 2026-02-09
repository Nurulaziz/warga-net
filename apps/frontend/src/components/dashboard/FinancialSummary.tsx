import { Card } from '../ui/Card';

export function FinancialSummary() {
  // Data untuk chart (12 bulan)
  const chartData = [
    { month: 'Jan', income: 3200000, expense: 450000 },
    { month: 'Feb', income: 2800000, expense: 380000 },
    { month: 'Mar', income: 3100000, expense: 420000 },
    { month: 'Apr', income: 3400000, expense: 460000 },
    { month: 'May', income: 3600000, expense: 490000 },
    { month: 'Jun', income: 3300000, expense: 440000 },
    { month: 'Jul', income: 3500000, expense: 470000 },
    { month: 'Aug', income: 3400000, expense: 450000 },
    { month: 'Sep', income: 2900000, expense: 390000 },
    { month: 'Oct', income: 2700000, expense: 360000 },
    { month: 'Nov', income: 3200000, expense: 430000 },
    { month: 'Dec', income: 3100000, expense: 410000 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.income));
  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Ringkasan Keuangan
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tahun 2025
          </p>
        </div>
        <select className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg border-none focus:ring-2 focus:ring-primary-400 cursor-pointer">
          <option>Tahun 2025</option>
          <option>Tahun 2024</option>
        </select>
      </div>

      {/* Legend dengan total */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-sm bg-primary-500 mt-1 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Pemasukan</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Rp {(totalIncome / 1000000).toFixed(1)}jt
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-sm bg-red-500 mt-1 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Rp {(totalExpense / 1000000).toFixed(1)}jt
            </p>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="relative">
        {/* Chart area */}
        <div className="flex items-end justify-between gap-1 h-48 mb-2">
          {chartData.map((data, index) => {
            const incomeHeight = (data.income / maxValue) * 100;
            const expenseHeight = (data.expense / maxValue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                {/* Bars container */}
                <div className="w-full flex flex-col items-center gap-1 h-full justify-end">
                  {/* Income bar */}
                  <div className="relative w-full">
                    <div
                      className="w-full bg-primary-500 rounded-t transition-all duration-300 group-hover:bg-primary-600"
                      style={{ height: `${incomeHeight * 1.8}px` }}
                      title={`${data.month}: Rp ${(data.income / 1000000).toFixed(1)}jt`}
                    />
                  </div>
                  {/* Expense bar */}
                  <div className="relative w-full">
                    <div
                      className="w-full bg-red-500 rounded-b transition-all duration-300 group-hover:bg-red-600"
                      style={{ height: `${expenseHeight * 1.8}px` }}
                      title={`${data.month}: Rp ${(data.expense / 1000000).toFixed(1)}jt`}
                    />
                  </div>
                </div>
                {/* Month label */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {data.month}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Saldo</span>
          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
            Rp {((totalIncome - totalExpense) / 1000000).toFixed(1)}jt
          </span>
        </div>
      </div>
    </Card>
  );
}
