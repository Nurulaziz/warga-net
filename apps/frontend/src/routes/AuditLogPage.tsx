import { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { usePaginatedApi } from '@/hooks/useApi';
import { api } from '@/services/api';

interface AuditLog {
  id: string;
  action: string;
  resource: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: { id: string; fullName: string; phoneNumber: string } | null;
}

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [actionFilter, setActionFilter] = useState('');
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    api.get('/audit-logs/actions').then((res) => setActions(res.data)).catch(() => {});
  }, []);

  const { data: logs, meta, loading } = usePaginatedApi<AuditLog>('/audit-logs', { page, limit: pageSize, ...(actionFilter && { action: actionFilter }) });

  // Ubah jumlah per halaman & kembali ke halaman 1
  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Audit Log</h1>

      {/* Filter aksi */}
      <FilterBar>
        <FilterSelect value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Aksi</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><TableCell className="text-center py-8 text-gray-500" colSpan={5}>Belum ada log aktivitas</TableCell></TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                    <TableCell>{log.user?.fullName || '-'}</TableCell>
                    <TableCell>
                      <span className="inline-flex px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>{log.resource || '-'}</TableCell>
                    <TableCell className="text-sm font-mono">{log.ipAddress}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {meta.total > 0 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              itemLabel="log"
            />
          )}
        </>
      )}
    </div>
  );
}
