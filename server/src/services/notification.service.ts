import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { io } from '../index';

export class NotificationService {
  async getNotifications(params: {
    userId: string;
    page: number;
    limit: number;
    unreadOnly?: boolean;
  }) {
    const { userId, page, limit, unreadOnly } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const total = await prisma.notification.count({ where });

    const notifications = await prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
    return result.count;
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    await prisma.notification.delete({
      where: { id },
    });
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'SYSTEM',
        link: data.link || null,
        isRead: false,
      },
    });

    // Emit real-time notification via Socket.IO
    if (io) {
      io.emitNotification(data.userId, {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        createdAt: notification.createdAt,
        isRead: notification.isRead,
      });
    }

    return notification;
  }

  async createBulkNotifications(
    userIds: string[],
    data: {
      title: string;
      message: string;
      type?: string;
      link?: string;
    }
  ) {
    const notifications = [];
    for (const userId of userIds) {
      const notification = await this.createNotification({
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
      });
      notifications.push(notification);
    }
    return notifications;
  }
}