'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AttendanceChartData {
  date: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
}

interface AttendanceChartProps {
  data: AttendanceChartData[];
  loading?: boolean;
}

export function AttendanceChart({ data, loading }: AttendanceChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const colors = {
    present: '#22c55e',
    absent: '#ef4444',
    late: '#eab308',
    halfDay: '#f97316',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Overview</CardTitle>
        <CardDescription>
          Daily attendance breakdown for the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: '12px',
                  paddingTop: '10px',
                }}
              />
              <Bar
                dataKey="present"
                name="Present"
                fill={colors.present}
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="late"
                name="Late"
                fill={colors.late}
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="halfDay"
                name="Half Day"
                fill={colors.halfDay}
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="absent"
                name="Absent"
                fill={colors.absent}
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}