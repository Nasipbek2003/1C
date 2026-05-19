import winston from 'winston';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Custom transport to save logs to database
class DatabaseTransport extends winston.Transport {
  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      await prisma.systemLog.create({
        data: {
          component: info.component || 'unknown',
          level: info.level.toUpperCase() as any,
          errorType: info.errorType || null,
          message: info.message,
          metadata: info.metadata || null
        }
      });
    } catch (error) {
      console.error('Failed to save log to database:', error);
    }

    callback();
  }
}

// Add database transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new DatabaseTransport());
}

export { logger };
