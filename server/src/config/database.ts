import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const time = after - before;

  if (time > 1000) {
    console.warn(`Slow query (${time}ms): ${params.model}.${params.action}`);
  }

  return result;
});

export { prisma };