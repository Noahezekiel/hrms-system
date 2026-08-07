'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DepartmentStatsItem {
  id: string;
  name: string;
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

interface DepartmentStatsProps {
  data: DepartmentStatsItem[];
  loading?: boolean;
}

export function DepartmentStats({ data, loading }: DepartmentStatsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getRateColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Stats</CardTitle>
        <CardDescription>
          Today's attendance by department
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No department data available
          </div>
        ) : (
          data.slice(0, 6).map((dept) => (
            <div key={dept.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium truncate">{dept.name}</span>
                <span className="text-muted-foreground">
                  {dept.presentToday}/{dept.totalEmployees} present
                </span>
              </div>
              <Progress
                value={dept.attendanceRate}
                className="h-2"
                indicatorClassName={cn('transition-all duration-500', getRateColor(dept.attendanceRate))}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{dept.attendanceRate}% attendance</span>
                <span>{dept.absentToday} absent</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}