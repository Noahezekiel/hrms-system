'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  User,
  Building2,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';

interface Attendance {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  checkInPhoto?: string;
  checkOutPhoto?: string;
  breakIn?: string;
  breakOut?: string;
  status: string;
  totalHours?: number;
  overtimeHours?: number;
  isOvertime: boolean;
  notes?: string;
  shift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  };
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  department?: { id: string; name: string };
  position?: { id: string; name: string };
  company?: { id: string; name: string };
}

export default function EmployeeAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const employeeId = params?.id as string;

  useEffect(() => {
    if (!employeeId) return;
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch employee details
      const empResponse = await api.get(`/employees/${employeeId}`);
      setEmployee(empResponse.data.data);

      // Fetch attendance records
      await fetchAttendance();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!employeeId) return;
    try {
      const response = await api.get(`/employees/${employeeId}/attendance`, {
        params: {
          page,
          limit,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
      });
      setAttendance(response.data.data);
      setTotal(response.data.pagination?.total || 0);
      setSummary(response.data.summary);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load attendance records',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchAttendance();
    }
  }, [page, filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <span className="text-green-500">✓</span>;
      case 'ABSENT':
        return <span className="text-red-500">✕</span>;
      case 'LATE':
        return <span className="text-yellow-500">!</span>;
      case 'HALF_DAY':
        return <span className="text-orange-500">½</span>;
      case 'HOLIDAY':
        return <span className="text-purple-500">★</span>;
      case 'LEAVE':
        return <span className="text-blue-500">↗</span>;
      default:
        return null;
    }
  };

  const handleFilter = () => {
    setPage(1);
    fetchAttendance();
  };

  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '' });
    setPage(1);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout>
        <div className="flex h-96 flex-col items-center justify-center">
          <p className="text-lg text-muted-foreground">{error || 'Employee not found'}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {fullName} – Attendance
              </h1>
              <p className="text-muted-foreground">{employee.employeeId}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAttendance}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Employee Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Employee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={employee.avatar} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <h3 className="mt-2 text-lg font-semibold">{fullName}</h3>
                <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {employee.department && (
                    <Badge variant="outline">
                      <Building2 className="mr-1 h-3 w-3" />
                      {employee.department.name}
                    </Badge>
                  )}
                  {employee.position && (
                    <Badge variant="outline">
                      <Briefcase className="mr-1 h-3 w-3" />
                      {employee.position.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {employee.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.phone}</span>
                  </div>
                )}
              </div>

              {summary && (
                <div className="rounded-lg border p-3 space-y-2 text-sm">
                  <p className="font-medium">Summary</p>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Days</span>
                      <span className="font-medium">{summary.totalDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Present</span>
                      <span className="font-medium text-green-600">{summary.present}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Absent</span>
                      <span className="font-medium text-red-600">{summary.absent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Late</span>
                      <span className="font-medium text-yellow-600">{summary.late}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Half Day</span>
                      <span className="font-medium text-orange-600">{summary.halfDay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overtime</span>
                      <span className="font-medium text-purple-600">{summary.overtime}</span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-1 border-t">
                    <span className="text-muted-foreground">Total Hours</span>
                    <span className="font-medium">{summary.totalHours || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Overtime Hours</span>
                    <span className="font-medium">{summary.totalOvertimeHours || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <span className="font-medium">{summary.attendanceRate || 0}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Records */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {total > 0 ? `Showing ${attendance.length} of ${total} records` : 'No records found'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-4 flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    className="w-40"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    className="w-40"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
                <Button size="sm" onClick={handleFilter}>
                  <Filter className="mr-2 h-4 w-4" />
                  Apply
                </Button>
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
              </div>

              {/* Table */}
              {attendance.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                  <Clock className="h-12 w-12" />
                  <p className="mt-2">No attendance records found</p>
                  <p className="text-xs">Try adjusting the filters</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Total Hours</TableHead>
                        <TableHead>Overtime</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.date)}</TableCell>
                          <TableCell>
                            {record.checkIn ? formatTime(record.checkIn) : '—'}
                          </TableCell>
                          <TableCell>
                            {record.checkOut ? formatTime(record.checkOut) : '—'}
                          </TableCell>
                          <TableCell>
                            {record.totalHours || 0}
                          </TableCell>
                          <TableCell>
                            {record.overtimeHours || 0}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              <Badge className={getStatusColor(record.status)}>
                                {record.status}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {total > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(total / limit)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}