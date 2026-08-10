import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import bcrypt from 'bcrypt';

export interface UserCreateInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  employeeId?: string;
  isActive?: boolean;
}

export interface UserUpdateInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  employeeId?: string;
  isActive?: boolean;
}

export class UserService {
  async getAllUsers(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    companyId?: string;
    branchId?: string;
    isActive?: boolean;
    userId: string;
  }) {
    const { page, limit, search, role, companyId, branchId, isActive, userId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, branchId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.UserWhereInput = {};

    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
      if (currentUser.role === 'DEPARTMENT_MANAGER') {
        where.departmentId = currentUser.departmentId || undefined;
      }
      if (currentUser.role === 'STAFF') {
        where.id = userId;
      }
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as Role;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        companyId: true,
        branchId: true,
        departmentId: true,
        employeeId: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: { id: true, name: true, code: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        employee: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
      },
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string, currentUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        companyId: true,
        branchId: true,
        departmentId: true,
        employeeId: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: { id: true, name: true, code: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        employee: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
        sessions: {
          where: { isActive: true },
          select: { id: true, createdAt: true, ipAddress: true, userAgent: true },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true, branchId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      if (user.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      if (currentUser.role === 'DEPARTMENT_MANAGER' && user.departmentId !== currentUser.departmentId && user.id !== currentUserId) {
        throw new ApiError(403, 'Access denied');
      }
      if (currentUser.role === 'STAFF' && user.id !== currentUserId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    return user;
  }

  async createUser(data: UserCreateInput, currentUserId: string) {
    const { email, password, firstName, lastName, role, companyId, branchId, departmentId, employeeId, isActive } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true, branchId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      if (companyId && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Cannot create user in another company');
      }
      if (branchId && branchId !== currentUser.branchId) {
        throw new ApiError(403, 'Cannot create user in another branch');
      }
      if (role === 'SUPER_ADMIN') {
        throw new ApiError(403, 'Only Super Admin can create Super Admin users');
      }
      if (role === 'COMPANY_ADMIN' && (currentUser.role as string) !== 'SUPER_ADMIN') {
        throw new ApiError(403, 'Only Super Admin can create Company Admin users');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'STAFF',
        companyId: companyId || (currentUser.companyId || undefined),
        branchId: branchId || (currentUser.branchId || undefined),
        departmentId: departmentId || undefined,
        employeeId: employeeId || undefined,
        isActive: isActive !== undefined ? isActive : true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        companyId: true,
        branchId: true,
        departmentId: true,
        employeeId: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        changes: JSON.stringify({ data }),
      },
    });

    return user;
  }

  async updateUser(id: string, data: UserUpdateInput, currentUserId: string) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });
    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true, branchId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (existingUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Cannot modify Super Admin user');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      if (existingUser.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Cannot modify user in another company');
      }
      if (currentUser.role === 'STAFF' && existingUser.id !== currentUserId) {
        throw new ApiError(403, 'Cannot modify other users');
      }
      if (currentUser.role === 'DEPARTMENT_MANAGER' && existingUser.departmentId !== currentUser.departmentId && existingUser.id !== currentUserId) {
        throw new ApiError(403, 'Cannot modify users in other departments');
      }
      if (data.role && (data.role === 'SUPER_ADMIN' || data.role === 'COMPANY_ADMIN') && (currentUser.role as string) !== 'SUPER_ADMIN') {
        throw new ApiError(403, 'Cannot assign Super Admin or Company Admin role');
      }
    }

    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        throw new ApiError(409, 'Email already in use');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        companyId: data.companyId,
        branchId: data.branchId,
        departmentId: data.departmentId,
        employeeId: data.employeeId,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        companyId: true,
        branchId: true,
        departmentId: true,
        employeeId: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        changes: JSON.stringify({ before: existingUser, after: data }),
      },
    });

    return updatedUser;
  }

  async deleteUser(id: string, currentUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (user.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Cannot delete Super Admin user');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      if (user.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Cannot delete user in another company');
      }
      if (user.id === currentUserId) {
        throw new ApiError(403, 'Cannot delete your own account');
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        changes: JSON.stringify({ deletedUser: user }),
      },
    });
  }

  async updateUserStatus(id: string, isActive: boolean, currentUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (user.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Cannot modify Super Admin user');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      if (user.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Cannot modify user in another company');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        changes: JSON.stringify({ isActive }),
      },
    });

    return updatedUser;
  }
}