import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from './utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export const setupWebSocket = (io: Server) => {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error('JWT secret not configured'));
      }

      const decoded = jwt.verify(token, secret) as {
        id: string;
        username: string;
      };

      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`WebSocket client connected: ${socket.userId}`, {
      component: 'websocket'
    });

    socket.on('subscribe_customer', (data: { customerId: string }) => {
      socket.join(`customer:${data.customerId}`);
      logger.debug(`Client subscribed to customer: ${data.customerId}`, {
        component: 'websocket'
      });
    });

    socket.on('unsubscribe_customer', (data: { customerId: string }) => {
      socket.leave(`customer:${data.customerId}`);
      logger.debug(`Client unsubscribed from customer: ${data.customerId}`, {
        component: 'websocket'
      });
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.userId}`, {
        component: 'websocket'
      });
    });
  });

  logger.info('WebSocket server initialized', { component: 'websocket' });
};
