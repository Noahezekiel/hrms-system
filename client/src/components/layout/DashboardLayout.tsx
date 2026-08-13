'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Named export
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { theme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-background transition-colors duration-300',
        theme === 'dark' ? 'dark' : ''
      )}
    >
      <Sidebar
        open={sidebarOpen}
        onToggle={toggleSidebar}
        isMobile={isMobile}
        user={user}
        pathname={pathname}
      />
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarOpen && !isMobile ? 'ml-[280px]' : 'ml-0'
        )}
      >
        <Header
          onMenuClick={toggleSidebar}
          isMobile={isMobile}
          user={user}
        />
        <main className="p-4 md:p-6 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}

// ✅ Default export (makes both imports work)
export default DashboardLayout;