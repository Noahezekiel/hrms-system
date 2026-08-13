'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const employeeId = params?.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  const watchCompanyId = watch('companyId');

  useEffect(() => {
    if (!employeeId) return;
    fetchData();
    fetchCompanies();
  }, [employeeId]);

  useEffect(() => {
    if (watchCompanyId) {
      fetchBranches(watchCompanyId);
      fetchDepartments(watchCompanyId);
      fetchManagers(watchCompanyId);
    }
  }, [watchCompanyId]);

  const fetchData = async () => {
    setFetching(true);
    try {
      const response = await api.get(`/employees/${employeeId}`);
      const employee = response.data.data;
      reset({
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        middleName: employee.middleName || '',
        email: employee.email,
        phone: employee.phone || '',
        gender: employee.gender,
        dateOfBirth: employee.dateOfBirth.split('T')[0],
        hireDate: employee.hireDate.split('T')[0],
        companyId: employee.companyId,
        branchId: employee.branchId || '',
        departmentId: employee.departmentId || '',
        positionId: employee.positionId || '',
        managerId: employee.managerId || '',
        address: employee.address || '',
        city: employee.city || '',
        state: employee.state || '',
        country: employee.country || '',
        zipCode: employee.zipCode || '',
        emergencyContact: employee.emergencyContact || '',
        emergencyPhone: employee.emergencyPhone || '',
        notes: employee.notes || '',
        avatar: employee.avatar || '',
      });
      if (employee.avatar) {
        setAvatarPreview(employee.avatar);
      }
      if (employee.companyId) {
        await fetchBranches(employee.companyId);
        await fetchDepartments(employee.companyId);
        await fetchManagers(employee.companyId);
        if (employee.departmentId) {
          await fetchPositions(employee.departmentId);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load employee');
      toast({ title: 'Error', description: 'Failed to load employee data', variant: 'destructive' });
    } finally {
      setFetching(false);
    }
  };

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a JPG, PNG, GIF, or WEBP image.', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: 'Image must be less than 5MB.', variant: 'destructive' });
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
      let avatarUrl = data.avatar || '';

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

      // 🔥 FIX: Convert empty strings to null for optional foreign keys
      employeeData.managerId = employeeData.managerId || null;
      employeeData.branchId = employeeData.branchId || null;
      employeeData.departmentId = employeeData.departmentId || null;
      employeeData.positionId = employeeData.positionId || null;

      await api.put(`/employees/${employeeId}`, employeeData);
      toast({ title: 'Success', description: 'Employee updated successfully' });
      router.push(`/employees/${employeeId}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update employee';
      setError(errorMessage);
      toast({ title: 'Update Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
      setUploadingAvatar(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Employee</h1>
            <p className="text-muted-foreground">Update employee information</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
              <CardDescription>Update the employee's details including passport photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Upload */}
              <div className="grid gap-4 md:grid-cols-2">
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

                {/* Employee ID */}
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input id="employeeId" {...register('employeeId')} />
                  {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...register('email')} />
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
                  <Input id="phone" {...register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => setValue('gender', value as any)} defaultValue={watch('gender')}>
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

                {/* Employment */}
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
                    value={watch('companyId')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.companyId && <p className="text-sm text-destructive">{errors.companyId.message}</p>}
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
                    value={watch('branchId')}
                    disabled={!watchCompanyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <Select
                    onValueChange={(value) => onDepartmentChange(value)}
                    value={watch('departmentId')}
                    disabled={!watchCompanyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionId">Position</Label>
                  <Select
                    onValueChange={(value) => setValue('positionId', value)}
                    value={watch('positionId')}
                    disabled={!watch('departmentId')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {positions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerId">Manager</Label>
                  <Select
                    onValueChange={(value) => setValue('managerId', value)}
                    value={watch('managerId')}
                    disabled={!watchCompanyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.firstName} {m.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact */}
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

                {/* Emergency */}
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
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || uploadingAvatar}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadingAvatar ? 'Uploading avatar...' : 'Saving...'}
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}