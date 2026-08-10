import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

export interface CompanyCreateInput {
  name: string;
  code: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  isActive?: boolean;
}

export interface CompanyUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  isActive?: boolean;
}

export class CompanyService {
  async getAllCompanies(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    userId: string;
  }) {
    const { page, limit, search, isActive, userId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.CompanyWhereInput = {};

    if (currentUser.role !== 'SUPER_ADMIN') {
      where.id = currentUser.companyId || undefined;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const total = await prisma.company.count({ where });

    const companies = await prisma.company.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            branches: true,
            departments: true,
            employees: true,
            shifts: true,
          },
        },
      },
    });

    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCompanyById(id: string, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        branches: {
          where: { isActive: true },
          select: { id: true, name: true, code: true, isActive: true },
        },
        departments: {
          where: { isActive: true },
          select: { id: true, name: true, code: true, isActive: true },
        },
        _count: {
          select: {
            branches: true,
            departments: true,
            employees: true,
            shifts: true,
            holidays: true,
          },
        },
      },
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

    if (currentUser.role !== 'SUPER_ADMIN' && company.id !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    return company;
  }

  async createCompany(data: CompanyCreateInput, userId: string) {
    const { name, code, description, logo, email, phone, address, city, state, country, zipCode, isActive } = data;

    const existingCompany = await prisma.company.findUnique({
      where: { code },
    });
    if (existingCompany) {
      throw new ApiError(409, 'Company with this code already exists');
    }

    if (email) {
      const emailExists = await prisma.company.findFirst({
        where: { email },
      });
      if (emailExists) {
        throw new ApiError(409, 'Company with this email already exists');
      }
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only Super Admin can create companies');
    }

    const company = await prisma.company.create({
      data: {
        name,
        code,
        description,
        logo,
        email,
        phone,
        address,
        city,
        state,
        country,
        zipCode,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Company',
        entityId: company.id,
        changes: JSON.stringify({ data }),
      },
    });

    return company;
  }

  async updateCompany(id: string, data: CompanyUpdateInput, userId: string) {
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });
    if (!existingCompany) {
      throw new ApiError(404, 'Company not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && existingCompany.id !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    if (data.code && data.code !== existingCompany.code) {
      const codeExists = await prisma.company.findUnique({
        where: { code: data.code },
      });
      if (codeExists) {
        throw new ApiError(409, 'Company with this code already exists');
      }
    }

    if (data.email && data.email !== existingCompany.email) {
      const emailExists = await prisma.company.findFirst({
        where: { email: data.email },
      });
      if (emailExists) {
        throw new ApiError(409, 'Company with this email already exists');
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        logo: data.logo,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        isActive: data.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Company',
        entityId: id,
        changes: JSON.stringify({ before: existingCompany, after: data }),
      },
    });

    return updatedCompany;
  }

  async deleteCompany(id: string, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        branches: true,
        employees: true,
        departments: true,
      },
    });

    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only Super Admin can delete companies');
    }

    if (company.employees.length > 0 || company.branches.length > 0 || company.departments.length > 0) {
      throw new ApiError(400, 'Cannot delete company with existing employees, branches, or departments. Please remove them first.');
    }

    await prisma.company.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Company',
        entityId: id,
        changes: JSON.stringify({ deletedCompany: company }),
      },
    });
  }

  async updateCompanyStatus(id: string, isActive: boolean, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id },
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

    if (currentUser.role !== 'SUPER_ADMIN' && company.id !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { isActive },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Company',
        entityId: id,
        changes: JSON.stringify({ isActive }),
      },
    });

    return updatedCompany;
  }

  async getCompanyBranches(id: string, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id },
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

    if (currentUser.role !== 'SUPER_ADMIN' && company.id !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const branches = await prisma.branch.findMany({
      where: { companyId: id, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            employees: true,
            departments: true,
          },
        },
      },
    });

    return branches;
  }

  async getCompanyDepartments(id: string, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id },
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

    if (currentUser.role !== 'SUPER_ADMIN' && company.id !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const departments = await prisma.department.findMany({
      where: { companyId: id, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        branch: {
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

  async getCompanyEmployees(id: string, params: {
    page: number;
    limit: number;
    search?: string;
    userId: string;
  }) {
    const company = await prisma.company.findUnique({
      where: { id },
    });
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && company.id !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.EmployeeWhereInput = { companyId: id };

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