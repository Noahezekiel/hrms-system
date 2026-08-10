import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

export interface DepartmentCreateInput {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  companyId: string;
  branchId?: string;
  managerId?: string;
}

export interface DepartmentUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  companyId?: string;
  branchId?: string;
  managerId?: string;
}

export class DepartmentService {
  async getAllDepartments(params: {
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

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, branchId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.DepartmentWhereInput = {};

    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
      if (currentUser.role === 'DEPARTMENT_MANAGER') {
        where.id = currentUser.departmentId || undefined;
      }
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

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const total = await prisma.department.count({ where });

    const departments = await prisma.department.findMany({
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
        manager: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
        _count: {
          select: {
            employees: true,
            positions: true,
          },
        },
      },
    });

    return {
      departments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDepartmentById(id: string, userId: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
        manager: {
          select: { id: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true },
        },
        positions: {
          where: { isActive: true },
          select: { id: true, name: true, code: true, isActive: true },
        },
        employees: {
          where: { isActive: true },
          select: { id: true, employeeId: true, firstName: true, lastName: true },
          take: 20,
        },
        _count: {
          select: {
            employees: true,
            positions: true,
          },
        },
      },
    });

    if (!department) {
      throw new ApiError(404, 'Department not found');
    }

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

    return department;
  }

  async createDepartment(data: DepartmentCreateInput, userId: string) {
    const { name, code, description, isActive, companyId, branchId, managerId } = data;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

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

    if (managerId) {
      const manager = await prisma.employee.findFirst({
        where: {
          id: managerId,
          companyId,
        },
      });
      if (!manager) {
        throw new ApiError(404, 'Manager not found in this company');
      }
    }

    const existingDepartment = await prisma.department.findFirst({
      where: {
        code,
        companyId,
      },
    });
    if (existingDepartment) {
      throw new ApiError(409, 'Department with this code already exists in this company');
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        description,
        isActive: isActive !== undefined ? isActive : true,
        companyId,
        branchId: branchId || null,
        managerId: managerId || null,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Department',
        entityId: department.id,
        changes: JSON.stringify({ data }),
      },
    });

    return department;
  }

  async updateDepartment(id: string, data: DepartmentUpdateInput, userId: string) {
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    });
    if (!existingDepartment) {
      throw new ApiError(404, 'Department not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && existingDepartment.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    if (data.companyId && data.companyId !== existingDepartment.companyId) {
      if (currentUser.role !== 'SUPER_ADMIN') {
        throw new ApiError(403, 'Cannot move department to another company');
      }
      const newCompany = await prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!newCompany) {
        throw new ApiError(404, 'Target company not found');
      }
    }

    if (data.branchId !== undefined && data.branchId !== existingDepartment.branchId) {
      const companyId = data.companyId || existingDepartment.companyId;
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

    if (data.managerId !== undefined && data.managerId !== existingDepartment.managerId) {
      if (data.managerId) {
        const companyId = data.companyId || existingDepartment.companyId;
        const manager = await prisma.employee.findFirst({
          where: {
            id: data.managerId,
            companyId,
          },
        });
        if (!manager) {
          throw new ApiError(404, 'Manager not found in this company');
        }
      }
    }

    if (data.code && data.code !== existingDepartment.code) {
      const companyId = data.companyId || existingDepartment.companyId;
      const codeExists = await prisma.department.findFirst({
        where: {
          code: data.code,
          companyId,
          id: { not: id },
        },
      });
      if (codeExists) {
        throw new ApiError(409, 'Department with this code already exists in this company');
      }
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        isActive: data.isActive,
        companyId: data.companyId,
        branchId: data.branchId !== undefined ? data.branchId : undefined,
        managerId: data.managerId !== undefined ? data.managerId : undefined,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Department',
        entityId: id,
        changes: JSON.stringify({ before: existingDepartment, after: data }),
      },
    });

    return updatedDepartment;
  }

  async deleteDepartment(id: string, userId: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: true,
        positions: true,
      },
    });

    if (!department) {
      throw new ApiError(404, 'Department not found');
    }

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

    if (department.employees.length > 0 || department.positions.length > 0) {
      throw new ApiError(400, 'Cannot delete department with existing employees or positions. Please reassign or remove them first.');
    }

    await prisma.department.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Department',
        entityId: id,
        changes: JSON.stringify({ deletedDepartment: department }),
      },
    });
  }

  async updateDepartmentStatus(id: string, isActive: boolean, userId: string) {
    const department = await prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new ApiError(404, 'Department not found');
    }

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

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: { isActive },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Department',
        entityId: id,
        changes: JSON.stringify({ isActive }),
      },
    });

    return updatedDepartment;
  }

  async getDepartmentEmployees(id: string, params: {
    page: number;
    limit: number;
    search?: string;
    userId: string;
  }) {
    const department = await prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new ApiError(404, 'Department not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && department.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.EmployeeWhereInput = { departmentId: id };

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
        position: {
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

  async getDepartmentPositions(id: string, userId: string) {
    const department = await prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new ApiError(404, 'Department not found');
    }

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

    const positions = await prisma.position.findMany({
      where: { departmentId: id, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    return positions;
  }
}