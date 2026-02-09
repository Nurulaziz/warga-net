import { Outlet } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MobileNavigation } from './MobileNavigation';
import { DesktopNavigation } from './DesktopNavigation';

export function ResponsiveLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop: Sidebar Navigation */}
      {!isMobile && <DesktopNavigation />}

      {/* Main Content */}
      <main
        className={`
          ${isMobile ? 'pb-16' : 'md:ml-64'}
          min-h-screen
          transition-all duration-300
        `}
      >
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile: Bottom Navigation */}
      {isMobile && <MobileNavigation />}
    </div>
  );
}
