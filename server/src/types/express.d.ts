import { User } from '@prisma/client';

declare global {
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