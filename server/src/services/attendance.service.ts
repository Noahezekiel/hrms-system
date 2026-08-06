import { Prisma, Attendance, AttendanceStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';
import { io } from '../index';

export interface CheckInInput {
  employeeId: string;
  photo?: string;
  note?: string;
  latitude?: string;
  longitude?: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CheckOutInput {
  employeeId: string;
  photo?: string;
  note?: string;
  latitude?: string;
  longitude?: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BreakInput {
  employeeId: string;
  photo?: string;
  note?: string;
  userId: string;
}

export interface ManualAttendanceInput {
  employeeId: string;
  date: string | Date;
  checkIn?: string | Date;
  checkOut?: string | Date;
  breakIn?: string | Date;
  breakOut?: string | Date;
  status: AttendanceStatus;
  notes?: string;
  userId: string;
}

export class AttendanceService {
  async getAllAttendance(params: {
    page: number;
    limit: number;
    employeeId?: string;
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    userId: string;
  }) {
    const { page, limit, employeeId, companyId, branchId, departmentId, startDate, endDate, status, userId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, branchId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    // Build where clause
    const where: Prisma.AttendanceWhereInput = {};

    // Super admin can see all; others see only their company
    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
      if (currentUser.role === 'DEPARTMENT_MANAGER') {
        where.employee = { departmentId: currentUser.departmentId || undefined };
      }
      if (currentUser.role === 'STAFF') {
        const employee = await prisma.employee.findFirst({
          where: { user: { id: userId } },
          select: { id: true },
        });
        if (employee) {
          where.employeeId = employee.id;
        } else {
          where.employeeId = 'nonexistent';
        }
      }
    }

    // Apply filters
    if (employeeId) {
      where.employeeId = employeeId;
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
    if (departmentId) {
      where.employee = { departmentId };
    }
    if (startDate) {
      where.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = { ...where.date, lte: end };
    }
    if (status) {
      where.status = status as AttendanceStatus;
    }

    // Get total count
    const total = await prisma.attendance.count({ where });

    // Get attendance records
    const attendance = await prisma.attendance.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
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
    });

    // Calculate summary
    const summary = await this.calculateAttendanceSummary(where);

    return {
      attendance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    };
  }

  private async calculateAttendanceSummary(where: Prisma.AttendanceWhereInput) {
    const attendances = await prisma.attendance.findMany({ where });
    const total = attendances.length;
    const present = attendances.filter(a => a.status === 'PRESENT').length;
    const absent = attendances.filter(a => a.status === 'ABSENT').length;
    const late = attendances.filter(a => a.status === 'LATE').length;
    const halfDay = attendances.filter(a => a.status === 'HALF_DAY').length;
    const holiday = attendances.filter(a => a.status === 'HOLIDAY').length;
    const leave = attendances.filter(a => a.status === 'LEAVE').length;
    const overtime = attendances.filter(a => a.isOvertime).length;

    const totalHours = attendances.reduce((sum, a) => sum + (a.totalHours || 0), 0);
    const totalOvertimeHours = attendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

    return {
      total,
      present,
      absent,
      late,
      halfDay,
      holiday,
      leave,
      overtime,
      totalHours: Math.round(totalHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    };
  }

  async getAttendanceById(id: string, userId: string) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
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
    });

    if (!attendance) {
      throw new ApiError(404, 'Attendance record not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && attendance.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'DEPARTMENT_MANAGER') {
      const employee = await prisma.employee.findUnique({
        where: { id: attendance.employeeId },
        select: { departmentId: true },
      });
      if (employee && employee.departmentId !== currentUser.departmentId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    if (currentUser.role === 'STAFF') {
      const currentEmployee = await prisma.employee.findFirst({
        where: { user: { id: userId } },
        select: { id: true },
      });
      if (!currentEmployee || currentEmployee.id !== attendance.employeeId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    return attendance;
  }

  async checkIn(input: CheckInInput) {
    const { employeeId, photo, note, latitude, longitude, userId, ipAddress, userAgent } = input;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        company: true,
        branch: true,
        department: true,
        position: true,
      },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    if (!employee.isActive) {
      throw new ApiError(403, 'Employee is not active');
    }

    // Check if user has permission
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existing && existing.checkIn) {
      throw new ApiError(409, 'Already checked in today');
    }

    // Get shift for employee
    const employeeShift = await prisma.employeeShift.findFirst({
      where: {
        employeeId,
        isActive: true,
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        shift: true,
      },
    });

    const shift = employeeShift?.shift || null;

    // Determine status based on shift start time
    let status: AttendanceStatus = 'PRESENT';
    const now = new Date();
    if (shift) {
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      const shiftStart = new Date(now);
      shiftStart.setHours(startHour, startMinute, 0, 0);
      const gracePeriodMinutes = 15; // Configurable
      const graceEnd = new Date(shiftStart.getTime() + gracePeriodMinutes * 60000);
      if (now > graceEnd) {
        status = 'LATE';
      }
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(),
        checkIn: new Date(),
        checkInPhoto: photo || null,
        status,
        shiftId: shift?.id || null,
        companyId: employee.companyId,
        branchId: employee.branchId || null,
        notes: note || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        shift: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CHECK_IN',
        entity: 'Attendance',
        entityId: attendance.id,
        changes: { employeeId, checkIn: attendance.checkIn, status },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        companyId: employee.companyId,
        branchId: employee.branchId || null,
      },
    });

    // Emit socket event
    if (io) {
      io.emitAttendanceUpdate(employeeId, {
        type: 'CHECK_IN',
        attendance,
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return attendance;
  }

  async checkOut(input: CheckOutInput) {
    const { employeeId, photo, note, latitude, longitude, userId, ipAddress, userAgent } = input;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        company: true,
      },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Find today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (!attendance) {
      throw new ApiError(404, 'No check-in found for today');
    }

    if (attendance.checkOut) {
      throw new ApiError(409, 'Already checked out today');
    }

    // Update attendance with check-out
    const now = new Date();
    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        checkOutPhoto: photo || null,
        notes: note ? (attendance.notes ? attendance.notes + ' ' + note : note) : attendance.notes,
        updatedAt: new Date(),
        totalHours: this.calculateTotalHours(attendance.checkIn!, now, attendance.breakIn, attendance.breakOut),
        // Calculate overtime if needed
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        shift: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CHECK_OUT',
        entity: 'Attendance',
        entityId: updated.id,
        changes: { employeeId, checkOut: now },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        companyId: employee.companyId,
        branchId: employee.branchId || null,
      },
    });

    // Emit socket event
    if (io) {
      io.emitAttendanceUpdate(employeeId, {
        type: 'CHECK_OUT',
        attendance: updated,
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async breakIn(input: BreakInput) {
    const { employeeId, photo, note, userId } = input;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Find today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (!attendance) {
      throw new ApiError(404, 'No check-in found for today');
    }

    if (attendance.breakIn) {
      throw new ApiError(409, 'Break already started');
    }

    // Update attendance with break-in
    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        breakIn: new Date(),
        breakInPhoto: photo || null,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BREAK_IN',
        entity: 'Attendance',
        entityId: updated.id,
        changes: { employeeId, breakIn: updated.breakIn },
        companyId: employee.companyId,
        branchId: employee.branchId || null,
      },
    });

    if (io) {
      io.emitAttendanceUpdate(employeeId, {
        type: 'BREAK_IN',
        attendance: updated,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async breakOut(input: BreakInput) {
    const { employeeId, photo, note, userId } = input;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (!attendance) {
      throw new ApiError(404, 'No check-in found for today');
    }

    if (!attendance.breakIn) {
      throw new ApiError(400, 'No break started');
    }

    if (attendance.breakOut) {
      throw new ApiError(409, 'Break already ended');
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        breakOut: new Date(),
        breakOutPhoto: photo || null,
        updatedAt: new Date(),
        totalHours: this.calculateTotalHours(
          attendance.checkIn!,
          attendance.checkOut || new Date(),
          attendance.breakIn,
          new Date()
        ),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BREAK_OUT',
        entity: 'Attendance',
        entityId: updated.id,
        changes: { employeeId, breakOut: updated.breakOut },
        companyId: employee.companyId,
        branchId: employee.branchId || null,
      },
    });

    if (io) {
      io.emitAttendanceUpdate(employeeId, {
        type: 'BREAK_OUT',
        attendance: updated,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  private calculateTotalHours(checkIn: Date, checkOut: Date, breakIn?: Date | null, breakOut?: Date | null): number {
    let totalMs = checkOut.getTime() - checkIn.getTime();
    if (breakIn && breakOut) {
      totalMs -= (breakOut.getTime() - breakIn.getTime());
    }
    const hours = totalMs / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100;
  }

  async getTodayAttendance(params: {
    employeeId?: string;
    companyId?: string;
    branchId?: string;
    userId: string;
  }) {
    const { employeeId, companyId, branchId, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Prisma.AttendanceWhereInput = {
      date: {
        gte: today,
        lt: tomorrow,
      },
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }
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

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
        shift: true,
      },
    });

    return attendance;
  }

  async getEmployeeAttendanceSummary(params: {
    employeeId: string;
    startDate?: string;
    endDate?: string;
    userId: string;
  }) {
    const { employeeId, startDate, endDate, userId } = params;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, departmentId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const where: Prisma.AttendanceWhereInput = { employeeId };
    if (startDate) {
      where.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = { ...where.date, lte: end };
    }

    return this.calculateAttendanceSummary(where);
  }

  async getAttendanceStats(params: {
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
    if (startDate) {
      where.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = { ...where.date, lte: end };
    }

    const attendances = await prisma.attendance.findMany({ where });
    const totalEmployees = await prisma.employee.count({
      where: {
        companyId: where.companyId || undefined,
        branchId: where.branchId || undefined,
        isActive: true,
      },
    });

    const presentToday = attendances.filter(a => a.status === 'PRESENT').length;
    const absentToday = attendances.filter(a => a.status === 'ABSENT').length;
    const lateToday = attendances.filter(a => a.status === 'LATE').length;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      attendanceRate: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0,
    };
  }

  async manualAttendance(input: ManualAttendanceInput) {
    const { employeeId, date, checkIn, checkOut, breakIn, breakOut, status, notes, userId } = input;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this date
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: dateObj,
          lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existing) {
      throw new ApiError(409, 'Attendance record already exists for this date');
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: dateObj,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        breakIn: breakIn ? new Date(breakIn) : null,
        breakOut: breakOut ? new Date(breakOut) : null,
        status,
        notes,
        companyId: employee.companyId,
        branchId: employee.branchId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Attendance',
        entityId: attendance.id,
        changes: { input },
        companyId: employee.companyId,
        branchId: employee.branchId || null,
      },
    });

    return attendance;
  }

  async updateAttendance(id: string, data: any, userId: string) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!attendance) {
      throw new ApiError(404, 'Attendance record not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && attendance.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
        breakIn: data.breakIn ? new Date(data.breakIn) : undefined,
        breakOut: data.breakOut ? new Date(data.breakOut) : undefined,
        status: data.status,
        notes: data.notes,
        isOvertime: data.isOvertime,
        overtimeHours: data.overtimeHours,
        totalHours: data.totalHours,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Attendance',
        entityId: id,
        changes: { before: attendance, after: data },
        companyId: attendance.companyId,
        branchId: attendance.branchId || null,
      },
    });

    return updated;
  }

  async deleteAttendance(id: string, userId: string) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });
    if (!attendance) {
      throw new ApiError(404, 'Attendance record not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && attendance.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    await prisma.attendance.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Attendance',
        entityId: id,
        changes: { deleted: attendance },
        companyId: attendance.companyId,
        branchId: attendance.branchId || null,
      },
    });
  }

  async markOvertime(id: string, overtimeHours: number, notes?: string, userId?: string) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });
    if (!attendance) {
      throw new ApiError(404, 'Attendance record not found');
    }

    if (userId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, companyId: true },
      });
      if (!currentUser) {
        throw new ApiError(404, 'User not found');
      }
      if (currentUser.role !== 'SUPER_ADMIN' && attendance.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        isOvertime: true,
        overtimeHours,
        notes: notes ? (attendance.notes ? attendance.notes + ' ' + notes : notes) : attendance.notes,
        updatedAt: new Date(),
      },
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entity: 'Attendance',
          entityId: id,
          changes: { overtimeHours, notes },
          companyId: attendance.companyId,
          branchId: attendance.branchId || null,
        },
      });
    }

    return updated;
  }

  async getOvertimeReport(params: {
    startDate?: string;
    endDate?: string;
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    userId: string;
  }) {
    const { startDate, endDate, companyId, branchId, departmentId, userId } = params;

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
    if (startDate) {
      where.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = { ...where.date, lte: end };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalOvertimeHours = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
    const totalEmployees = new Set(records.map(r => r.employeeId)).size;

    return {
      records,
      summary: {
        totalRecords: records.length,
        totalEmployees,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        averageOvertimeHours: records.length > 0 ? Math.round((totalOvertimeHours / records.length) * 100) / 100 : 0,
      },
    };
  }
}