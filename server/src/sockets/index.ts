import { Server as SocketServer, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/database';
import logger from '../utils/logger';

interface SocketUser {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
  branchId?: string;
}

declare module 'socket.io' {
  interface Socket {
    user?: SocketUser;
  }
}

export const setupSocketHandlers = (io: SocketServer) => {
  // Authentication middleware for socket connections
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token) as any;
      if (!decoded || !decoded.userId) {
        return next(new Error('Invalid token'));
      }

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          companyId: true,
          branchId: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId || undefined,
        branchId: user.branchId || undefined,
      };

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}, User: ${socket.user?.email}`);

    // Join user to their personal room
    if (socket.user) {
      socket.join(`user:${socket.user.userId}`);
      socket.join(`company:${socket.user.companyId || 'global'}`);
      if (socket.user.branchId) {
        socket.join(`branch:${socket.user.branchId}`);
      }
      socket.join(`role:${socket.user.role}`);
    }

    // Join room for attendance events
    socket.on('join-attendance-room', (companyId: string, branchId?: string) => {
      if (companyId) {
        socket.join(`attendance:${companyId}`);
        if (branchId) {
          socket.join(`attendance:${companyId}:${branchId}`);
        }
      }
    });

    // Join room for leave events
    socket.on('join-leave-room', (companyId: string) => {
      if (companyId) {
        socket.join(`leave:${companyId}`);
      }
    });

    // Handle attendance check-in events
    socket.on('attendance:checkin', (data: { employeeId: string; timestamp: string }) => {
      io.emit(`attendance:update:${data.employeeId}`, {
        type: 'CHECK_IN',
        ...data,
      });
      // Broadcast to company
      if (socket.user?.companyId) {
        io.to(`attendance:${socket.user.companyId}`).emit('attendance:realtime', {
          employeeId: data.employeeId,
          action: 'CHECK_IN',
          timestamp: data.timestamp,
        });
      }
    });

    // Handle attendance check-out events
    socket.on('attendance:checkout', (data: { employeeId: string; timestamp: string }) => {
      io.emit(`attendance:update:${data.employeeId}`, {
        type: 'CHECK_OUT',
        ...data,
      });
      if (socket.user?.companyId) {
        io.to(`attendance:${socket.user.companyId}`).emit('attendance:realtime', {
          employeeId: data.employeeId,
          action: 'CHECK_OUT',
          timestamp: data.timestamp,
        });
      }
    });

    // Handle break events
    socket.on('attendance:break', (data: { employeeId: string; type: 'IN' | 'OUT'; timestamp: string }) => {
      io.emit(`attendance:update:${data.employeeId}`, {
        type: `BREAK_${data.type}`,
        ...data,
      });
      if (socket.user?.companyId) {
        io.to(`attendance:${socket.user.companyId}`).emit('attendance:realtime', {
          employeeId: data.employeeId,
          action: `BREAK_${data.type}`,
          timestamp: data.timestamp,
        });
      }
    });

    // Leave request events
    socket.on('leave:request', (data: { employeeId: string; leaveId: string; status: string }) => {
      if (socket.user?.companyId) {
        io.to(`leave:${socket.user.companyId}`).emit('leave:update', {
          ...data,
          userId: socket.user.userId,
        });
      }
    });

    // Notification event
    socket.on('notification:send', (data: { userId: string; title: string; message: string }) => {
      io.to(`user:${data.userId}`).emit('notification:receive', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}, User: ${socket.user?.email}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Broadcast attendance update to all connected clients
  io.emitAttendanceUpdate = (employeeId: string, data: any) => {
    io.emit(`attendance:update:${employeeId}`, data);
  };

  // Broadcast leave update
  io.emitLeaveUpdate = (companyId: string, data: any) => {
    io.to(`leave:${companyId}`).emit('leave:update', data);
  };

  // Send notification to a specific user
  io.emitNotification = (userId: string, notification: any) => {
    io.to(`user:${userId}`).emit('notification:receive', notification);
  };

  logger.info('Socket.IO handlers initialized');
};

// Extend SocketServer interface
declare module 'socket.io' {
  interface Server {
    emitAttendanceUpdate: (employeeId: string, data: any) => void;
    emitLeaveUpdate: (companyId: string, data: any) => void;
    emitNotification: (userId: string, notification: any) => void;
  }
}