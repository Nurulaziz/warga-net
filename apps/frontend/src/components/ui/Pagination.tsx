import { Button } from './Button';

// Opsi jumlah data per halaman
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemLabel?: string;
  pageSizeOptions?: readonly number[];
  className?: string;
}

// Kontrol pagination: pilih jumlah per halaman + navigasi halaman
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'data',
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className = '',
}: PaginationProps) {
  const navClass = (enabled: boolean) =>
    enabled
      ? 'border-2 border-ink !bg-[#f1dfc4] font-bold !text-ink shadow-[2px_2px_0_#171717] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:!bg-[#e6d2b5] hover:!text-ink hover:shadow-none dark:border-gray-300 dark:!bg-[#d8c4a6] dark:!text-ink'
      : 'border-2 border-ink/50 !bg-[#eee4d4] font-bold !text-gray-700 opacity-100 shadow-none dark:border-gray-500 dark:!bg-gray-700 dark:!text-gray-200';

  return (
    <div
      className={`mt-4 flex flex-col gap-3 border-t-2 border-ink pt-4 dark:border-gray-400 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      {/* Left: total + page size */}
      <div className="flex items-center gap-3">
        <p className="text-xs font-bold text-ink dark:text-gray-200">
          {total} {itemLabel}
        </p>
        <div className="flex items-center gap-1.5">
          <label htmlFor="page-size" className="text-xs font-bold text-ink dark:text-gray-200">
            Tampilkan
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-sm border-2 border-ink bg-white px-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink/30 dark:border-gray-300 dark:bg-gray-800 dark:text-gray-100"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: page navigation */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="utility"
          size="sm"
          className={navClass(page > 1)}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Sebelumnya
        </Button>
        <span className="px-2 text-xs font-bold text-ink dark:text-gray-200 tabular-nums">
          {page}/{Math.max(totalPages, 1)}
        </span>
        <Button
          variant="utility"
          size="sm"
          className={navClass(page < totalPages)}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Selanjutnya →
        </Button>
      </div>
    </div>
  );
}
