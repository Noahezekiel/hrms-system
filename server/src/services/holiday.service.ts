import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

export interface HolidayCreateInput {
  name: string;
  date: string | Date;
  description?: string;
  isRecurring?: boolean;
  companyId: string;
  branchId?: string;
}

export interface HolidayUpdateInput {
  name?: string;
  date?: string | Date;
  description?: string;
  isRecurring?: boolean;
  companyId?: string;
  branchId?: string;
}

export class HolidayService {
  async getAllHolidays(params: {
    page: number;
    limit: number;
    search?: string;
    companyId?: string;
    branchId?: string;
    year?: number;
    isRecurring?: boolean;
    userId: string;
  }) {
    const { page, limit, search, companyId, branchId, year, isRecurring, userId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, branchId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.HolidayWhereInput = {};

    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
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
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (isRecurring !== undefined) {
      where.isRecurring = isRecurring;
    }

    const total = await prisma.holiday.count({ where });

    const holidays = await prisma.holiday.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'asc' },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return {
      holidays,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getHolidayById(id: string, userId: string) {
    const holiday = await prisma.holiday.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!holiday) {
      throw new ApiError(404, 'Holiday not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && holiday.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    return holiday;
  }

  async createHoliday(data: HolidayCreateInput, userId: string) {
    const { name, date, description, isRecurring, companyId, branchId } = data;

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

    const holidayDate = new Date(date);
    const existing = await prisma.holiday.findFirst({
      where: {
        date: holidayDate,
        companyId,
        branchId: branchId || null,
      },
    });

    if (existing) {
      throw new ApiError(409, 'Holiday already exists for this date, company, and branch');
    }

    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: holidayDate,
        description: description || null,
        isRecurring: isRecurring !== undefined ? isRecurring : false,
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

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Holiday',
        entityId: holiday.id,
        changes: JSON.stringify({ data }),
        companyId,
        branchId: branchId || null,
      },
    });

    return holiday;
  }

  async updateHoliday(id: string, data: HolidayUpdateInput, userId: string) {
    const existingHoliday = await prisma.holiday.findUnique({
      where: { id },
    });
    if (!existingHoliday) {
      throw new ApiError(404, 'Holiday not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && existingHoliday.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    if (data.companyId && data.companyId !== existingHoliday.companyId) {
      if (currentUser.role !== 'SUPER_ADMIN') {
        throw new ApiError(403, 'Cannot move holiday to another company');
      }
      const newCompany = await prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!newCompany) {
        throw new ApiError(404, 'Target company not found');
      }
    }

    if (data.branchId !== undefined && data.branchId !== existingHoliday.branchId) {
      const companyId = data.companyId || existingHoliday.companyId;
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

    if (data.date) {
      const holidayDate = new Date(data.date);
      const companyId = data.companyId || existingHoliday.companyId;
      const branchId = data.branchId !== undefined ? data.branchId : existingHoliday.branchId;

      const existing = await prisma.holiday.findFirst({
        where: {
          date: holidayDate,
          companyId,
          branchId: branchId || null,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ApiError(409, 'Holiday already exists for this date, company, and branch');
      }
    }

    const updatedHoliday = await prisma.holiday.update({
      where: { id },
      data: {
        name: data.name,
        date: data.date ? new Date(data.date) : undefined,
        description: data.description !== undefined ? data.description : undefined,
        isRecurring: data.isRecurring,
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

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Holiday',
        entityId: id,
        changes: JSON.stringify({ before: existingHoliday, after: data }),
        companyId: updatedHoliday.companyId,
        branchId: updatedHoliday.branchId || null,
      },
    });

    return updatedHoliday;
  }

  async deleteHoliday(id: string, userId: string) {
    const holiday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new ApiError(404, 'Holiday not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && holiday.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    await prisma.holiday.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Holiday',
        entityId: id,
        changes: JSON.stringify({ deletedHoliday: holiday }),
        companyId: holiday.companyId,
        branchId: holiday.branchId || null,
      },
    });
  }

  async getHolidaysByDateRange(params: {
    startDate: string;
    endDate: string;
    companyId?: string;
    branchId?: string;
    userId: string;
  }) {
    const { startDate, endDate, companyId, branchId, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.HolidayWhereInput = {};
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

    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return holidays;
  }

  async checkHoliday(params: {
    date: string;
    companyId?: string;
    branchId?: string;
    userId: string;
  }) {
    const { date, companyId, branchId, userId } = params;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.HolidayWhereInput = {};
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

    where.date = new Date(date);

    const holiday = await prisma.holiday.findFirst({
      where,
    });

    return {
      isHoliday: !!holiday,
      holiday,
    };
  }
}