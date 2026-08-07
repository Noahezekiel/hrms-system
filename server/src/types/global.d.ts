import { Server as SocketIOServer } from 'socket.io';

declare global {
  var __io: SocketIOServer | undefined;

  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      companyId?: string;
      branchId?: string;
      user?: {
        userId: string;
        email: string;
        role: string;
        companyId?: string;
        branchId?: string;
      };
    }
  }
}

export {};