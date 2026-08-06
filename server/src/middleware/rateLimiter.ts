import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes by default
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/';
  },
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    return req.userId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      statusCode: 429,
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60),
    });
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    statusCode: 429,
  },
  skipSuccessfulRequests: true,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: {
    success: false,
    message: 'Too many upload requests, please try again later.',
    statusCode: 429,
  },
});