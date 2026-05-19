import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { customersRouter } from './routes/customers';
import { productsRouter } from './routes/products';
import { ordersRouter } from './routes/orders';
import { chatSessionsRouter } from './routes/chatSessions';
import { messagesRouter } from './routes/messages';
import { notificationsRouter } from './routes/notifications';
import { publicRouter } from './routes/public';
import { setupWebSocket } from './websocket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_API_URL || '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    component: 'backend-api',
    ip: req.ip
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/public', publicRouter); // Public routes (no auth)
app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/chat-sessions', chatSessionsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);

// WebSocket setup
setupWebSocket(io);

// Error handling
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Backend API Service started on port ${PORT}`, {
    component: 'backend-api'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully', {
    component: 'backend-api'
  });
  httpServer.close(() => {
    logger.info('Server closed', { component: 'backend-api' });
    process.exit(0);
  });
});

export { io };
