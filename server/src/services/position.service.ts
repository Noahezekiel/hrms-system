import { Prisma, Position } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export interface PositionCreateInput {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  departmentId: string;
}

export interface PositionUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  departmentId?: string;
}

export class PositionService {
  async getAllPositions(params: {
    page: number;
    limit: number;
    search?: string;
    companyId?: string;
    departmentId?: string;
    isActive?: boolean;
    userId: string;
  }) {
    const { page, limit, search, companyId, departmentId, isActive, userId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    // Build where clause
    const where: Prisma.PositionWhereInput = {};

    // Super admin can see all; others see only their company
    if (currentUser.role !== 'SUPER_ADMIN') {
      // We need to join with department to filter by company
      where.department = {
        companyId: currentUser.companyId || undefined,
      };
      // Department managers see only their department
      if (currentUser.role === 'DEPARTMENT_MANAGER') {
        where.departmentId = currentUser.departmentId || undefined;
      }
    }

    // Apply filters
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.department = {
        companyId,
      };
    }

    if (departmentId) {
      where.departmentId = departmentId;
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
    const total = await prisma.position.count({ where });

    // Get positions
    const positions = await prisma.position.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            company: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    return {
      positions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPositionById(id: string, userId: string) {
    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            company: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        employees: {
          where: { isActive: true },
          select: { id: true, employeeId: true, firstName: true, lastName: true },
          take: 20,
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!position) {
      throw new ApiError(404, 'Position not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && position.department.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    return position;
  }

  async createPosition(data: PositionCreateInput, userId: string) {
    const { name, code, description, isActive, departmentId } = data;

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        company: true,
      },
    });
    if (!department) {
      throw new ApiError(404, 'Department not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && department.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Check if code is unique within the department
    const existingPosition = await prisma.position.findFirst({
      where: {
        code,
        departmentId,
      },
    });
    if (existingPosition) {
      throw new ApiError(409, 'Position with this code already exists in this department');
    }

    // Create position
    const position = await prisma.position.create({
      data: {
        name,
        code,
        description,
        isActive: isActive !== undefined ? isActive : true,
        departmentId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            company: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Position',
        entityId: position.id,
        changes: { data },
      },
    });

    return position;
  }

  async updatePosition(id: string, data: PositionUpdateInput, userId: string) {
    const existingPosition = await prisma.position.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            company: true,
          },
        },
      },
    });
    if (!existingPosition) {
      throw new ApiError(404, 'Position not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && existingPosition.department.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // If departmentId is being updated, check if new department exists and belongs to the same company
    if (data.departmentId && data.departmentId !== existingPosition.departmentId) {
      const newDepartment = await prisma.department.findUnique({
        where: { id: data.departmentId },
        include: { company: true },
      });
      if (!newDepartment) {
        throw new ApiError(404, 'Target department not found');
      }
      if (currentUser.role !== 'SUPER_ADMIN' && newDepartment.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied to target department');
      }
      // Check if the new department belongs to the same company as the current one
      if (newDepartment.companyId !== existingPosition.department.companyId) {
        throw new ApiError(400, 'Cannot move position to a department in a different company');
      }
    }

    // If code is being updated, check uniqueness within the department
    if (data.code && data.code !== existingPosition.code) {
      const departmentId = data.departmentId || existingPosition.departmentId;
      const codeExists = await prisma.position.findFirst({
        where: {
          code: data.code,
          departmentId,
          id: { not: id },
        },
      });
      if (codeExists) {
        throw new ApiError(409, 'Position with this code already exists in this department');
      }
    }

    // Update position
    const updatedPosition = await prisma.position.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        isActive: data.isActive,
        departmentId: data.departmentId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            company: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Position',
        entityId: id,
        changes: { before: existingPosition, after: data },
      },
    });

    return updatedPosition;
  }

  async deletePosition(id: string, userId: string) {
    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            company: true,
          },
        },
        employees: true,
      },
    });

    if (!position) {
      throw new ApiError(404, 'Position not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && position.department.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Check if position has employees
    if (position.employees.length > 0) {
      throw new ApiError(400, 'Cannot delete position with existing employees. Please reassign or remove them first.');
    }

    // Delete position
    await prisma.position.delete({
      where: { id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Position',
        entityId: id,
        changes: { deletedPosition: position },
      },
    });
  }

  async updatePositionStatus(id: string, isActive: boolean, userId: string) {
    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            company: true,
          },
        },
      },
    });
    if (!position) {
      throw new ApiError(404, 'Position not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && position.department.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const updatedPosition = await prisma.position.update({
      where: { id },
      data: { isActive },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Position',
        entityId: id,
        changes: { isActive },
      },
    });

    return updatedPosition;
  }

  async getPositionEmployees(id: string, params: {
    page: number;
    limit: number;
    search?: string;
    userId: string;
  }) {
    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            company: true,
          },
        },
      },
    });
    if (!position) {
      throw new ApiError(404, 'Position not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && position.department.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.EmployeeWhereInput = { positionId: id };

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.employee.count({ where });

    const employees = await prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    return {
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}