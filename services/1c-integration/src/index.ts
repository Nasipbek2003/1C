import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { syncProducts } from './sync/products';
import { syncCustomers } from './sync/customers';
import { syncOrderStatuses } from './sync/orders';
import { sendOrderTo1C } from './api/orders';

dotenv.config();

const app = express();
const PORT = process.env.C1_INTEGRATION_PORT || 3003;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manual sync endpoints
app.post('/api/1c/sync-products', async (req, res) => {
  try {
    const result = await syncProducts();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/1c/sync-customers', async (req, res) => {
  try {
    const result = await syncCustomers();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send order to 1C
app.post('/api/1c/orders', async (req, res) => {
  try {
    const result = await sendOrderTo1C(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get order status from 1C
app.get('/api/1c/orders/:orderNumber/status', async (req, res) => {
  try {
    // This would call 1C API to get order status
    // For now, return mock data
    res.json({
      status: 'CONFIRMED',
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup scheduled tasks
const setupScheduledTasks = () => {
  // Sync products every 15 minutes
  const productsSyncSchedule = process.env.C1_SYNC_PRODUCTS_INTERVAL || '*/15 * * * *';
  cron.schedule(productsSyncSchedule, async () => {
    console.log('Running scheduled product sync...');
    try {
      await syncProducts();
    } catch (error) {
      console.error('Scheduled product sync failed:', error);
    }
  });

  // Sync order statuses every 5 minutes
  const ordersSyncSchedule = process.env.C1_SYNC_ORDERS_INTERVAL || '*/5 * * * *';
  cron.schedule(ordersSyncSchedule, async () => {
    console.log('Running scheduled order status sync...');
    try {
      await syncOrderStatuses();
    } catch (error) {
      console.error('Scheduled order sync failed:', error);
    }
  });

  // Sync customers every hour
  const customersSyncSchedule = process.env.C1_SYNC_CUSTOMERS_INTERVAL || '0 * * * *';
  cron.schedule(customersSyncSchedule, async () => {
    console.log('Running scheduled customer sync...');
    try {
      await syncCustomers();
    } catch (error) {
      console.error('Scheduled customer sync failed:', error);
    }
  });

  console.log('Scheduled tasks configured');
};

// Start server
app.listen(PORT, () => {
  console.log(`1C Integration Service started on port ${PORT}`);
  setupScheduledTasks();
});
