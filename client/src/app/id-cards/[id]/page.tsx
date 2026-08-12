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
  Edit,
  Trash2,
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

export default function IDCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [idCard, setIdCard] = useState<IDCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const cardId = params?.id as string;

  useEffect(() => {
    if (!cardId) return;
    fetchIDCard();
  }, [cardId]);

  const fetchIDCard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/id-cards/${cardId}`);
      setIdCard(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ID card');
      toast({
        title: 'Error',
        description: 'Failed to load ID card details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const toggleStatus = async () => {
    if (!idCard) return;
    try {
      const response = await api.patch(`/id-cards/${idCard.id}/status`, {
        isActive: !idCard.isActive,
      });
      setIdCard(response.data.data);
      toast({
        title: 'Success',
        description: `ID card ${idCard.isActive ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update ID card status',
        variant: 'destructive',
      });
    }
  };

  const deleteIDCard = async () => {
    if (!idCard) return;
    if (!confirm('Are you sure you want to delete this ID card?')) return;
    try {
      await api.delete(`/id-cards/${idCard.id}`);
      toast({
        title: 'Success',
        description: 'ID card deleted successfully',
      });
      router.push('/id-cards');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete ID card',
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
                  <Skeleton className="h-32 w-32 rounded-lg" />
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

  if (error || !idCard) {
    return (
      <DashboardLayout>
        <div className="flex h-96 flex-col items-center justify-center">
          <p className="text-lg text-muted-foreground">{error || 'ID card not found'}</p>
          <Button onClick={() => router.push('/id-cards')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to ID Cards
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const employee = idCard.employee;
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = getInitials(employee.firstName, employee.lastName);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/id-cards')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ID Card Details</h1>
              <p className="text-muted-foreground">{idCard.cardNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadIDCard('pdf')}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadIDCard('png')}>
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* ID Card Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Card Preview</CardTitle>
              <CardDescription>
                {idCard.isActive ? 'Active' : 'Inactive'}
              </CardDescription>
            </CardHeader>
            <CardContent>
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

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => downloadIDCard('pdf')}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => downloadIDCard('png')}>
                  <Download className="mr-2 h-4 w-4" />
                  PNG
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Card Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Card Number</p>
                  <p className="font-medium font-mono">{idCard.cardNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(idCard.isActive ? 'active' : 'inactive')}>
                    {idCard.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{formatDate(idCard.issueDate)}</p>
                </div>
                {idCard.expiryDate && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">{formatDate(idCard.expiryDate)}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">{formatDate(idCard.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(idCard.updatedAt)}</p>
                </div>
                {idCard.template && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Template</p>
                    <p className="font-medium">{idCard.template}</p>
                  </div>
                )}
              </div>

              <hr />

              <div>
                <h3 className="mb-4 text-sm font-medium">Employee Information</h3>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={employee.avatar} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{fullName}</p>
                      <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/employees/${employee.id}`)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Employee
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{employee.email}</p>
                    </div>
                    {employee.phone && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm">{employee.phone}</p>
                      </div>
                    )}
                    {employee.department && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Department</p>
                        <p className="text-sm">{employee.department.name}</p>
                      </div>
                    )}
                    {employee.position && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Position</p>
                        <p className="text-sm">{employee.position.name}</p>
                      </div>
                    )}
                    {employee.company && (
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-xs text-muted-foreground">Company</p>
                        <p className="text-sm">{employee.company.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={regenerateIDCard} disabled={regenerating}>
                  {regenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={toggleStatus}>
                  {idCard.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="destructive" size="sm" onClick={deleteIDCard}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}