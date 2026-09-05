import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { useSettings } from '@/hooks/useSettings';
import { router } from './routes';

// Judul dasar (fallback) untuk halaman non-layout.
// Halaman ber-layout menimpanya lewat useDocumentTitle (judul per-halaman).
function DynamicTitle() {
  const { settings } = useSettings();

  useEffect(() => {
    document.title = `${settings.app_name} - Sistem Manajemen RT`;
  }, [settings.app_name]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <DynamicTitle />
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
