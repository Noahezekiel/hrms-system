import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { setupSocketHandlers } from './sockets';
import { prisma } from './config/database';
import logger from './utils/logger';

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: process.env.SOCKET_PATH || '/socket.io',
});

// Setup socket handlers
setupSocketHandlers(io);

// Store io instance globally for use in controllers/services
(global as any).__io = io;

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔌 Socket.IO ready on path: ${io.path()}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  httpServer.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database disconnected');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application continues running, but we log it
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // In production, we might want to exit and let the process manager restart
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

export { io };