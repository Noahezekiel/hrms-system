'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Briefcase,
} from 'lucide-react';

interface Position {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
  department?: { id: string; name: string; company: { id: string; name: string } };
  _count?: { employees: number };
}

export default function PositionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    isActive: true,
  });

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/positions', {
        params: { page, limit, search: search || undefined },
      });
      setPositions(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch positions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments', { params: { limit: 100 } });
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchDepartments();
  }, [page, limit, search]);

  const handleSubmit = async () => {
    try {
      if (editingPosition) {
        await api.put(`/positions/${editingPosition.id}`, formData);
        toast({ title: 'Success', description: 'Position updated successfully' });
      } else {
        await api.post('/positions', formData);
        toast({ title: 'Success', description: 'Position created successfully' });
      }
      setShowDialog(false);
      setEditingPosition(null);
      resetForm();
      fetchPositions();
      
      // Invalidate React Query caches
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      if (formData.departmentId) {
        queryClient.invalidateQueries({ queryKey: ['positions', formData.departmentId] });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save position',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position?')) return;
    try {
      await api.delete(`/positions/${id}`);
      toast({ title: 'Success', description: 'Position deleted successfully' });
      fetchPositions();
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete position',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      code: position.code,
      description: position.description || '',
      departmentId: position.departmentId,
      isActive: position.isActive,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', departmentId: '', isActive: true });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Positions</h1>
            <p className="text-muted-foreground">Manage job positions within departments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setEditingPosition(null);
                resetForm();
                setShowDialog(true);
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Position
            </Button>
            <Button variant="outline" size="icon" onClick={fetchPositions}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search positions..."
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
                  <TableHead>Department</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Employees</TableHead>
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
                      <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-12 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5 w-16 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="text-right"><div className="h-8 w-20 bg-muted rounded ml-auto animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : positions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No positions found
                    </TableCell>
                  </TableRow>
                ) : (
                  positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{position.name}</TableCell>
                      <TableCell>{position.code}</TableCell>
                      <TableCell>{position.department?.name || '—'}</TableCell>
                      <TableCell>{position.department?.company?.name || '—'}</TableCell>
                      <TableCell>{position._count?.employees || 0}</TableCell>
                      <TableCell>
                        <Badge variant={position.isActive ? 'success' : 'secondary'}>
                          {position.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="xs" onClick={() => handleEdit(position)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="xs" className="text-destructive" onClick={() => handleDelete(position.id)}>
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
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} positions
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Position Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPosition ? 'Edit Position' : 'Add Position'}</DialogTitle>
            <DialogDescription>
              {editingPosition ? 'Update position details' : 'Create a new position'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.company?.name || 'No company'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Position name"
              />
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Position code"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Position description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingPosition ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}