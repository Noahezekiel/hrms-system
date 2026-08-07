import { Prisma, AuditAction } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export class AuditLogService {
  async getAllAuditLogs(params: {
    page: number;
    limit: number;
    userId?: string;
    companyId?: string;
    branchId?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
    currentUserId: string;
  }) {
    const { page, limit, userId, companyId, branchId, action, entity, startDate, endDate, currentUserId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    // Super admin can see all; others see only their company
    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }

    // Apply filters
    if (userId) {
      where.userId = userId;
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
    if (action) {
      where.action = action as AuditAction;
    }
    if (entity) {
      where.entity = entity;
    }
    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: end };
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditLogById(id: string, currentUserId: string) {
    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!auditLog) {
      throw new ApiError(404, 'Audit log not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && auditLog.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    return auditLog;
  }

  async getAuditLogsByEntity(params: {
    entity: string;
    entityId: string;
    page: number;
    limit: number;
    currentUserId: string;
  }) {
    const { entity, entityId, page, limit, currentUserId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.AuditLogWhereInput = {
      entity,
      entityId,
    };

    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }

    const total = await prisma.auditLog.count({ where });

    const auditLogs = await prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditLogStats(params: {
    companyId?: string;
    startDate?: string;
    endDate?: string;
    currentUserId: string;
  }) {
    const { companyId, startDate, endDate, currentUserId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.AuditLogWhereInput = {};
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }
    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: end };
    }

    const logs = await prisma.auditLog.findMany({ where });

    // Aggregate statistics
    const total = logs.length;
    const byAction = logs.reduce((acc, log) => {
      const action = log.action;
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byEntity = logs.reduce((acc, log) => {
      const entity = log.entity;
      acc[entity] = (acc[entity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byUser = logs.reduce((acc, log) => {
      const userId = log.userId;
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top users
    const topUsers = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    // Get recent activity timeline (by day)
    const timeline = logs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byAction,
      byEntity,
      topUsers,
      timeline,
    };
  }

  async clearOldAuditLogs(params: {
    days: number;
    currentUserId: string;
  }) {
    const { days, currentUserId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    // Only SUPER_ADMIN can clear audit logs
    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only Super Admin can clear audit logs');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deleted = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    // Log this action
    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DELETE',
        entity: 'AuditLog',
        entityId: 'bulk',
        changes: { action: 'Cleared old audit logs', days, count: deleted.count },
        companyId: currentUser.companyId || undefined,
      },
    });

    return { count: deleted.count };
  }
}