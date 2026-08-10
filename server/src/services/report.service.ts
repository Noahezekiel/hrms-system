import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { PDFGenerator } from '../utils/pdf';
import { generateExcelBuffer } from '../utils/excel';

export class ReportService {
  async getAttendanceReport(params: {
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    format?: string;
    userId: string;
  }) {
    const { companyId, branchId, departmentId, startDate, endDate, format, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.AttendanceWhereInput = {};
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }
    if (branchId) {
      where.branchId = branchId;
    }
    if (departmentId) {
      where.employee = { departmentId };
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
        shift: true,
        branch: {
          select: { id: true, name: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const reportData = attendances.map(a => ({
      'Employee ID': a.employee?.employeeId || 'N/A',
      'Employee Name': a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : 'N/A',
      'Email': a.employee?.email || 'N/A',
      'Department': a.employee?.department?.name || 'N/A',
      'Position': a.employee?.position?.name || 'N/A',
      'Date': a.date.toLocaleDateString(),
      'Check In': a.checkIn ? a.checkIn.toLocaleTimeString() : 'N/A',
      'Check Out': a.checkOut ? a.checkOut.toLocaleTimeString() : 'N/A',
      'Total Hours': a.totalHours || 0,
      'Overtime Hours': a.overtimeHours || 0,
      'Status': a.status,
      'Branch': a.branch?.name || 'N/A',
      'Company': a.company?.name || 'N/A',
    }));

    if (format === 'pdf') {
      return this.generateAttendancePDF(reportData, { companyId, branchId, departmentId, startDate, endDate });
    } else if (format === 'excel') {
      return this.generateAttendanceExcel(reportData);
    }

    return reportData;
  }

  private async generateAttendancePDF(data: any[], filters: any): Promise<Buffer> {
    const pdf = new PDFGenerator({
      title: 'Attendance Report',
      author: 'HRMS',
      subject: 'Attendance Report',
      pageSize: 'A4',
      orientation: 'landscape',
      margin: 20,
    });

    let title = 'Attendance Report';
    if (filters.companyId) {
      const company = await prisma.company.findUnique({ where: { id: filters.companyId } });
      title += ` - ${company?.name || ''}`;
    }
    pdf.addHeader(title, `Generated: ${new Date().toLocaleDateString()}`);

    if (filters.startDate || filters.endDate) {
      const period = `${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`;
      pdf.addText(`Period: ${period}`, { fontSize: 12 });
    }

    const columns = [
      { header: 'Employee ID', key: 'Employee ID', width: 80 },
      { header: 'Employee Name', key: 'Employee Name', width: 120 },
      { header: 'Department', key: 'Department', width: 100 },
      { header: 'Position', key: 'Position', width: 100 },
      { header: 'Date', key: 'Date', width: 80 },
      { header: 'Check In', key: 'Check In', width: 70 },
      { header: 'Check Out', key: 'Check Out', width: 70 },
      { header: 'Total Hours', key: 'Total Hours', width: 70 },
      { header: 'Overtime', key: 'Overtime Hours', width: 70 },
      { header: 'Status', key: 'Status', width: 80 },
    ];

    pdf.addTable(columns, data);
    pdf.addFooter();

    return pdf.generateBuffer();
  }

  private async generateAttendanceExcel(data: any[]): Promise<Buffer> {
    return generateExcelBuffer(data, {
      sheetName: 'Attendance Report',
    });
  }

  async getLeaveReport(params: {
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    format?: string;
    userId: string;
  }) {
    const { companyId, branchId, departmentId, startDate, endDate, format, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.LeaveRequestWhereInput = {};
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }
    if (branchId) {
      where.branchId = branchId;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    if (Object.keys(dateFilter).length > 0) {
      where.startDate = dateFilter;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reportData = leaveRequests.map(l => ({
      'Employee ID': l.employee?.employeeId || 'N/A',
      'Employee Name': l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'N/A',
      'Email': l.employee?.email || 'N/A',
      'Department': l.employee?.department?.name || 'N/A',
      'Position': l.employee?.position?.name || 'N/A',
      'Leave Type': l.leaveType,
      'Start Date': l.startDate.toLocaleDateString(),
      'End Date': l.endDate.toLocaleDateString(),
      'Total Days': l.totalDays,
      'Status': l.status,
      'Reason': l.reason || 'N/A',
      'Approved By': l.approvedBy || 'N/A',
      'Approved At': l.approvedAt ? l.approvedAt.toLocaleDateString() : 'N/A',
      'Company': l.company?.name || 'N/A',
      'Branch': l.branch?.name || 'N/A',
    }));

    if (format === 'pdf') {
      return this.generateLeavePDF(reportData);
    } else if (format === 'excel') {
      return this.generateLeaveExcel(reportData);
    }

    return reportData;
  }

  private async generateLeavePDF(data: any[]): Promise<Buffer> {
    const pdf = new PDFGenerator({
      title: 'Leave Report',
      author: 'HRMS',
      subject: 'Leave Report',
      pageSize: 'A4',
      orientation: 'landscape',
      margin: 20,
    });

    pdf.addHeader('Leave Report', `Generated: ${new Date().toLocaleDateString()}`);

    const columns = [
      { header: 'Employee ID', key: 'Employee ID', width: 80 },
      { header: 'Employee Name', key: 'Employee Name', width: 120 },
      { header: 'Department', key: 'Department', width: 100 },
      { header: 'Leave Type', key: 'Leave Type', width: 80 },
      { header: 'Start Date', key: 'Start Date', width: 80 },
      { header: 'End Date', key: 'End Date', width: 80 },
      { header: 'Total Days', key: 'Total Days', width: 60 },
      { header: 'Status', key: 'Status', width: 80 },
    ];

    pdf.addTable(columns, data);
    pdf.addFooter();

    return pdf.generateBuffer();
  }

  private async generateLeaveExcel(data: any[]): Promise<Buffer> {
    return generateExcelBuffer(data, {
      sheetName: 'Leave Report',
    });
  }

  async getEmployeeReport(params: {
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    isActive?: boolean;
    format?: string;
    userId: string;
  }) {
    const { companyId, branchId, departmentId, isActive, format, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.EmployeeWhereInput = {};
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }
    if (branchId) {
      where.branchId = branchId;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
        user: {
          select: { id: true, email: true, role: true },
        },
        _count: {
          select: {
            attendance: true,
            leaveRequests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reportData = employees.map(e => ({
      'Employee ID': e.employeeId,
      'First Name': e.firstName,
      'Last Name': e.lastName,
      'Email': e.email,
      'Phone': e.phone || 'N/A',
      'Gender': e.gender,
      'Date of Birth': e.dateOfBirth.toLocaleDateString(),
      'Hire Date': e.hireDate.toLocaleDateString(),
      'Termination Date': e.terminationDate ? e.terminationDate.toLocaleDateString() : 'N/A',
      'Status': e.isActive ? 'Active' : 'Inactive',
      'Department': e.department?.name || 'N/A',
      'Position': e.position?.name || 'N/A',
      'Manager': e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : 'N/A',
      'Company': e.company?.name || 'N/A',
      'Branch': e.branch?.name || 'N/A',
      'Attendance Count': e._count.attendance,
      'Leave Count': e._count.leaveRequests,
    }));

    if (format === 'pdf') {
      return this.generateEmployeePDF(reportData);
    } else if (format === 'excel') {
      return this.generateEmployeeExcel(reportData);
    }

    return reportData;
  }

  private async generateEmployeePDF(data: any[]): Promise<Buffer> {
    const pdf = new PDFGenerator({
      title: 'Employee Report',
      author: 'HRMS',
      subject: 'Employee Report',
      pageSize: 'A4',
      orientation: 'landscape',
      margin: 20,
    });

    pdf.addHeader('Employee Report', `Generated: ${new Date().toLocaleDateString()}`);

    const columns = [
      { header: 'Employee ID', key: 'Employee ID', width: 80 },
      { header: 'Name', key: 'First Name', width: 120 },
      { header: 'Email', key: 'Email', width: 120 },
      { header: 'Department', key: 'Department', width: 100 },
      { header: 'Position', key: 'Position', width: 100 },
      { header: 'Status', key: 'Status', width: 60 },
      { header: 'Hire Date', key: 'Hire Date', width: 80 },
    ];

    pdf.addTable(columns, data);
    pdf.addFooter();

    return pdf.generateBuffer();
  }

  private async generateEmployeeExcel(data: any[]): Promise<Buffer> {
    return generateExcelBuffer(data, {
      sheetName: 'Employee Report',
    });
  }

  async getOvertimeReport(params: {
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    format?: string;
    userId: string;
  }) {
    const { companyId, branchId, departmentId, startDate, endDate, format, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.AttendanceWhereInput = { isOvertime: true };
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }
    if (branchId) {
      where.branchId = branchId;
    }
    if (departmentId) {
      where.employee = { departmentId };
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }

    const overtimeRecords = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
        shift: true,
        branch: {
          select: { id: true, name: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const reportData = overtimeRecords.map(o => ({
      'Employee ID': o.employee?.employeeId || 'N/A',
      'Employee Name': o.employee ? `${o.employee.firstName} ${o.employee.lastName}` : 'N/A',
      'Department': o.employee?.department?.name || 'N/A',
      'Position': o.employee?.position?.name || 'N/A',
      'Date': o.date.toLocaleDateString(),
      'Check In': o.checkIn ? o.checkIn.toLocaleTimeString() : 'N/A',
      'Check Out': o.checkOut ? o.checkOut.toLocaleTimeString() : 'N/A',
      'Total Hours': o.totalHours || 0,
      'Overtime Hours': o.overtimeHours || 0,
      'Branch': o.branch?.name || 'N/A',
      'Company': o.company?.name || 'N/A',
    }));

    if (format === 'pdf') {
      return this.generateOvertimePDF(reportData);
    } else if (format === 'excel') {
      return this.generateOvertimeExcel(reportData);
    }

    return reportData;
  }

  private async generateOvertimePDF(data: any[]): Promise<Buffer> {
    const pdf = new PDFGenerator({
      title: 'Overtime Report',
      author: 'HRMS',
      subject: 'Overtime Report',
      pageSize: 'A4',
      orientation: 'landscape',
      margin: 20,
    });

    pdf.addHeader('Overtime Report', `Generated: ${new Date().toLocaleDateString()}`);

    const columns = [
      { header: 'Employee ID', key: 'Employee ID', width: 80 },
      { header: 'Employee Name', key: 'Employee Name', width: 120 },
      { header: 'Department', key: 'Department', width: 100 },
      { header: 'Date', key: 'Date', width: 80 },
      { header: 'Total Hours', key: 'Total Hours', width: 70 },
      { header: 'Overtime Hours', key: 'Overtime Hours', width: 80 },
    ];

    pdf.addTable(columns, data);
    pdf.addFooter();

    return pdf.generateBuffer();
  }

  private async generateOvertimeExcel(data: any[]): Promise<Buffer> {
    return generateExcelBuffer(data, {
      sheetName: 'Overtime Report',
    });
  }

  async getHolidayReport(params: {
    companyId?: string;
    branchId?: string;
    year?: number;
    format?: string;
    userId: string;
  }) {
    const { companyId, branchId, year, format, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.HolidayWhereInput = {};
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }
    if (branchId) {
      where.branchId = branchId;
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    const reportData = holidays.map(h => ({
      'Name': h.name,
      'Date': h.date.toLocaleDateString(),
      'Description': h.description || 'N/A',
      'Recurring': h.isRecurring ? 'Yes' : 'No',
      'Company': h.company?.name || 'N/A',
      'Branch': h.branch?.name || 'Global',
    }));

    if (format === 'pdf') {
      return this.generateHolidayPDF(reportData);
    } else if (format === 'excel') {
      return this.generateHolidayExcel(reportData);
    }

    return reportData;
  }

  private async generateHolidayPDF(data: any[]): Promise<Buffer> {
    const pdf = new PDFGenerator({
      title: 'Holiday Report',
      author: 'HRMS',
      subject: 'Holiday Report',
      pageSize: 'A4',
      margin: 20,
    });

    pdf.addHeader('Holiday Report', `Generated: ${new Date().toLocaleDateString()}`);

    const columns = [
      { header: 'Name', key: 'Name', width: 150 },
      { header: 'Date', key: 'Date', width: 100 },
      { header: 'Description', key: 'Description', width: 200 },
      { header: 'Recurring', key: 'Recurring', width: 70 },
    ];

    pdf.addTable(columns, data);
    pdf.addFooter();

    return pdf.generateBuffer();
  }

  private async generateHolidayExcel(data: any[]): Promise<Buffer> {
    return generateExcelBuffer(data, {
      sheetName: 'Holiday Report',
    });
  }
}