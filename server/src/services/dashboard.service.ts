import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

export class DashboardService {
  async getOverview(params: {
    companyId?: string;
    branchId?: string;
    period?: string;
    userId: string;
  }) {
    const { companyId, branchId, period, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const whereEmployee: Prisma.EmployeeWhereInput = {};
    const whereAttendance: Prisma.AttendanceWhereInput = {};
    const whereLeave: Prisma.LeaveRequestWhereInput = {};

    if (currentUser.role !== 'SUPER_ADMIN') {
      const compId = currentUser.companyId || undefined;
      whereEmployee.companyId = compId;
      whereAttendance.companyId = compId;
      whereLeave.companyId = compId;
    }

    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      whereEmployee.companyId = companyId;
      whereAttendance.companyId = companyId;
      whereLeave.companyId = companyId;
    }

    if (branchId) {
      whereEmployee.branchId = branchId;
      whereAttendance.branchId = branchId;
      whereLeave.branchId = branchId;
    }

    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        previousStartDate = new Date(startDate);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        previousStartDate = new Date(startDate);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        break;
    }

    const totalEmployees = await prisma.employee.count({
      where: whereEmployee,
    });

    const activeEmployees = await prisma.employee.count({
      where: {
        ...whereEmployee,
        isActive: true,
      },
    });

    const attendanceWhereCurrent: Prisma.AttendanceWhereInput = {
      ...whereAttendance,
      date: {
        gte: startDate,
        lte: now,
      },
    };

    const attendanceCurrent = await prisma.attendance.findMany({
      where: attendanceWhereCurrent,
    });

    const totalAttendance = attendanceCurrent.length;
    const present = attendanceCurrent.filter(a => a.status === 'PRESENT').length;
    const absent = attendanceCurrent.filter(a => a.status === 'ABSENT').length;
    const late = attendanceCurrent.filter(a => a.status === 'LATE').length;
    const halfDay = attendanceCurrent.filter(a => a.status === 'HALF_DAY').length;

    const attendanceWherePrevious: Prisma.AttendanceWhereInput = {
      ...whereAttendance,
      date: {
        gte: previousStartDate,
        lt: startDate,
      },
    };

    const attendancePrevious = await prisma.attendance.findMany({
      where: attendanceWherePrevious,
    });

    const totalAttendancePrevious = attendancePrevious.length;

    const attendanceRate = totalEmployees > 0 ? Math.round((totalAttendance / totalEmployees) * 100) : 0;
    const previousAttendanceRate = totalEmployees > 0 ? Math.round((totalAttendancePrevious / totalEmployees) * 100) : 0;

