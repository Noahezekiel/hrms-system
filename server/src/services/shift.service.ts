import { Prisma, Shift, ShiftType } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export interface ShiftCreateInput {
  name: string;
  code: string;
  description?: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isActive?: boolean;
  companyId: string;
  branchId?: string;
}

export interface ShiftUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  shiftType?: ShiftType;
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
  isActive?: boolean;
  companyId?: string;
  branchId?: string;
}

export class ShiftService {
  async getAllShifts(params: {
    page: number;
    limit: number;
    search?: string;
    companyId?: string;
    branchId?: string;
    isActive?: boolean;
    userId: string;
  }) {
    const { page, limit, search, companyId, branchId, isActive, userId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, branchId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    // Build where clause
    const where: Prisma.ShiftWhereInput = {};

    // Super admin can see all; others see only their company
    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }

    // Apply filters
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count
    const total = await prisma.shift.count({ where });

    // Get shifts
    const shifts = await prisma.shift.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            employeeShifts: true,
            attendances: true,
          },
        },
      },
    });

    return {
      shifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getShiftById(id: string, userId: string) {
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
        employeeShifts: {
          where: { isActive: true },
          include: {
            employee: {
              select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            employeeShifts: true,
            attendances: true,
          },
        },
      },
    });

    if (!shift) {
      throw new ApiError(404, 'Shift not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && shift.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    return shift;
  }

  async createShift(data: ShiftCreateInput, userId: string) {
    const {
      name,
      code,
      description,
      shiftType,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      isActive,
      companyId,
      branchId,
    } = data;

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // If branchId is provided, check if it exists and belongs to the company
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          companyId,
        },
      });
      if (!branch) {
        throw new ApiError(404, 'Branch not found in this company');
      }
    }

    // Check if code is unique within the company
    const existingShift = await prisma.shift.findFirst({
      where: {
        code,
        companyId,
      },
    });
    if (existingShift) {
      throw new ApiError(409, 'Shift with this code already exists in this company');
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new ApiError(400, 'Invalid time format. Use HH:mm (e.g., 09:00)');
    }
    if (breakStart && !timeRegex.test(breakStart)) {
      throw new ApiError(400, 'Invalid break start time format. Use HH:mm');
    }
    if (breakEnd && !timeRegex.test(breakEnd)) {
      throw new ApiError(400, 'Invalid break end time format. Use HH:mm');
    }

    // Create shift
    const shift = await prisma.shift.create({
      data: {
        name,
        code,
        description,
        shiftType,
        startTime,
        endTime,
        breakStart: breakStart || null,
        breakEnd: breakEnd || null,
        isActive: isActive !== undefined ? isActive : true,
        companyId,
        branchId: branchId || null,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Shift',
        entityId: shift.id,
        changes: { data },
      },
    });

    return shift;
  }

  async updateShift(id: string, data: ShiftUpdateInput, userId: string) {
    const existingShift = await prisma.shift.findUnique({
      where: { id },
    });
    if (!existingShift) {
      throw new ApiError(404, 'Shift not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && existingShift.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // If companyId is being updated, check permissions
    if (data.companyId && data.companyId !== existingShift.companyId) {
      if (currentUser.role !== 'SUPER_ADMIN') {
        throw new ApiError(403, 'Cannot move shift to another company');
      }
      const newCompany = await prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!newCompany) {
        throw new ApiError(404, 'Target company not found');
      }
    }

    // If branchId is being updated, check if it exists and belongs to the company
    if (data.branchId !== undefined && data.branchId !== existingShift.branchId) {
      const companyId = data.companyId || existingShift.companyId;
      if (data.branchId) {
        const branch = await prisma.branch.findFirst({
          where: {
            id: data.branchId,
            companyId,
          },
        });
        if (!branch) {
          throw new ApiError(404, 'Branch not found in this company');
        }
      }
    }

    // If code is being updated, check uniqueness within company
    if (data.code && data.code !== existingShift.code) {
      const companyId = data.companyId || existingShift.companyId;
      const codeExists = await prisma.shift.findFirst({
        where: {
          code: data.code,
          companyId,
          id: { not: id },
        },
      });
      if (codeExists) {
        throw new ApiError(409, 'Shift with this code already exists in this company');
      }
    }

    // Validate time format if provided
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (data.startTime && !timeRegex.test(data.startTime)) {
      throw new ApiError(400, 'Invalid start time format. Use HH:mm');
    }
    if (data.endTime && !timeRegex.test(data.endTime)) {
      throw new ApiError(400, 'Invalid end time format. Use HH:mm');
    }
    if (data.breakStart && !timeRegex.test(data.breakStart)) {
      throw new ApiError(400, 'Invalid break start time format. Use HH:mm');
    }
    if (data.breakEnd && !timeRegex.test(data.breakEnd)) {
      throw new ApiError(400, 'Invalid break end time format. Use HH:mm');
    }

    // Update shift
    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        shiftType: data.shiftType,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart !== undefined ? data.breakStart : undefined,
        breakEnd: data.breakEnd !== undefined ? data.breakEnd : undefined,
        isActive: data.isActive,
        companyId: data.companyId,
        branchId: data.branchId !== undefined ? data.branchId : undefined,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Shift',
        entityId: id,
        changes: { before: existingShift, after: data },
      },
    });

    return updatedShift;
  }

  async deleteShift(id: string, userId: string) {
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        employeeShifts: true,
        attendances: true,
      },
    });

    if (!shift) {
      throw new ApiError(404, 'Shift not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && shift.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Check if shift has employee assignments or attendance records
    if (shift.employeeShifts.length > 0 || shift.attendances.length > 0) {
      throw new ApiError(400, 'Cannot delete shift with existing employee assignments or attendance records. Please remove them first.');
    }

    // Delete shift
    await prisma.shift.delete({
      where: { id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Shift',
        entityId: id,
        changes: { deletedShift: shift },
      },
    });
  }

  async updateShiftStatus(id: string, isActive: boolean, userId: string) {
    const shift = await prisma.shift.findUnique({
      where: { id },
    });
    if (!shift) {
      throw new ApiError(404, 'Shift not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && shift.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: { isActive },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Shift',
        entityId: id,
        changes: { isActive },
      },
    });

    return updatedShift;
  }

  async assignShiftToEmployee(
    shiftId: string,
    employeeId: string,
    startDate: string | Date,
    endDate?: string | Date,
    userId?: string
  ) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });
    if (!shift) {
      throw new ApiError(404, 'Shift not found');
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Check if employee belongs to the same company as the shift
    if (employee.companyId !== shift.companyId) {
      throw new ApiError(400, 'Employee does not belong to the same company as the shift');
    }

    // Check permissions if userId provided
    if (userId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, companyId: true },
      });
      if (!currentUser) {
        throw new ApiError(404, 'Current user not found');
      }
      if (currentUser.role !== 'SUPER_ADMIN' && shift.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    // Check if assignment already exists for this employee and shift on the same start date
    const existingAssignment = await prisma.employeeShift.findFirst({
      where: {
        employeeId,
        shiftId,
        startDate: start,
        isActive: true,
      },
    });

    if (existingAssignment) {
      throw new ApiError(409, 'Employee already assigned to this shift starting on this date');
    }

    // Create assignment
    const assignment = await prisma.employeeShift.create({
      data: {
        employeeId,
        shiftId,
        startDate: start,
        endDate: end,
        isActive: true,
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

    // Log audit if userId provided
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entity: 'EmployeeShift',
          entityId: assignment.id,
          changes: { shiftId, employeeId, startDate, endDate },
        },
      });
    }

    return assignment;
  }

  async removeShiftFromEmployee(shiftId: string, employeeId: string, userId: string) {
    const assignment = await prisma.employeeShift.findFirst({
      where: {
        shiftId,
        employeeId,
        isActive: true,
      },
    });

    if (!assignment) {
      throw new ApiError(404, 'Active shift assignment not found for this employee');
    }

    // Check permissions
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });
    if (!shift) {
      throw new ApiError(404, 'Shift not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && shift.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Soft delete by setting isActive to false
    const updated = await prisma.employeeShift.update({
      where: { id: assignment.id },
      data: { isActive: false },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'EmployeeShift',
        entityId: assignment.id,
        changes: { shiftId, employeeId, action: 'removed assignment' },
      },
    });

    return updated;
  }

  async getShiftEmployees(id: string, params: {
    page: number;
    limit: number;
    search?: string;
    userId: string;
  }) {
    const shift = await prisma.shift.findUnique({
      where: { id },
    });
    if (!shift) {
      throw new ApiError(404, 'Shift not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && shift.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.EmployeeShiftWhereInput = {
      shiftId: id,
      isActive: true,
    };

    const total = await prisma.employeeShift.count({ where });

    const employeeShifts = await prisma.employeeShift.findMany({
      where,
      skip,
      take,
      orderBy: { startDate: 'desc' },
      include: {
        employee: {
          include: {
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Filter employees by search if provided
    let employees = employeeShifts.map(es => es.employee);
    if (search) {
      const searchLower = search.toLowerCase();
      employees = employees.filter(emp =>
        emp.employeeId.toLowerCase().includes(searchLower) ||
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower)
      );
    }

    const paginatedEmployees = employees.slice(0, take);
    const pagination = {
      page,
      limit,
      total: employees.length,
      totalPages: Math.ceil(employees.length / limit),
    };

    return {
      employees: paginatedEmployees,
      pagination,
    };
  }

  async getEmployeeShifts(employeeId: string, userId: string) {
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
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'DEPARTMENT_MANAGER' && employee.departmentId !== currentUser.departmentId && employee.id !== currentUser.employeeId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'STAFF') {
      const currentEmployee = await prisma.employee.findFirst({
        where: { user: { id: userId } },
        select: { id: true },
      });
      if (!currentEmployee || currentEmployee.id !== employeeId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    const shifts = await prisma.employeeShift.findMany({
      where: {
        employeeId,
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        shift: {
          include: {
            company: {
              select: { id: true, name: true },
            },
            branch: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return shifts;
  }
}