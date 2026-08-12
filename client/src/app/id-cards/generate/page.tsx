'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Search,
  Loader2,
  QrCode,
  Download,
  Printer,
  Eye,
  RefreshCw,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  FileText,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  department?: { name: string };
  position?: { name: string };
  company?: { name: string };
}

interface IDCard {
  id: string;
  cardNumber: string;
  qrCode: string;
  barcode: string;
  issueDate: string;
  expiryDate?: string;
  isActive: boolean;
  employee: Employee;
}

export default function GenerateIDCardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [idCard, setIdCard] = useState<IDCard | null>(null);
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Search employees
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length > 1) {
        searchEmployees();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const searchEmployees = async () => {
    try {
      const response = await api.get('/employees', {
        params: { search: searchTerm, limit: 10 },
      });
      setSearchResults(response.data.data);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to search employees:', error);
    }
  };

  const selectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchTerm(`${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
    setShowResults(false);
    setIdCard(null); // Reset ID card when new employee selected
  };

  const generateIDCard = async () => {
    if (!selectedEmployee) {
      toast({
        title: 'Error',
        description: 'Please select an employee first',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/id-cards/generate', {
        employeeId: selectedEmployee.id,
      });
      setIdCard(response.data.data);
      toast({
        title: 'Success',
        description: 'ID card generated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate ID card',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to download ID card',
        variant: 'destructive',
      });
    }
  };

  const viewIDCard = () => {
    if (!idCard) return;
    router.push(`/id-cards/${idCard.id}`);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generate ID Card</h1>
          <p className="text-muted-foreground">
            Create a new ID card for an employee with QR code and barcode
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column – Employee Selection & Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Employee</CardTitle>
                <CardDescription>
                  Search for an employee to generate their ID card
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or employee ID..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length > 1 && setShowResults(true)}
                  />
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
                      {searchResults.map((emp) => (
                        <button
                          key={emp.id}
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-accent"
                          onClick={() => selectEmployee(emp)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp.avatar} />
                            <AvatarFallback>{getInitials(emp.firstName, emp.lastName)}</AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="font-medium">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {emp.employeeId} · {emp.department?.name || 'No department'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedEmployee && (
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedEmployee.avatar} />
                        <AvatarFallback>
                          {getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedEmployee.firstName} {selectedEmployee.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEmployee.employeeId}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {selectedEmployee.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {selectedEmployee.email}
                            </span>
                          )}
                          {selectedEmployee.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {selectedEmployee.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedEmployee.department && (
                        <Badge variant="outline">
                          <Building2 className="mr-1 h-3 w-3" />
                          {selectedEmployee.department.name}
                        </Badge>
                      )}
                      {selectedEmployee.position && (
                        <Badge variant="outline">
                          <Briefcase className="mr-1 h-3 w-3" />
                          {selectedEmployee.position.name}
                        </Badge>
                      )}
                      {selectedEmployee.company && (
                        <Badge variant="outline">
                          <Building2 className="mr-1 h-3 w-3" />
                          {selectedEmployee.company.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={generateIDCard}
                  disabled={!selectedEmployee || generating}
                  className="w-full"
                >
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
              </CardContent>
            </Card>
          </div>

          {/* Right Column – Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Preview the ID card before downloading
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
                          <Badge variant={idCard.isActive ? 'success' : 'secondary'}>
                            {idCard.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="flex w-full items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={idCard.employee.avatar} />
                            <AvatarFallback>
                              {getInitials(idCard.employee.firstName, idCard.employee.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {idCard.employee.firstName} {idCard.employee.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {idCard.employee.employeeId}
                            </p>
                            {idCard.employee.department && (
                              <p className="text-xs text-muted-foreground">
                                {idCard.employee.department.name}
                                {idCard.employee.position && ` · ${idCard.employee.position.name}`}
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
                        onClick={() => downloadIDCard('pdf')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadIDCard('png')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PNG
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={viewIDCard}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                    <QrCode className="h-12 w-12" />
                    <p className="mt-2 text-sm">Select an employee and generate</p>
                    <p className="text-xs">The ID card preview will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}