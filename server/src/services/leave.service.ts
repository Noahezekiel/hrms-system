import { Prisma, LeaveStatus, LeaveType } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { io } from '../index';

export interface LeaveCreateInput {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
  companyId: string;
  branchId?: string;
  departmentId?: string;
}

export interface LeaveUpdateInput {
  leaveType?: LeaveType;
  startDate?: string | Date;
  endDate?: string | Date;
  reason?: string;
  status?: LeaveStatus;
}

export class LeaveService {
  async getAllLeaveRequests(params: {
    page: number;
    limit: number;
    employeeId?: string;
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    status?: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    userId: string;
  }) {
    const { page, limit, employeeId, companyId, branchId, departmentId, status, leaveType, startDate, endDate, userId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, branchId: true, departmentId: true, employeeId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.LeaveRequestWhereInput = {};

    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
      if (currentUser.role === 'DEPARTMENT_MANAGER') {
        where.departmentId = currentUser.departmentId || undefined;
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
      where.departmentId = departmentId;
    }
    if (status) {
      where.status = status as LeaveStatus;
    }
    if (leaveType) {
      where.leaveType = leaveType as LeaveType;
    }
    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (!where.startDate) {
        where.endDate = { lte: end };
      } else {
        where.endDate = { lte: end };
      }
    }

    const total = await prisma.leaveRequest.count({ where });

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
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
    });

    const summary = await this.calculateLeaveSummary(where);

    return {
      leaveRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    };
  }

  private async calculateLeaveSummary(where: Prisma.LeaveRequestWhereInput) {
    const requests = await prisma.leaveRequest.findMany({ where });
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'PENDING').length;
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED').length;
    const cancelled = requests.filter(r => r.status === 'CANCELLED').length;
    const totalDays = requests.reduce((sum, r) => sum + r.totalDays, 0);

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled,
      totalDays,
    };
  }

  async getLeaveRequestById(id: string, userId: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
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
    });

    if (!leaveRequest) {
      throw new ApiError(404, 'Leave request not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, departmentId: true, employeeId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && leaveRequest.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'DEPARTMENT_MANAGER' && leaveRequest.departmentId !== currentUser.departmentId && leaveRequest.employeeId !== currentUser.employeeId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'STAFF') {
      const currentEmployee = await prisma.employee.findFirst({
        where: { user: { id: userId } },
        select: { id: true },
      });
      if (!currentEmployee || currentEmployee.id !== leaveRequest.employeeId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    return leaveRequest;
  }

  async createLeaveRequest(data: LeaveCreateInput, userId: string) {
    const { employeeId, leaveType, startDate, endDate, reason, companyId, branchId, departmentId } = data;

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

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new ApiError(400, 'Start date must be before end date');
    }
    if (start < new Date()) {
      throw new ApiError(400, 'Cannot apply for leave in the past');
    }

    const totalDays = this.calculateLeaveDays(start, end);

    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { not: 'REJECTED' },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });
    if (overlapping) {
      throw new ApiError(409, 'Overlapping leave request exists');
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason: reason || null,
        status: 'PENDING',
        companyId: companyId || employee.companyId,
        branchId: branchId || employee.branchId,
        departmentId: departmentId || employee.departmentId,
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
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'LeaveRequest',
        entityId: leaveRequest.id,
        changes: JSON.stringify({ data }),
        companyId: leaveRequest.companyId,
        branchId: leaveRequest.branchId || null,
      },
    });

    if (io) {
      io.emitLeaveUpdate(leaveRequest.companyId, {
        type: 'LEAVE_CREATED',
        leaveRequest,
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return leaveRequest;
  }

  private calculateLeaveDays(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  async updateLeaveRequest(id: string, data: LeaveUpdateInput, userId: string) {
    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!existing) {
      throw new ApiError(404, 'Leave request not found');
    }

    if (existing.status !== 'PENDING') {
      throw new ApiError(400, 'Cannot update a leave request that is not pending');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, employeeId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && existing.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }
    if (currentUser.role === 'STAFF') {
      const currentEmployee = await prisma.employee.findFirst({
        where: { user: { id: userId } },
        select: { id: true },
      });
      if (!currentEmployee || currentEmployee.id !== existing.employeeId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    let totalDays = existing.totalDays;
    if (data.startDate || data.endDate) {
      const start = data.startDate ? new Date(data.startDate) : existing.startDate;
      const end = data.endDate ? new Date(data.endDate) : existing.endDate;
      if (start > end) {
        throw new ApiError(400, 'Start date must be before end date');
      }
      totalDays = this.calculateLeaveDays(start, end);

      const overlapping = await prisma.leaveRequest.findFirst({
        where: {
          employeeId: existing.employeeId,
          id: { not: id },
          status: { not: 'REJECTED' },
          OR: [
            {
              startDate: { lte: end },
              endDate: { gte: start },
            },
          ],
        },
      });
      if (overlapping) {
        throw new ApiError(409, 'Overlapping leave request exists');
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        leaveType: data.leaveType,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        totalDays,
        reason: data.reason,
        status: data.status,
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
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'LeaveRequest',
        entityId: id,
        changes: JSON.stringify({ before: existing, after: data }),
        companyId: existing.companyId,
        branchId: existing.branchId || null,
      },
    });

    return updated;
  }

  async approveLeaveRequest(id: string, approvedBy: string, _notes?: string, userId?: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!leaveRequest) {
      throw new ApiError(404, 'Leave request not found');
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new ApiError(400, 'Leave request is not pending');
    }

    if (userId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, companyId: true },
      });
      if (!currentUser) {
        throw new ApiError(404, 'User not found');
      }
      if (currentUser.role !== 'SUPER_ADMIN' && leaveRequest.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approvedBy || userId,
        approvedAt: new Date(),
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
      },
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'APPROVE',
          entity: 'LeaveRequest',
          entityId: id,
          changes: JSON.stringify({ status: 'APPROVED', approvedBy }),
          companyId: leaveRequest.companyId,
          branchId: leaveRequest.branchId || null,
        },
      });
    }

    if (io) {
      io.emitLeaveUpdate(leaveRequest.companyId, {
        type: 'LEAVE_APPROVED',
        leaveRequest: updated,
        employee: {
          id: leaveRequest.employee.id,
          employeeId: leaveRequest.employee.employeeId,
          name: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
        },
        timestamp: new Date().toISOString(),
      });
      const employeeUser = await prisma.user.findFirst({
        where: { employeeId: leaveRequest.employeeId },
      });
      if (employeeUser) {
        io.emitNotification(employeeUser.id, {
          title: 'Leave Approved',
          message: `Your leave request from ${leaveRequest.startDate.toDateString()} to ${leaveRequest.endDate.toDateString()} has been approved.`,
          type: 'LEAVE',
          link: `/leave/${id}`,
        });
      }
    }

    return updated;
  }

  async rejectLeaveRequest(id: string, rejectedReason: string, userId: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!leaveRequest) {
      throw new ApiError(404, 'Leave request not found');
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new ApiError(400, 'Leave request is not pending');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && leaveRequest.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedReason: rejectedReason || null,
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
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'REJECT',
        entity: 'LeaveRequest',
        entityId: id,
        changes: JSON.stringify({ status: 'REJECTED', rejectedReason }),
        companyId: leaveRequest.companyId,
        branchId: leaveRequest.branchId || null,
      },
    });

    if (io) {
      io.emitLeaveUpdate(leaveRequest.companyId, {
        type: 'LEAVE_REJECTED',
        leaveRequest: updated,
        employee: {
          id: leaveRequest.employee.id,
          employeeId: leaveRequest.employee.employeeId,
          name: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
        },
        timestamp: new Date().toISOString(),
      });
      const employeeUser = await prisma.user.findFirst({
        where: { employeeId: leaveRequest.employeeId },
      });
      if (employeeUser) {
        io.emitNotification(employeeUser.id, {
          title: 'Leave Rejected',
          message: `Your leave request from ${leaveRequest.startDate.toDateString()} to ${leaveRequest.endDate.toDateString()} has been rejected. Reason: ${rejectedReason || 'Not specified'}`,
          type: 'LEAVE',
          link: `/leave/${id}`,
        });
      }
    }

    return updated;
  }

  async cancelLeaveRequest(id: string, userId: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!leaveRequest) {
      throw new ApiError(404, 'Leave request not found');
    }

    if (leaveRequest.status === 'REJECTED') {
      throw new ApiError(400, 'Cannot cancel a rejected leave request');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, employeeId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && leaveRequest.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }
    if (currentUser.role === 'STAFF') {
      const currentEmployee = await prisma.employee.findFirst({
        where: { user: { id: userId } },
        select: { id: true },
      });
      if (!currentEmployee || currentEmployee.id !== leaveRequest.employeeId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CANCEL',
        entity: 'LeaveRequest',
        entityId: id,
        changes: JSON.stringify({ status: 'CANCELLED' }),
        companyId: leaveRequest.companyId,
        branchId: leaveRequest.branchId || null,
      },
    });

    if (io) {
      io.emitLeaveUpdate(leaveRequest.companyId, {
        type: 'LEAVE_CANCELLED',
        leaveRequest: updated,
        employee: {
          id: leaveRequest.employee.id,
          employeeId: leaveRequest.employee.employeeId,
          name: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async getEmployeeLeaveBalance(employeeId: string, userId: string) {
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

    const annualLeaveMax = 20;
    const sickLeaveMax = 10;
    const casualLeaveMax = 5;

    const usedLeave = await prisma.leaveRequest.aggregate({
      where: {
        employeeId,
        status: 'APPROVED',
        leaveType: {
          in: ['ANNUAL', 'SICK', 'CASUAL'],
        },
        startDate: {
          gte: new Date(new Date().getFullYear(), 0, 1),
        },
      },
      _sum: {
        totalDays: true,
      },
    });

    const pendingLeave = await prisma.leaveRequest.aggregate({
      where: {
        employeeId,
        status: 'PENDING',
        startDate: {
          gte: new Date(),
        },
      },
      _sum: {
        totalDays: true,
      },
    });

    const usedAnnual = usedLeave._sum.totalDays || 0;
    const pendingAnnual = pendingLeave._sum.totalDays || 0;

    return {
      annual: {
        total: annualLeaveMax,
        used: usedAnnual,
        pending: pendingAnnual,
        available: annualLeaveMax - usedAnnual - pendingAnnual,
      },
      sick: {
        total: sickLeaveMax,
        used: 0,
        pending: 0,
        available: sickLeaveMax,
      },
      casual: {
        total: casualLeaveMax,
        used: 0,
        pending: 0,
        available: casualLeaveMax,
      },
    };
  }

  async getLeaveStats(params: {
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    userId: string;
  }) {
    const { companyId, branchId, departmentId, startDate, endDate, userId } = params;

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
    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.endDate = { lte: end };
    }

    const requests = await prisma.leaveRequest.findMany({ where });

    const total = requests.length;
    const pending = requests.filter(r => r.status === 'PENDING').length;
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED').length;
    const cancelled = requests.filter(r => r.status === 'CANCELLED').length;
    const totalDays = requests.reduce((sum, r) => sum + r.totalDays, 0);

    const byLeaveType = requests.reduce((acc, r) => {
      const type = r.leaveType;
      if (!acc[type]) acc[type] = { count: 0, days: 0 };
      acc[type].count++;
      acc[type].days += r.totalDays;
      return acc;
    }, {} as Record<string, { count: number; days: number }>);

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled,
      totalDays,
      byLeaveType,
    };
  }

  async deleteLeaveRequest(id: string, userId: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });
    if (!leaveRequest) {
      throw new ApiError(404, 'Leave request not found');
    }

    if (leaveRequest.status === 'APPROVED' || leaveRequest.status === 'REJECTED') {
      throw new ApiError(400, 'Cannot delete a leave request that is approved or rejected');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, employeeId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && leaveRequest.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }
    if (currentUser.role === 'STAFF') {
      const currentEmployee = await prisma.employee.findFirst({
        where: { user: { id: userId } },
        select: { id: true },
      });
      if (!currentEmployee || currentEmployee.id !== leaveRequest.employeeId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    await prisma.leaveRequest.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'LeaveRequest',
        entityId: id,
        changes: JSON.stringify({ deleted: leaveRequest }),
        companyId: leaveRequest.companyId,
        branchId: leaveRequest.branchId || null,
      },
    });
  }
}