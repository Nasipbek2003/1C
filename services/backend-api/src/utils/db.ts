import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ]
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug(`Query: ${e.query}`, {
      component: 'prisma',
      duration: e.duration
    });
  });
}

prisma.$on('error' as never, (e: any) => {
  logger.error(`Database error: ${e.message}`, {
    component: 'prisma',
    errorType: 'database'
  });
});

// Test connection
prisma.$connect()
  .then(() => {
    logger.info('Database connected successfully', { component: 'prisma' });
  })
  .catch((error) => {
    logger.error('Failed to connect to database', {
      component: 'prisma',
      errorType: 'connection',
      metadata: { error: error.message }
    });
  });

export { prisma };
