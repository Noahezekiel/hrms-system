import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import { ApiError } from '../utils/ApiError';

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { userId: string; role: string };
      userId?: string;
      userRole?: string;
      companyId?: string;
      branchId?: string;
    }
  }
}

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'Invalid token format');
    }

    const decoded = verifyToken(token) as TokenPayload;
    if (!decoded || !decoded.userId) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        companyId: true,
        branchId: true,
        departmentId: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'User account is deactivated');
    }

    // Attach user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined,
      branchId: user.branchId || undefined,
    };
    req.userId = user.id;
    req.userRole = user.role;
    req.companyId = user.companyId || undefined;
    req.branchId = user.branchId || undefined;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    logger.error('Auth middleware error:', error);
    next(new ApiError(401, 'Authentication failed'));
  }
};

export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
};

export const requireSuperAdmin = requireRole('SUPER_ADMIN');
export const requireCompanyAdmin = requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']);
export const requireHRManager = requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER']);
export const requireAttendanceOfficer = requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'ATTENDANCE_OFFICER']);
export const requireDepartmentManager = requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER']);
export const requireStaff = requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'ATTENDANCE_OFFICER', 'DEPARTMENT_MANAGER', 'STAFF']);