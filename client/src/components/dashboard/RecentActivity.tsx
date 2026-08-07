'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, UserPlus, CalendarCheck, LogIn, LogOut, FileCheck, XCircle } from 'lucide-react';

interface ActivityItem {
  type: 'audit' | 'attendance';
  id: string;
  action: string;
  entity?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  checkIn?: string;
  checkOut?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  const getActionIcon = (action: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'CHECK_IN': <LogIn className="h-4 w-4 text-green-500" />,
      'CHECK_OUT': <LogOut className="h-4 w-4 text-blue-500" />,
      'CREATE': <UserPlus className="h-4 w-4 text-purple-500" />,
      'UPDATE': <FileCheck className="h-4 w-4 text-yellow-500" />,
      'DELETE': <XCircle className="h-4 w-4 text-red-500" />,
      'APPROVE': <CheckCircle className="h-4 w-4 text-green-500" />,
      'REJECT': <XCircle className="h-4 w-4 text-red-500" />,
      'BREAK_IN': <Clock className="h-4 w-4 text-orange-500" />,
      'BREAK_OUT': <Clock className="h-4 w-4 text-orange-500" />,
    };
    return iconMap[action] || <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'CHECK_IN': 'Checked in',
      'CHECK_OUT': 'Checked out',
      'CREATE': 'Created',
      'UPDATE': 'Updated',
      'DELETE': 'Deleted',
      'APPROVE': 'Approved',
      'REJECT': 'Rejected',
      'CANCEL': 'Cancelled',
      'BREAK_IN': 'Break started',
      'BREAK_OUT': 'Break ended',
      'LOGIN': 'Logged in',
      'LOGOUT': 'Logged out',
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      'Employee': 'employee',
      'Attendance': 'attendance record',
      'LeaveRequest': 'leave request',
      'User': 'user',
      'Company': 'company',
      'Branch': 'branch',
      'Department': 'department',
      'Position': 'position',
      'Shift': 'shift',
      'Holiday': 'holiday',
      'IDCard': 'ID card',
      'Setting': 'setting',
      'Upload': 'file',
    };
    return labels[entity] || entity.toLowerCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest actions and events across the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 6).map((activity) => {
              const person = activity.user || activity.employee;
              const name = person ? `${person.firstName} ${person.lastName}` : 'Unknown';
              const initials = person ? `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`.toUpperCase() : 'U';

              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={person?.avatar} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{name}</span>
                      <span className="text-sm text-muted-foreground">
                        {getActionLabel(activity.action)}
                      </span>
                      {activity.entity && (
                        <Badge variant="secondary" className="text-xs">
                          {getEntityLabel(activity.entity)}
                        </Badge>
                      )}
                      {getActionIcon(activity.action)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(activity.createdAt)}
                    </p>
                    {activity.type === 'attendance' && activity.checkIn && !activity.checkOut && (
                      <Badge variant="success" className="text-xs mt-1">
                        Checked in
                      </Badge>
                    )}
                    {activity.type === 'attendance' && activity.checkOut && (
                      <Badge variant="info" className="text-xs mt-1">
                        Checked out
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}