'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Clock,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  Calendar,
  Briefcase,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { getShiftTypeLabel } from '@/lib/utils';
import { Shift } from '@/types/employee';

export default function ShiftsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    shiftType: 'MORNING',
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    companyId: '',
    branchId: '',
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/shifts', {
        params: {
          page,
          limit,
          search: search || undefined,
        },
      });
      setShifts(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch shifts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [page, limit, search]);

  useEffect(() => {
    fetchCompanies();
  }, []);

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

  const handleSubmit = async () => {
    try {
      if (editingShift) {
        await api.put(`/shifts/${editingShift.id}`, formData);
        toast({ title: 'Success', description: 'Shift updated successfully' });
      } else {
        await api.post('/shifts', formData);
        toast({ title: 'Success', description: 'Shift created successfully' });
      }
      setShowDialog(false);
      setEditingShift(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        shiftType: 'MORNING',
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        companyId: '',
        branchId: '',
      });
      fetchShifts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save shift',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    try {
      await api.delete(`/shifts/${id}`);
      toast({ title: 'Success', description: 'Shift deleted successfully' });
      fetchShifts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete shift',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      code: shift.code,
      description: shift.description || '',
      shiftType: shift.shiftType,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakStart: shift.breakStart || '',
      breakEnd: shift.breakEnd || '',
      companyId: shift.companyId,
      branchId: shift.branchId || '',
    });
    if (shift.companyId) {
      fetchBranches(shift.companyId);
    }
    setShowDialog(true);
  };

  const getShiftIcon = (type: string) => {
    switch (type) {
      case 'MORNING':
        return <Sunrise className="h-4 w-4" />;
      case 'EVENING':
        return <Sunset className="h-4 w-4" />;
      case 'NIGHT':
        return <Moon className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Shifts</h1>
            <p className="text-muted-foreground">
              Manage work shifts and schedules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setEditingShift(null);
                setFormData({
                  name: '',
                  code: '',
                  description: '',
                  shiftType: 'MORNING',
                  startTime: '09:00',
                  endTime: '18:00',
                  breakStart: '13:00',
                  breakEnd: '14:00',
                  companyId: '',
                  branchId: '',
                });
                setShowDialog(true);
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Shift
            </Button>
            <Button variant="outline" size="icon" onClick={fetchShifts}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search shifts..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5 w-16 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="text-right"><div className="h-8 w-20 bg-muted rounded ml-auto animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : shifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No shifts found
                    </TableCell>
                  </TableRow>
                ) : (
                  shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{shift.name}</TableCell>
                      <TableCell>{shift.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getShiftIcon(shift.shiftType)}
                          {getShiftTypeLabel(shift.shiftType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{shift.startTime} - {shift.endTime}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {shift.breakStart && shift.breakEnd ? (
                          <span className="text-sm">
                            {shift.breakStart} - {shift.breakEnd}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={shift.isActive ? 'success' : 'secondary'}>
                          {shift.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => router.push(`/shifts/${shift.id}`)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleEdit(shift)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-destructive"
                            onClick={() => handleDelete(shift.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} shifts
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Shift Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingShift ? 'Edit Shift' : 'Add Shift'}
            </DialogTitle>
            <DialogDescription>
              {editingShift
                ? 'Update the shift details'
                : 'Create a new work shift'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Shift name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Code *</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Shift code"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Shift description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Shift Type *</label>
              <Select
                value={formData.shiftType}
                onValueChange={(value) => setFormData({ ...formData, shiftType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">Morning</SelectItem>
                  <SelectItem value="EVENING">Evening</SelectItem>
                  <SelectItem value="NIGHT">Night</SelectItem>
                  <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editingShift ? (editingShift.isActive ? 'active' : 'inactive') : 'active'}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time *</label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time *</label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Break Start</label>
              <Input
                type="time"
                value={formData.breakStart}
                onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Break End</label>
              <Input
                type="time"
                value={formData.breakEnd}
                onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company *</label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => {
                  setFormData({ ...formData, companyId: value, branchId: '' });
                  fetchBranches(value);
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Branch</label>
              <Select
                value={formData.branchId}
                onValueChange={(value) => setFormData({ ...formData, branchId: value })}
                disabled={!formData.companyId}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingShift ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}