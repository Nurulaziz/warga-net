import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { MobileNavigation } from './MobileNavigation';
import { DesktopNavigation } from './DesktopNavigation';
import { Breadcrumb } from './Breadcrumb';
import { ImpersonationBanner } from '@/components/ui/ImpersonationBanner';
import { AnnouncementPopup } from '@/components/announcements/AnnouncementPopup';

export function ResponsiveLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Set judul tab browser sesuai halaman aktif
  useDocumentTitle();

  return (
    <div className="app-paper min-h-screen font-body dark:bg-gray-900">
      {/* Banner impersonation — tampil di atas semua konten */}
      <ImpersonationBanner />

      {/* Popup pengumuman terbaru saat pertama membuka web */}
      <AnnouncementPopup />

      {/* Desktop: Sidebar Navigation */}
      {!isMobile && (
        <DesktopNavigation
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          min-h-screen transition-all duration-300
          ${isMobile ? 'pb-16' : sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-[230px]'}
        `}
      >
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Breadcrumb />
          <Outlet />
        </div>
      </main>

      {/* Mobile: Bottom Navigation */}
      {isMobile && <MobileNavigation />}
    </div>
  );
}