    const leaveWhere: Prisma.LeaveRequestWhereInput = {
      ...whereLeave,
      status: 'PENDING',
    };

    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: leaveWhere,
    });

    const approvedLeaveRequests = await prisma.leaveRequest.count({
      where: {
        ...whereLeave,
        status: 'APPROVED',
      },
    });

    const rejectedLeaveRequests = await prisma.leaveRequest.count({
      where: {
        ...whereLeave,
        status: 'REJECTED',
      },
    });

    const overtimeWhere = {
      ...whereAttendance,
      isOvertime: true,
      date: {
        gte: startDate,
        lte: now,
      },
    };

    const overtimeRecords = await prisma.attendance.findMany({
      where: overtimeWhere,
    });

    const totalOvertimeHours = overtimeRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

    // Get departments with employee count - use type assertion for the where clause
    const deptWhere: any = {};
    if (whereEmployee.companyId) {
      deptWhere.companyId = whereEmployee.companyId;
    }
    const departments = await prisma.department.findMany({
      where: {
        ...deptWhere,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    const departmentDistribution = departments.map(d => ({
      name: d.name,
      count: (d as any)._count.employees,
    }));

    const trend = {
      attendance: attendanceRate - previousAttendanceRate,
      employees: activeEmployees - (totalEmployees - activeEmployees),
      leave: pendingLeaveRequests - (pendingLeaveRequests - approvedLeaveRequests) / 2,
    };

    return {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
      },
      attendance: {
        total: totalAttendance,
        present,
        absent,
        late,
        halfDay,
        rate: attendanceRate,
        previousRate: previousAttendanceRate,
        trend: trend.attendance,
      },
      leave: {
        pending: pendingLeaveRequests,
        approved: approvedLeaveRequests,
        rejected: rejectedLeaveRequests,
      },
      overtime: {
        totalRecords: overtimeRecords.length,
        totalHours: Math.round(totalOvertimeHours * 100) / 100,
      },
      departmentDistribution,
    };
  }

  async getAttendanceChart(params: {
    companyId?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
    userId: string;
  }) {
    const { companyId, branchId, startDate, endDate, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.AttendanceWhereInput = {};
    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    where.date = {
      gte: start,
      lte: end,
    };

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const chartData = attendances.reduce((acc, a) => {
      const dateKey = a.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          total: 0,
        };
      }
      acc[dateKey].total++;
      switch (a.status) {
        case 'PRESENT':
          acc[dateKey].present++;
          break;
        case 'ABSENT':
          acc[dateKey].absent++;
          break;
        case 'LATE':
          acc[dateKey].late++;
          break;
        case 'HALF_DAY':
          acc[dateKey].halfDay++;
          break;
      }
      return acc;
    }, {} as Record<string, { date: string; present: number; absent: number; late: number; halfDay: number; total: number }>);

    return Object.values(chartData);
  }

  async getDepartmentStats(params: {
    companyId?: string;
    branchId?: string;
    userId: string;
  }) {
    const { companyId, branchId, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const whereCompany: Prisma.DepartmentWhereInput = {};
    if (currentUser.role !== 'SUPER_ADMIN') {
      whereCompany.companyId = currentUser.companyId || undefined;
    }
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      whereCompany.companyId = companyId;
    }
    if (branchId) {
      whereCompany.branchId = branchId;
    }

    const departments = await prisma.department.findMany({
      where: whereCompany,
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            attendance: {
              where: {
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    const result = departments.map(dept => {
      const totalEmployees = (dept as any)._count.employees;
      const presentToday = dept.employees.filter(emp =>
        emp.attendance.some(a => a.status === 'PRESENT')
      ).length;
      const absentToday = dept.employees.filter(emp =>
        emp.attendance.length === 0 || emp.attendance.some(a => a.status === 'ABSENT')
      ).length;

      return {
        name: dept.name,
        id: dept.id,
        totalEmployees,
        presentToday,
        absentToday,
        attendanceRate: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0,
      };
    });

    return result;
  }

  async getRecentActivity(params: {
    companyId?: string;
    branchId?: string;
    limit: number;
    userId: string;
  }) {
    const { companyId, branchId, limit, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.AuditLogWhereInput = {};
    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    const attendanceWhere: Prisma.AttendanceWhereInput = {};
    if (currentUser.role !== 'SUPER_ADMIN') {
      attendanceWhere.companyId = currentUser.companyId || undefined;
    }
    if (companyId) {
      attendanceWhere.companyId = companyId;
    }
    if (branchId) {
      attendanceWhere.branchId = branchId;
    }

    const recentAttendance = await prisma.attendance.findMany({
      where: {
        ...attendanceWhere,
        OR: [
          { checkIn: { not: null } },
          { checkOut: { not: null } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    const activities = [
      ...auditLogs.map(log => ({
        type: 'audit' as const,
        id: log.id,
        user: log.user,
        action: log.action,
        entity: log.entity,
        createdAt: log.createdAt,
        companyId: log.companyId,
        branchId: log.branchId,
      })),
      ...recentAttendance.map(att => ({
        type: 'attendance' as const,
        id: att.id,
        employee: att.employee,
        action: att.checkIn && !att.checkOut ? 'CHECK_IN' : att.checkOut ? 'CHECK_OUT' : 'UNKNOWN',
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        createdAt: att.updatedAt,
        companyId: att.companyId,
        branchId: att.branchId,
      })),
    ];

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return activities.slice(0, limit);
  }

  async getLeaveStats(params: {
    companyId?: string;
    branchId?: string;
    userId: string;
  }) {
    const { companyId, branchId, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.LeaveRequestWhereInput = {};
    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      select: {
        status: true,
        leaveType: true,
        totalDays: true,
        startDate: true,
        endDate: true,
      },
    });

    const total = leaveRequests.length;
    const pending = leaveRequests.filter(l => l.status === 'PENDING').length;
    const approved = leaveRequests.filter(l => l.status === 'APPROVED').length;
    const rejected = leaveRequests.filter(l => l.status === 'REJECTED').length;
    const cancelled = leaveRequests.filter(l => l.status === 'CANCELLED').length;

    const totalDays = leaveRequests.reduce((sum, l) => sum + l.totalDays, 0);

    const byType = leaveRequests.reduce((acc, l) => {
      const type = l.leaveType;
      if (!acc[type]) acc[type] = { count: 0, days: 0 };
      acc[type].count++;
      acc[type].days += l.totalDays;
      return acc;
    }, {} as Record<string, { count: number; days: number }>);

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled,
      totalDays,
      byType,
    };
  }

  async getEmployeeStats(params: {
    companyId?: string;
    branchId?: string;
    userId: string;
  }) {
    const { companyId, branchId, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.EmployeeWhereInput = {};
    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const total = await prisma.employee.count({ where });
    const active = await prisma.employee.count({ where: { ...where, isActive: true } });
    const inactive = total - active;

    const male = await prisma.employee.count({ where: { ...where, gender: 'MALE' } });
    const female = await prisma.employee.count({ where: { ...where, gender: 'FEMALE' } });
    const other = await prisma.employee.count({ where: { ...where, gender: 'OTHER' } });

    const deptWhere: any = {};
    if (where.companyId) {
      deptWhere.companyId = where.companyId;
    }
    const departments = await prisma.department.findMany({
      where: {
        ...deptWhere,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    const byDepartment = departments.map(d => ({
      name: d.name,
      count: (d as any)._count.employees,
    }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newHires = await prisma.employee.count({
      where: {
        ...where,
        hireDate: { gte: thirtyDaysAgo },
      },
    });

    return {
      total,
      active,
      inactive,
      gender: { male, female, other },
      byDepartment,
      newHires,
    };
  }
}