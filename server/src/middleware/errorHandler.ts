import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error | ApiError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.userId,
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      statusCode: err.statusCode,
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      statusCode: 400,
    });
  }

  // Handle Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let statusCode = 400;
    let message = 'Database error';

    // Handle unique constraint violation
    if (err.code === 'P2002') {
      statusCode = 409;
      const target = err.meta?.target as string[] | undefined;
      message = `Duplicate entry for field: ${target?.join(', ') || 'unknown'}`;
    }

    // Handle record not found
    if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }

    // Handle foreign key constraint
    if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Related record does not exist';
    }

    // Handle invalid data
    if (err.code === 'P2006') {
      statusCode = 400;
      message = 'Invalid data provided';
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      statusCode,
    });
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      statusCode: 400,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      statusCode: 401,
    });
  }

  // Default error response
  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};