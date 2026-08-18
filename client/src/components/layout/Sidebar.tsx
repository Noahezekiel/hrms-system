'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  Briefcase,
  Building2,
  FileText,
  Settings,
  LogOut,
  UserCog,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Home,
  Layers,
  Bell,
  BarChart3,
  QrCode,
  Fingerprint,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  isMobile: boolean;
  user: any;
  pathname: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

export function Sidebar({ open, onToggle, isMobile, user, pathname }: SidebarProps) {
  const { logout } = useAuthStore();
  const { theme } = useThemeStore();
  const [expanded, setExpanded] = useState(true);

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'ATTENDANCE_OFFICER', 'DEPARTMENT_MANAGER', 'STAFF'],
    },
    {
      title: 'Employees',
      href: '/employees',
      icon: Users,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'],
    },
    {
      title: 'Attendance',
      href: '/attendance',
      icon: Clock,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'ATTENDANCE_OFFICER', 'DEPARTMENT_MANAGER', 'STAFF'],
    },
    {
      title: 'Leave Management',
      href: '/leave',
      icon: Calendar,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'ATTENDANCE_OFFICER', 'DEPARTMENT_MANAGER', 'STAFF'],
    },
    {
      title: 'Shifts',
      href: '/shifts',
      icon: Briefcase,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'],
    },
    {
      title: 'ID Cards',
      href: '/id-cards',
      icon: CreditCard,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'],
    },
    {
      title: 'Departments',
      href: '/departments',
      icon: Layers,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'],
    },
    {
      title: 'Branches',
      href: '/branches',
      icon: Building2,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'],
    },
    {
      title: 'Positions',
      href: '/positions',
      icon: Briefcase,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'],
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'ATTENDANCE_OFFICER'],
    },
    {
      title: 'Companies',
      href: '/companies',
      icon: Building2,
      roles: ['SUPER_ADMIN'],
    },
    {
      title: 'Audit Logs',
      href: '/audit-logs',
      icon: FileText,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
    },
    {
      title: 'Users',
      href: '/users',
      icon: Users,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-background border-r transition-all duration-300 ease-in-out',
          'flex flex-col',
          open ? 'w-[280px]' : 'w-0',
          isMobile && open ? 'shadow-2xl' : '',
          isMobile && !open ? 'overflow-hidden' : 'overflow-hidden'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">HR</span>
            </div>
            {open && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg truncate"
              >
                HRMS
              </motion.span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            {isMobile ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {open && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.role?.replace('_', ' ').toLowerCase()}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={() => {/* Navigate to profile */}}
            >
              <UserCog className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={() => {/* Navigate to notifications */}}
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}