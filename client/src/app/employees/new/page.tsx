'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { ChevronLeft, Loader2, Upload, UserPlus, Building2, Briefcase, Mail, Phone, MapPin } from 'lucide-react';
import { Company, Branch, Department, Position } from '@/types/employee';

const employeeSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  hireDate: z.string().min(1, 'Hire date is required'),
  companyId: z.string().min(1, 'Company is required'),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  managerId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  const watchCompanyId = watch('companyId');

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (watchCompanyId) {
      fetchBranches(watchCompanyId);
      fetchDepartments(watchCompanyId);
      fetchManagers(watchCompanyId);
      setSelectedCompany(watchCompanyId);
    }
  }, [watchCompanyId]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies', { params: { limit: 100 } });
      setCompanies(response.data.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchBranches = async (companyId: string) => {
    try {
      const response = await api.get(`/companies/${companyId}/branches`);
      setBranches(response.data.data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchDepartments = async (companyId: string) => {
    try {
      const response = await api.get(`/companies/${companyId}/departments`);
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchManagers = async (companyId: string) => {
    try {
      const response = await api.get('/employees', {
        params: { companyId, limit: 100, isActive: true },
      });
      setManagers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const fetchPositions = async (departmentId: string) => {
    try {
      const response = await api.get(`/departments/${departmentId}/positions`);
      setPositions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };

  const onDepartmentChange = (departmentId: string) => {
    setValue('departmentId', departmentId);
    setValue('positionId', '');
    if (departmentId) {
      fetchPositions(departmentId);
    } else {
      setPositions([]);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/employees', data);
      toast({
        title: 'Success',
        description: 'Employee created successfully',
      });
      router.push('/employees');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
            <p className="text-muted-foreground">
              Create a new employee record in the system
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Enter the employee's personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input
                      id="employeeId"
                      placeholder="EMP-001"
                      {...register('employeeId')}
                    />
                    {errors.employeeId && (
                      <p className="text-sm text-destructive">{errors.employeeId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="employee@company.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" {...register('firstName')} />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" {...register('lastName')} />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" {...register('middleName')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+1 234 567 890" {...register('phone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      onValueChange={(value) => setValue('gender', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-destructive">{errors.gender.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                  <CardDescription>
                    Enter employment and organizational information
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Company *</Label>
                    <Select
                      onValueChange={(value) => {
                        setValue('companyId', value);
                        setValue('branchId', '');
                        setValue('departmentId', '');
                        setValue('positionId', '');
                        setBranches([]);
                        setDepartments([]);
                        setPositions([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.companyId && (
                      <p className="text-sm text-destructive">{errors.companyId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Hire Date *</Label>
                    <Input id="hireDate" type="date" {...register('hireDate')} />
                    {errors.hireDate && (
                      <p className="text-sm text-destructive">{errors.hireDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchId">Branch</Label>
                    <Select
                      onValueChange={(value) => setValue('branchId', value)}
                      disabled={!watchCompanyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department</Label>
                    <Select
                      onValueChange={(value) => onDepartmentChange(value)}
                      disabled={!watchCompanyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="positionId">Position</Label>
                    <Select
                      onValueChange={(value) => setValue('positionId', value)}
                      disabled={!watch('departmentId')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerId">Manager</Label>
                    <Select
                      onValueChange={(value) => setValue('managerId', value)}
                      disabled={!watchCompanyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.firstName} {manager.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Enter address and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...register('address')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register('city')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...register('state')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...register('country')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input id="zipCode" {...register('zipCode')} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emergency" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                  <CardDescription>
                    Enter emergency contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input id="emergencyContact" {...register('emergencyContact')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                    <Input id="emergencyPhone" {...register('emergencyPhone')} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input id="notes" {...register('notes')} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Employee
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}