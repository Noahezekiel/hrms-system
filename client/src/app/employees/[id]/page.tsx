'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  MapPin,
  User,
  Edit,
  QrCode,
  Clock,
  FileText,
} from 'lucide-react';
import { formatDate, getGenderLabel, getStatusColor } from '@/lib/utils';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  gender: string;
  dateOfBirth: string;
  hireDate: string;
  terminationDate?: string;
  isActive: boolean;
  avatar?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  department?: { id: string; name: string };
  position?: { id: string; name: string };
  branch?: { id: string; name: string };
  manager?: { id: string; firstName: string; lastName: string };
  company?: { id: string; name: string };
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeId = params?.id as string;

  useEffect(() => {
    if (!employeeId) return;
    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/employees/${employeeId}`);
      setEmployee(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load employee details');
      toast({
        title: 'Error',
        description: 'Failed to load employee details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    ))}
                  </div>
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
              <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
              <p className="text-muted-foreground">{employee.employeeId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/employees/${employee.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/employees/${employee.id}/id-card`)}>
              <QrCode className="mr-2 h-4 w-4" />
              ID Card
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={employee.avatar} />
                  <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">{fullName}</h2>
                  <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                </div>
                <Badge className={getStatusColor(employee.isActive ? 'active' : 'inactive')}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <div className="w-full space-y-2 pt-4 text-sm">
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
                  {employee.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {employee.address}
                        {employee.city && `, ${employee.city}`}
                        {employee.state && `, ${employee.state}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{getGenderLabel(employee.gender)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDate(employee.dateOfBirth)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="font-medium">{formatDate(employee.hireDate)}</p>
                </div>
                {employee.terminationDate && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Termination Date</p>
                    <p className="font-medium">{formatDate(employee.terminationDate)}</p>
                  </div>
                )}
              </div>

              <hr />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{employee.department?.name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{employee.position?.name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Branch</p>
                  <p className="font-medium">{employee.branch?.name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{employee.company?.name || 'N/A'}</p>
                </div>
                {employee.manager && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Manager</p>
                    <p className="font-medium">
                      {employee.manager.firstName} {employee.manager.lastName}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => router.push(`/employees/${employee.id}/attendance`)}>
                  <Clock className="mr-2 h-4 w-4" />
                  View Attendance
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push(`/employees/${employee.id}/leave`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Leave
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}