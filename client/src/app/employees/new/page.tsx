'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { ChevronLeft, Loader2, Upload, X, User, AlertCircle } from 'lucide-react';
import { Company, Branch, Department, Position } from '@/types/employee';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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
  avatar: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      gender: 'MALE',
    },
  });

  const watchCompanyId = watch('companyId');
  const watchDepartmentId = watch('departmentId');

  // --- React Query hooks ---
  // Companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies', { params: { limit: 100 } });
      return res.data.data;
    },
  });

  // Branches (depends on companyId)
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['branches', watchCompanyId],
    queryFn: async () => {
      if (!watchCompanyId) return [];
      const res = await api.get(`/companies/${watchCompanyId}/branches`);
      return res.data.data;
    },
    enabled: !!watchCompanyId,
  });

  // Departments (depends on companyId)
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments', watchCompanyId],
    queryFn: async () => {
      if (!watchCompanyId) return [];
      const res = await api.get(`/companies/${watchCompanyId}/departments`);
      return res.data.data;
    },
    enabled: !!watchCompanyId,
  });

  // Positions (depends on departmentId)
  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ['positions', watchDepartmentId],
    queryFn: async () => {
      if (!watchDepartmentId) return [];
      const res = await api.get(`/departments/${watchDepartmentId}/positions`);
      return res.data.data;
    },
    enabled: !!watchDepartmentId,
  });

  // Managers (depends on companyId)
  const { data: managers = [], isLoading: managersLoading } = useQuery({
    queryKey: ['managers', watchCompanyId],
    queryFn: async () => {
      if (!watchCompanyId) return [];
      const res = await api.get('/employees', {
        params: { companyId: watchCompanyId, limit: 100, isActive: true },
      });
      return res.data.data;
    },
    enabled: !!watchCompanyId,
  });

  // --- Handlers ---
  const onDepartmentChange = (departmentId: string) => {
    setValue('departmentId', departmentId);
    setValue('positionId', '');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, GIF, or WEBP image.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setValue('avatar', '');
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setLoading(true);
    setError(null);

    try {
      let avatarUrl = '';

      if (avatarFile) {
        setUploadingAvatar(true);
        try {
          const formData = new FormData();
          formData.append('file', avatarFile);
          const uploadRes = await api.post('/upload/single', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          });
          avatarUrl = uploadRes.data.data.secureUrl;
          setUploadingAvatar(false);
        } catch (uploadError: any) {
          setUploadingAvatar(false);
          const errorMessage =
            uploadError.response?.data?.message ||
            uploadError.message ||
            'Failed to upload photo.';
          setError(`Avatar upload failed: ${errorMessage}`);
          toast({ title: 'Upload Failed', description: errorMessage, variant: 'destructive' });
          setLoading(false);
          return;
        }
      }

      const employeeData = { ...data, avatar: avatarUrl };

      // Convert empty strings to null for optional foreign keys
      employeeData.managerId = employeeData.managerId || null;
      employeeData.branchId = employeeData.branchId || null;
      employeeData.departmentId = employeeData.departmentId || null;
      employeeData.positionId = employeeData.positionId || null;

      await api.post('/employees', employeeData);
      toast({ title: 'Success', description: 'Employee created successfully' });
      router.push('/employees');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create employee';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
      setUploadingAvatar(false);
    }
  };

  // Check if there are no companies and we're not loading
  const noCompanies = !companiesLoading && companies.length === 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
            <p className="text-muted-foreground">Create a new employee record in the system</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
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

            {/* Personal Info Tab */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Enter the employee's personal details</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Passport Photo</Label>
                    <div className="mt-2 flex items-center gap-6">
                      <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/25">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <User className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Photo
                        </Button>
                        {avatarPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={removeAvatar}
                            disabled={uploadingAvatar}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Recommended: Square image, max 5MB (JPG, PNG, WEBP)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input id="employeeId" placeholder="EMP-001" {...register('employeeId')} />
                    {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="employee@company.com" {...register('email')} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" {...register('firstName')} />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" {...register('lastName')} />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
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
                    <Select onValueChange={(value) => setValue('gender', value as any)} defaultValue="MALE">
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
                    {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Employment Tab */}
            <TabsContent value="employment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                  <CardDescription>Enter employment and organizational information</CardDescription>
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
                      }}
                      disabled={companiesLoading || noCompanies}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          companiesLoading ? 'Loading companies...' :
                          noCompanies ? 'No companies available' :
                          'Select company'
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.companyId && <p className="text-sm text-destructive">{errors.companyId.message}</p>}
                    {noCompanies && (
                      <p className="text-sm text-muted-foreground">
                        No companies found. Please create a company first.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Hire Date *</Label>
                    <Input id="hireDate" type="date" {...register('hireDate')} />
                    {errors.hireDate && <p className="text-sm text-destructive">{errors.hireDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branchId">Branch</Label>
                    <Select
                      onValueChange={(value) => setValue('branchId', value)}
                      disabled={!watchCompanyId || branchesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={branchesLoading ? 'Loading...' : 'Select branch'} />
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
                      disabled={!watchCompanyId || departmentsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={departmentsLoading ? 'Loading...' : 'Select department'} />
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
                      disabled={!watchDepartmentId || positionsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={positionsLoading ? 'Loading...' : 'Select position'} />
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
                      disabled={!watchCompanyId || managersLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={managersLoading ? 'Loading...' : 'Select manager'} />
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

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Enter address and contact details</CardDescription>
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

            {/* Emergency Tab */}
            <TabsContent value="emergency" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                  <CardDescription>Enter emergency contact information</CardDescription>
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
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingAvatar}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingAvatar ? 'Uploading avatar...' : 'Creating...'}
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
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