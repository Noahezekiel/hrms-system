'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getLeaveTypeLabel } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface LeaveStatsProps {
  data?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    totalDays: number;
    byType: Record<string, { count: number; days: number }>;
  };
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#6b7280', '#f97316', '#8b5cf6'];

export function LeaveStats({ data, loading }: LeaveStatsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[150px] w-full" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Statistics</CardTitle>
          <CardDescription>No leave data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No leave requests recorded
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: 'Pending', value: data.pending },
    { name: 'Approved', value: data.approved },
    { name: 'Rejected', value: data.rejected },
    { name: 'Cancelled', value: data.cancelled },
  ].filter(item => item.value > 0);

  const byTypeData = Object.entries(data.byType).map(([key, value]) => ({
    name: getLeaveTypeLabel(key),
    value: value.count,
    days: value.days,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Statistics</CardTitle>
        <CardDescription>
          Overview of leave requests and types
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{data.total}</p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{data.totalDays}</p>
            <p className="text-xs text-muted-foreground">Total Days</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="warning" className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            Pending: {data.pending}
          </Badge>
          <Badge variant="success" className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Approved: {data.approved}
          </Badge>
          <Badge variant="destructive" className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Rejected: {data.rejected}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-500" />
            Cancelled: {data.cancelled}
          </Badge>
        </div>

        {pieData.length > 0 && (
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  wrapperStyle={{
                    fontSize: '10px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {byTypeData.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">By Leave Type</p>
            <div className="grid grid-cols-2 gap-1">
              {byTypeData.map((item) => (
                <div key={item.name} className="flex justify-between text-xs">
                  <span className="truncate">{item.name}</span>
                  <span className="font-medium">{item.days}d</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}