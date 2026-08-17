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
  Building2,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  companyId: string;
  company?: { id: string; name: string };
  _count?: { departments: number; employees: number; shifts: number };
}

export default function BranchesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    phone: '',
    email: '',
    companyId: '',
    isActive: true,
  });

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/branches', {
        params: { page, limit, search: search || undefined },
      });
      setBranches(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch branches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchBranches();
    fetchCompanies();
  }, [page, limit, search]);

  const handleSubmit = async () => {
    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, formData);
        toast({ title: 'Success', description: 'Branch updated successfully' });
      } else {
        await api.post('/branches', formData);
        toast({ title: 'Success', description: 'Branch created successfully' });
      }
      setShowDialog(false);
      setEditingBranch(null);
      resetForm();
      fetchBranches();
      
      // Invalidate React Query caches
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      if (formData.companyId) {
        queryClient.invalidateQueries({ queryKey: ['branches', formData.companyId] });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save branch',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    try {
      await api.delete(`/branches/${id}`);
      toast({ title: 'Success', description: 'Branch deleted successfully' });
      fetchBranches();
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete branch',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      country: branch.country || '',
      zipCode: branch.zipCode || '',
      phone: branch.phone || '',
      email: branch.email || '',
      companyId: branch.companyId,
      isActive: branch.isActive,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      phone: '',
      email: '',
      companyId: '',
      isActive: true,
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
            <p className="text-muted-foreground">Manage company branches and locations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setEditingBranch(null);
                resetForm();
                setShowDialog(true);
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
            <Button variant="outline" size="icon" onClick={fetchBranches}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search branches..."
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
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
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
                      <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5 w-16 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="text-right"><div className="h-8 w-20 bg-muted rounded ml-auto animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : branches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No branches found
                    </TableCell>
                  </TableRow>
                ) : (
                  branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{branch.code}</TableCell>
                      <TableCell>{branch.company?.name || '—'}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          {branch.email && <div>{branch.email}</div>}
                          {branch.phone && <div>{branch.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {branch.city && branch.state ? `${branch.city}, ${branch.state}` : branch.city || branch.state || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={branch.isActive ? 'success' : 'secondary'}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="xs" onClick={() => handleEdit(branch)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="xs" className="text-destructive" onClick={() => handleDelete(branch.id)}>
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
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} branches
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

      {/* Branch Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
            <DialogDescription>
              {editingBranch ? 'Update branch details' : 'Create a new branch'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2 col-span-2">
              <Label>Company *</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => setFormData({ ...formData, companyId: value })}
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
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Branch name"
              />
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Branch code"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country"
              />
            </div>
            <div className="space-y-2">
              <Label>Zip Code</Label>
              <Input
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="Zip code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingBranch ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}