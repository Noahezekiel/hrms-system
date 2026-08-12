'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Download,
  Printer,
  QrCode,
  RefreshCw,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  ExternalLink,
  FileText,
  Eye,
  Loader2,
} from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  company?: { id: string; name: string; logo?: string };
  department?: { id: string; name: string };
  position?: { id: string; name: string };
}

interface IDCard {
  id: string;
  employeeId: string;
  cardNumber: string;
  qrCode: string;
  barcode: string;
  issueDate: string;
  expiryDate?: string;
  isActive: boolean;
  template?: string;
  createdAt: string;
  updatedAt: string;
  employee: Employee;
}

export default function EmployeeIDCardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [idCard, setIdCard] = useState<IDCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Try to fetch ID card
      try {
        const cardResponse = await api.get(`/employees/${employeeId}/id-card`);
        setIdCard(cardResponse.data.data);
      } catch (cardErr: any) {
        // 404 means no card exists – that's fine
        if (cardErr.response?.status === 404) {
          setIdCard(null);
        } else {
          throw cardErr;
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
      toast({
        title: 'Error',
        description: 'Failed to load employee data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateIDCard = async () => {
    if (!employee) return;
    setGenerating(true);
    try {
      const response = await api.post(`/employees/${employee.id}/generate-id-card`);
      setIdCard(response.data.data);
      toast({
        title: 'Success',
        description: 'ID card generated successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to generate ID card',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const regenerateIDCard = async () => {
    if (!idCard) return;
    setRegenerating(true);
    try {
      const response = await api.post(`/id-cards/${idCard.id}/regenerate`);
      setIdCard(response.data.data);
      toast({
        title: 'Success',
        description: 'ID card regenerated successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to regenerate ID card',
        variant: 'destructive',
      });
    } finally {
      setRegenerating(false);
    }
  };

  const downloadIDCard = async (format: 'pdf' | 'png' = 'pdf') => {
    if (!idCard) return;
    try {
      const response = await api.get(`/id-cards/${idCard.id}/download`, {
        params: { format },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `id-card-${idCard.cardNumber}.${format === 'pdf' ? 'pdf' : 'png'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: 'Success',
        description: `ID card downloaded as ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to download ID card',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
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
                  <Skeleton className="h-64 w-full rounded-lg" />
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
  const initials = getInitials(employee.firstName, employee.lastName);

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
                {fullName} – ID Card
              </h1>
              <p className="text-muted-foreground">{employee.employeeId}</p>
            </div>
          </div>
          {idCard && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadIDCard('pdf')}>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadIDCard('png')}>
                <Download className="mr-2 h-4 w-4" />
                PNG
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Employee Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Employee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={employee.avatar} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
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
                {employee.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.company.name}</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/employees/${employee.id}`)}
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Employee Details
              </Button>
            </CardContent>
          </Card>

          {/* ID Card Preview */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                ID Card {idCard && <Badge className="ml-2">{idCard.isActive ? 'Active' : 'Inactive'}</Badge>}
              </CardTitle>
              <CardDescription>
                {idCard ? `Card Number: ${idCard.cardNumber}` : 'No ID card generated yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {idCard ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex w-full items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">ID Card</p>
                          <p className="text-xs text-muted-foreground">{idCard.cardNumber}</p>
                        </div>
                        <Badge className={getStatusColor(idCard.isActive ? 'active' : 'inactive')}>
                          {idCard.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="flex w-full items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={employee.avatar} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{fullName}</p>
                          <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                          {employee.department && (
                            <p className="text-xs text-muted-foreground">
                              {employee.department.name}
                              {employee.position && ` · ${employee.position.name}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex w-full justify-around">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Issue Date</p>
                          <p className="text-sm font-medium">
                            {formatDate(idCard.issueDate)}
                          </p>
                        </div>
                        {idCard.expiryDate && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Expiry Date</p>
                            <p className="text-sm font-medium">
                              {formatDate(idCard.expiryDate)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex w-full items-center justify-around">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">QR Code</p>
                          <img
                            src={idCard.qrCode}
                            alt="QR Code"
                            className="h-20 w-20 object-contain"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Barcode</p>
                          <img
                            src={idCard.barcode}
                            alt="Barcode"
                            className="h-12 w-32 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={regenerateIDCard}
                      disabled={regenerating}
                    >
                      {regenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/id-cards/${idCard.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Full View
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                  <QrCode className="h-12 w-12" />
                  <p className="mt-2 text-sm">No ID card exists for this employee</p>
                  <p className="text-xs">Click the button below to generate one</p>
                  <Button onClick={generateIDCard} disabled={generating} className="mt-4">
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Generate ID Card
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}