'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  Calendar,
  Info,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  company?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export default function AuditLogsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    startDate: '',
    endDate: '',
  });
  const [stats, setStats] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit-logs', {
        params: {
          page,
          limit,
          search: search || undefined,
          ...filters,
        },
      });
      setLogs(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/audit-logs/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, limit, search, filters]);

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'CREATE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'UPDATE': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'DELETE': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'LOGIN': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'LOGOUT': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'APPROVE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'REJECT': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'CANCEL': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'CHECK_IN': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'CHECK_OUT': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'BREAK_IN': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'BREAK_OUT': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <CheckCircle className="h-4 w-4" />;
      case 'DELETE': return <Trash2 className="h-4 w-4" />;
      case 'UPDATE': return <Info className="h-4 w-4" />;
      case 'LOGIN': return <User className="h-4 w-4" />;
      case 'LOGOUT': return <User className="h-4 w-4" />;
      case 'APPROVE': return <CheckCircle className="h-4 w-4" />;
      case 'REJECT': return <XCircle className="h-4 w-4" />;
      case 'CANCEL': return <XCircle className="h-4 w-4" />;
      case 'CHECK_IN': return <Clock className="h-4 w-4" />;
      case 'CHECK_OUT': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track all system activities and user actions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Action</p>
                  <p className="text-lg font-bold truncate">
                    {Object.entries(stats.byAction || {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([key]) => key)
                      .slice(0, 1)[0] || 'N/A'}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Entity</p>
                  <p className="text-lg font-bold truncate">
                    {Object.entries(stats.byEntity || {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([key]) => key)
                      .slice(0, 1)[0] || 'N/A'}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">
                    {Object.keys(stats.topUsers || {}).length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user or entity..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filters.action}
              onValueChange={(value) => setFilters({ ...filters, action: value })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="APPROVE">Approve</SelectItem>
                <SelectItem value="REJECT">Reject</SelectItem>
                <SelectItem value="CHECK_IN">Check In</SelectItem>
                <SelectItem value="CHECK_OUT">Check Out</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.entity}
              onValueChange={(value) => setFilters({ ...filters, entity: value })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Attendance">Attendance</SelectItem>
                <SelectItem value="LeaveRequest">Leave</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Company">Company</SelectItem>
                <SelectItem value="Department">Department</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-[150px]"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              type="date"
              className="w-[150px]"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
            <Button variant="outline" size="icon" onClick={fetchLogs}>
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
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Timestamp</TableHead>
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
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.user?.avatar} />
                            <AvatarFallback>
                              {log.user?.firstName?.[0]}{log.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {log.user?.firstName} {log.user?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {log.user?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getActionColor(log.action)}>
                            <span className="flex items-center gap-1">
                              {getActionIcon(log.action)}
                              {log.action}
                            </span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {log.entity}
                          <span className="text-xs text-muted-foreground ml-1">
                            #{log.entityId.slice(0, 8)}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} logs
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

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p>{selectedLog.user?.firstName} {selectedLog.user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entity</p>
                  <p>{selectedLog.entity}</p>
                  <p className="text-sm text-muted-foreground">ID: {selectedLog.entityId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p>{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                    <p>{selectedLog.ipAddress}</p>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User Agent</p>
                    <p className="text-sm truncate">{selectedLog.userAgent}</p>
                  </div>
                )}
                {selectedLog.company && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company</p>
                    <p>{selectedLog.company.name}</p>
                  </div>
                )}
                {selectedLog.branch && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Branch</p>
                    <p>{selectedLog.branch.name}</p>
                  </div>
                )}
              </div>
              {selectedLog.changes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Changes</p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}