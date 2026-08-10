import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

export interface SettingCreateInput {
  key: string;
  value: any;
  description?: string;
  category?: string;
  isPublic?: boolean;
  companyId?: string;
}

export interface SettingUpdateInput {
  value?: any;
  description?: string;
  category?: string;
  isPublic?: boolean;
  companyId?: string;
}

export class SettingService {
  async getAllSettings(params: {
    category?: string;
    companyId?: string;
    isPublic?: boolean;
    userId: string;
  }) {
    const { category, companyId, isPublic, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.SettingWhereInput = {};

    if (currentUser.role !== 'SUPER_ADMIN') {
      where.OR = [
        { companyId: currentUser.companyId || undefined },
        { isPublic: true },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return settings;
  }

  async getSettingByKey(key: string, userId: string) {
    const setting = await prisma.setting.findUnique({
      where: { key },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    if (!setting) {
      throw new ApiError(404, 'Setting not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    if (!setting.isPublic) {
      if (currentUser.role !== 'SUPER_ADMIN' && setting.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    return setting;
  }

  async createSetting(data: SettingCreateInput, userId: string) {
    const { key, value, description, category, isPublic, companyId } = data;

    const existing = await prisma.setting.findUnique({
      where: { key },
    });
    if (existing) {
      throw new ApiError(409, 'Setting with this key already exists');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    if (!companyId && currentUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only Super Admin can create global settings');
    }

    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!company) {
        throw new ApiError(404, 'Company not found');
      }
    }

    const setting = await prisma.setting.create({
      data: {
        key,
        value,
        description: description || null,
        category: category || 'general',
        isPublic: isPublic !== undefined ? isPublic : false,
        companyId: companyId || null,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Setting',
        entityId: setting.key,
        changes: JSON.stringify({ data }),
        companyId: setting.companyId || undefined,
      },
    });

    return setting;
  }

  async updateSetting(key: string, data: SettingUpdateInput, userId: string) {
    const existing = await prisma.setting.findUnique({
      where: { key },
    });
    if (!existing) {
      throw new ApiError(404, 'Setting not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    if (!existing.companyId && currentUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only Super Admin can update global settings');
    }

    if (existing.companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && existing.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    if (data.companyId !== undefined && data.companyId !== existing.companyId) {
      if (currentUser.role !== 'SUPER_ADMIN') {
        throw new ApiError(403, 'Only Super Admin can change setting company');
      }
      if (data.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: data.companyId },
        });
        if (!company) {
          throw new ApiError(404, 'Company not found');
        }
      }
    }

    const updated = await prisma.setting.update({
      where: { key },
      data: {
        value: data.value !== undefined ? data.value : undefined,
        description: data.description !== undefined ? data.description : undefined,
        category: data.category !== undefined ? data.category : undefined,
        isPublic: data.isPublic !== undefined ? data.isPublic : undefined,
        companyId: data.companyId !== undefined ? data.companyId : undefined,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Setting',
        entityId: key,
        changes: JSON.stringify({ before: existing, after: data }),
        companyId: updated.companyId || undefined,
      },
    });

    return updated;
  }

  async deleteSetting(key: string, userId: string) {
    const existing = await prisma.setting.findUnique({
      where: { key },
    });
    if (!existing) {
      throw new ApiError(404, 'Setting not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    if (!existing.companyId && currentUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only Super Admin can delete global settings');
    }

    if (existing.companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && existing.companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
    }

    await prisma.setting.delete({
      where: { key },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Setting',
        entityId: key,
        changes: JSON.stringify({ deleted: existing }),
        companyId: existing.companyId || undefined,
      },
    });
  }

  async getPublicSettings(params: {
    companyId?: string;
    userId: string;
  }) {
    const { companyId } = params;

    const where: Prisma.SettingWhereInput = {
      isPublic: true,
    };

    if (companyId) {
      where.OR = [
        { companyId },
        { companyId: null },
      ];
    } else {
      where.companyId = null;
    }

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    return settings;
  }
}