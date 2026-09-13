import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastToastRef = useRef<{ key: string; shownAt: number } | null>(null);
  const sequenceRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const now = Date.now();
      const key = `${type}:${message}`;
      if (lastToastRef.current?.key === key && now - lastToastRef.current.shownAt < 1500) {
        return;
      }

      lastToastRef.current = { key, shownAt: now };
      sequenceRef.current += 1;
      const id = `${now}-${sequenceRef.current}`;
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 left-4 right-4 z-[100] ml-auto max-w-sm space-y-2 sm:left-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const duration = toast.type === 'error' ? 7000 : toast.type === 'info' ? 5000 : 4000;
    const timer = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onRemove, paused]);

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
    error: <ExclamationCircleIcon className="w-5 h-5 text-red-500" />,
    info: <InformationCircleIcon className="w-5 h-5 text-[var(--accent)]" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/30',
    error: 'bg-red-50 dark:bg-red-900/30',
    info: 'bg-[#fffaf0] dark:bg-gray-800',
  };

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`flex items-center gap-3 rounded-[var(--radius-control)] border-2 border-ink px-4 py-3 shadow-[var(--shadow-card)] dark:border-gray-400 animate-[slideIn_0.3s_ease] ${bgColors[toast.type]}`}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">{toast.message}</p>
      <button
        aria-label="Tutup notifikasi"
        onClick={() => onRemove(toast.id)}
        className="text-ink-secondary hover:text-ink min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 focus:outline-none focus:ring-2 focus:ring-ink/30"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast harus digunakan di dalam ToastProvider');
  }
  return context;
}
