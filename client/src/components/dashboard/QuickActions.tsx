'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  UserPlus,
  CalendarPlus,
  Clock,
  FileText,
  QrCode,
  Users,
  Settings,
  PlusCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  roles?: string[];
  color?: string;
}

export function QuickActions() {
  const router = useRouter();
  const { user } = useAuthStore();

  const actions: QuickAction[] = [
    {
      title: 'New Employee',
      description: 'Add a new employee to the system',
      icon: UserPlus,
      href: '/employees/new',
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'],
      color: 'bg-blue-500',
    },
    {
      title: 'Check In',
      description: 'Record attendance check-in',
      icon: Clock,
      href: '/attendance/check-in',
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'ATTENDANCE_OFFICER', 'DEPARTMENT_MANAGER', 'STAFF'],
      color: 'bg-green-500',
    },
    {
      title: 'New Leave Request',
      description: 'Apply for leave',
      icon: CalendarPlus,
      href: '/leave/new',
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'ATTENDANCE_OFFICER', 'DEPARTMENT_MANAGER', 'STAFF'],
      color: 'bg-purple-500',
    },
    {
      title: 'Generate ID Card',
      description: 'Create employee ID card',
      icon: QrCode,
      href: '/id-cards/generate',
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'],
      color: 'bg-orange-500',
    },
    {
      title: 'Generate Report',
      description: 'Download attendance report',
      icon: FileText,
      href: '/reports',
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'ATTENDANCE_OFFICER'],
      color: 'bg-red-500',
    },
    {
      title: 'Manage Shifts',
      description: 'Configure shift schedules',
      icon: Users,
      href: '/shifts',
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'],
      color: 'bg-indigo-500',
    },
  ];

  const filteredActions = actions.filter(action => {
    if (!action.roles) return true;
    return action.roles.includes(user?.role || '');
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
      </div>
      <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {filteredActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => router.push(action.href)}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={cn('rounded-lg p-2 text-white', action.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium">{action.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');