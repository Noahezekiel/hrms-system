import { Prisma, Branch } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export interface BranchCreateInput {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  companyId: string;
}

export interface BranchUpdateInput {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  companyId?: string;
}

export class BranchService {
  async getAllBranches(params: {
    page: number;
    limit: number;
    search?: string;
    companyId?: string;
    isActive?: boolean;
    userId: string;
  }) {
    const { page, limit, search, companyId, isActive, userId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    // Build where clause
    const where: Prisma.BranchWhereInput = {};

    // Super admin can see all branches; others see only their company's branches
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

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count
    const total = await prisma.branch.count({ where });

    // Get branches
    const branches = await prisma.branch.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            departments: true,
            employees: true,
            shifts: true,
          },
        },
      },
    });

    return {
      branches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBranchById(id: string, userId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        departments: {
          where: { isActive: true },
          select: { id: true, name: true, code: true, isActive: true },
        },
        _count: {
          select: {
            departments: true,
            employees: true,
            shifts: true,
          },
        },
      },
    });

    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && branch.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    return branch;
  }

  async createBranch(data: BranchCreateInput, userId: string) {
    const { name, code, address, city, state, country, zipCode, phone, email, isActive, companyId } = data;

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

    // Check if code is unique within the company
    const existingBranch = await prisma.branch.findFirst({
      where: {
        code,
        companyId,
      },
    });
    if (existingBranch) {
      throw new ApiError(409, 'Branch with this code already exists in this company');
    }

    // Check if email is unique (if provided)
    if (email) {
      const emailExists = await prisma.branch.findFirst({
        where: {
          email,
          companyId,
        },
      });
      if (emailExists) {
        throw new ApiError(409, 'Branch with this email already exists in this company');
      }
    }

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        address,
        city,
        state,
        country,
        zipCode,
        phone,
        email,
        isActive: isActive !== undefined ? isActive : true,
        companyId,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Branch',
        entityId: branch.id,
        changes: { data },
      },
    });

    return branch;
  }

  async updateBranch(id: string, data: BranchUpdateInput, userId: string) {
    const existingBranch = await prisma.branch.findUnique({
      where: { id },
    });
    if (!existingBranch) {
      throw new ApiError(404, 'Branch not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && existingBranch.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // If companyId is being updated, check permissions
    if (data.companyId && data.companyId !== existingBranch.companyId) {
      if (currentUser.role !== 'SUPER_ADMIN') {
        throw new ApiError(403, 'Cannot move branch to another company');
      }
      // Check if new company exists
      const newCompany = await prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!newCompany) {
        throw new ApiError(404, 'Target company not found');
      }
    }

    // If code is being updated, check uniqueness within company
    if (data.code && data.code !== existingBranch.code) {
      const companyId = data.companyId || existingBranch.companyId;
      const codeExists = await prisma.branch.findFirst({
        where: {
          code: data.code,
          companyId,
          id: { not: id },
        },
      });
      if (codeExists) {
        throw new ApiError(409, 'Branch with this code already exists in this company');
      }
    }

    // If email is being updated, check uniqueness
    if (data.email && data.email !== existingBranch.email) {
      const companyId = data.companyId || existingBranch.companyId;
      const emailExists = await prisma.branch.findFirst({
        where: {
          email: data.email,
          companyId,
          id: { not: id },
        },
      });
      if (emailExists) {
        throw new ApiError(409, 'Branch with this email already exists in this company');
      }
    }

    // Update branch
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email,
        isActive: data.isActive,
        companyId: data.companyId,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Branch',
        entityId: id,
        changes: { before: existingBranch, after: data },
      },
    });

    return updatedBranch;
  }

  async deleteBranch(id: string, userId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        departments: true,
        employees: true,
        shifts: true,
      },
    });

    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && branch.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Check if branch has employees or departments
    if (branch.employees.length > 0 || branch.departments.length > 0 || branch.shifts.length > 0) {
      throw new ApiError(400, 'Cannot delete branch with existing employees, departments, or shifts. Please reassign or remove them first.');
    }

    // Delete branch
    await prisma.branch.delete({
      where: { id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Branch',
        entityId: id,
        changes: { deletedBranch: branch },
      },
    });
  }

  async updateBranchStatus(id: string, isActive: boolean, userId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
    });
    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && branch.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: { isActive },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Branch',
        entityId: id,
        changes: { isActive },
      },
    });

    return updatedBranch;
  }

  async getBranchDepartments(id: string, userId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
    });
    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && branch.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const departments = await prisma.department.findMany({
      where: { branchId: id, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        company: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            employees: true,
            positions: true,
          },
        },
      },
    });

    return departments;
  }

  async getBranchEmployees(id: string, params: {
    page: number;
    limit: number;
    search?: string;
    userId: string;
  }) {
    const branch = await prisma.branch.findUnique({
      where: { id },
    });
    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && branch.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.EmployeeWhereInput = { branchId: id };

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
        department: {
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
}