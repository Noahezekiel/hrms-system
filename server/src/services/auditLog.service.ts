import { Prisma, AuditAction } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

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

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.AuditLogWhereInput = {};

    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
    }

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

    // Build date filter properly
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
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
        // Remove 'company' from include – not in schema
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
      },
    });

    if (!auditLog) {
      throw new ApiError(404, 'Audit log not found');
    }

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

    // Build date filter properly
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    const logs = await prisma.auditLog.findMany({ where });

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

    const topUsers = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

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

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DELETE',
        entity: 'AuditLog',
        entityId: 'bulk',
        changes: JSON.stringify({ action: 'Cleared old audit logs', days, count: deleted.count }),
        companyId: currentUser.companyId || undefined,
      },
    });

    return { count: deleted.count };
  }
}