'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { getStatusColor, getLeaveTypeLabel, formatDate } from '@/lib/utils';
import { LeaveRequest } from '@/types/employee';

export default function LeavePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    leaveType: '',
    startDate: '',
    endDate: '',
  });

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leave', {
        params: {
          page,
          limit,
          search: search || undefined,
          ...filters,
        },
      });
      setLeaveRequests(response.data.data);
      setTotal(response.data.pagination.total);
      setSummary(response.data.summary);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch leave requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [page, limit, search, filters]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/leave/${id}/approve`);
      toast({
        title: 'Success',
        description: 'Leave request approved',
      });
      fetchLeaveRequests();
      setShowApproveDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve leave',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/leave/${id}/reject`, { rejectedReason: 'Request rejected' });
      toast({
        title: 'Success',
        description: 'Leave request rejected',
      });
      fetchLeaveRequests();
      setShowRejectDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject leave',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await api.post(`/leave/${id}/cancel`);
      toast({
        title: 'Success',
        description: 'Leave request cancelled',
      });
      fetchLeaveRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel leave',
        variant: 'destructive',
      });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
            <p className="text-muted-foreground">
              Manage employee leave requests and approvals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/leave/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
            <Button variant="outline" size="icon" onClick={fetchLeaveRequests}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{summary.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{summary.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by employee name or ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.leaveType}
              onValueChange={(value) => setFilters({ ...filters, leaveType: value })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="ANNUAL">Annual</SelectItem>
                <SelectItem value="SICK">Sick</SelectItem>
                <SelectItem value="CASUAL">Casual</SelectItem>
                <SelectItem value="MATERNITY">Maternity</SelectItem>
                <SelectItem value="PATERNITY">Paternity</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchLeaveRequests}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : leaveRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.employee?.avatar} />
                            <AvatarFallback>
                              {request.employee?.firstName?.[0]}{request.employee?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {request.employee?.firstName} {request.employee?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.employee?.employeeId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getLeaveTypeLabel(request.leaveType)}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>From: {formatDate(request.startDate)}</p>
                          <p>To: {formatDate(request.endDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{request.totalDays}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => router.push(`/leave/${request.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-green-600"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowApproveDialog(true);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {(request.status === 'PENDING' || request.status === 'APPROVED') && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-muted-foreground"
                              onClick={() => handleCancel(request.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
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
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} requests
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

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this leave request?
              {selectedRequest && (
                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                  <p><strong>Employee:</strong> {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</p>
                  <p><strong>Type:</strong> {getLeaveTypeLabel(selectedRequest.leaveType)}</p>
                  <p><strong>Days:</strong> {selectedRequest.totalDays}</p>
                  <p><strong>Period:</strong> {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedRequest && handleApprove(selectedRequest.id)}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this leave request?
              {selectedRequest && (
                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                  <p><strong>Employee:</strong> {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</p>
                  <p><strong>Type:</strong> {getLeaveTypeLabel(selectedRequest.leaveType)}</p>
                  <p><strong>Days:</strong> {selectedRequest.totalDays}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && handleReject(selectedRequest.id)}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}