'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  Users,
  Clock,
  Briefcase,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

type ReportType = 'attendance' | 'leave' | 'employee' | 'overtime' | 'holiday';

export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [filters, setFilters] = useState({
    companyId: '',
    branchId: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    year: new Date().getFullYear().toString(),
  });

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const params: any = { format };
      if (filters.companyId) params.companyId = filters.companyId;
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.year) params.year = parseInt(filters.year);

      const response = await api.get(`/reports/${reportType}`, {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      link.setAttribute('download', `${reportType}-report.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Success',
        description: 'Report downloaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { value: 'attendance', label: 'Attendance Report', icon: Clock },
    { value: 'leave', label: 'Leave Report', icon: Calendar },
    { value: 'employee', label: 'Employee Report', icon: Users },
    { value: 'overtime', label: 'Overtime Report', icon: Briefcase },
    { value: 'holiday', label: 'Holiday Report', icon: Calendar },
  ];

  const getDateFields = () => {
    if (reportType === 'holiday') {
      return (
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            placeholder="2024"
          />
        </div>
      );
    }
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and download various system reports
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Report Configuration */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Generate Report</CardTitle>
                <CardDescription>
                  Configure and generate reports based on your criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select
                      value={reportType}
                      onValueChange={(value) => setReportType(value as ReportType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      value={format}
                      onValueChange={(value) => setFormat(value as 'pdf' | 'excel')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-red-500" />
                            PDF
                          </div>
                        </SelectItem>
                        <SelectItem value="excel">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-green-500" />
                            Excel
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Company</Label>
                    <Select
                      value={filters.companyId}
                      onValueChange={(value) => setFilters({ ...filters, companyId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All companies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Companies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchId">Branch</Label>
                    <Select
                      value={filters.branchId}
                      onValueChange={(value) => setFilters({ ...filters, branchId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All branches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Branches</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department</Label>
                    <Select
                      value={filters.departmentId}
                      onValueChange={(value) => setFilters({ ...filters, departmentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Departments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    {reportType === 'holiday' ? (
                      <Input
                        type="number"
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                        placeholder="2024"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                        <Input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Reports</CardTitle>
                <CardDescription>Commonly used reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setReportType(type.value as ReportType);
                      setFilters({
                        companyId: '',
                        branchId: '',
                        departmentId: '',
                        startDate: '',
                        endDate: '',
                        year: new Date().getFullYear().toString(),
                      });
                    }}
                  >
                    <type.icon className="mr-2 h-4 w-4" />
                    {type.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}