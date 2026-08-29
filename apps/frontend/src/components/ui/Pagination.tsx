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
  // Label satuan data, mis. "warga", "tagihan"
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
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 ${className}`}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total: {total} {itemLabel}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-gray-500 dark:text-gray-400">
            Tampilkan
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Sebelumnya
        </Button>
        <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          Halaman {page} dari {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  );
}
