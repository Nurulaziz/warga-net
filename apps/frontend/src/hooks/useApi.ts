import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// Hook untuk fetch data dengan pagination
export function usePaginatedApi<T>(endpoint: string, params?: Record<string, string | number>) {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Gunakan ref untuk params supaya tidak trigger infinite loop
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.get<PaginatedResponse<T>>(endpoint, { params: paramsRef.current });
      setData(res.data);
      setMeta(res.meta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Re-fetch ketika params berubah (shallow compare via JSON)
  const paramsKey = JSON.stringify(params);
  useEffect(() => {
    fetchData();
  }, [fetchData, paramsKey]);

  return { data, meta, loading, error, refetch: fetchData };
}

// Helper untuk API calls
export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const { data } = await api.post<T>(endpoint, body);
  return data;
}

export async function apiPut<T>(endpoint: string, body: unknown): Promise<T> {
  const { data } = await api.put<T>(endpoint, body);
  return data;
}

export async function apiDelete(endpoint: string): Promise<void> {
  await api.delete(endpoint);
}
