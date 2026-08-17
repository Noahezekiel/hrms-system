'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { DepartmentStats } from '@/components/dashboard/DepartmentStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { LeaveStats } from '@/components/dashboard/LeaveStats';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Loader2, Users, Clock, Calendar, Briefcase, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const {
    overview,
    attendanceChart,
    departmentStats,
    recentActivity,
    leaveStats,
    isLoading,
    error,
    fetchDashboardData,
    fetchAttendanceChart,
    fetchDepartmentStats,
    fetchRecentActivity,
    fetchLeaveStats,
  } = useDashboardStore();

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      // Fetch all dashboard data
      fetchDashboardData({ period: timeframe });
      fetchAttendanceChart({ period: timeframe });
      fetchDepartmentStats();
      fetchRecentActivity({ limit: 10 });
      fetchLeaveStats();
    }
  }, [
    authLoading,
    isAuthenticated,
    router,
    timeframe,
    fetchDashboardData,
    fetchAttendanceChart,
    fetchDepartmentStats,
    fetchRecentActivity,
    fetchLeaveStats,
  ]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.firstName}! Here's what's happening with your organization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Employees"
            value={overview?.employees?.total ?? 0}
            icon={<Users className="h-4 w-4" />}
            description={`${overview?.employees?.active ?? 0} active employees`}
            loading={isLoading}
          />
          <StatsCard
            title="Attendance Rate"
            value={`${overview?.attendance?.rate ?? 0}%`}
            icon={<Clock className="h-4 w-4" />}
            description={`${overview?.attendance?.present ?? 0} present today`}
            loading={isLoading}
            trend={overview?.attendance?.trend}
          />
          <StatsCard
            title="Pending Leave"
            value={overview?.leave?.pending ?? 0}
            icon={<Calendar className="h-4 w-4" />}
            description={`${overview?.leave?.approved ?? 0} approved this period`}
            loading={isLoading}
          />
          <StatsCard
            title="Overtime Hours"
            value={`${overview?.overtime?.totalHours ?? 0}h`}
            icon={<Briefcase className="h-4 w-4" />}
            description={`${overview?.overtime?.totalRecords ?? 0} overtime records`}
            loading={isLoading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AttendanceChart data={attendanceChart} loading={isLoading} />
          </div>
          <div className="lg:col-span-1">
            <DepartmentStats data={departmentStats} loading={isLoading} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivity activities={recentActivity} loading={isLoading} />
          </div>
          <div className="lg:col-span-1">
            <LeaveStats data={leaveStats} loading={isLoading} />
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </DashboardLayout>
  );
}