import { PrismaClient } from '@prisma/client';
import { c1Client } from '../client/1c';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = process.env.BOT_API_URL || 'http://localhost:3001';

export const syncOrderStatuses = async () => {
  console.log('Starting order status sync from 1C...');

  try {
    // Get all orders that have c1OrderId and are not delivered/cancelled
    const orders = await prisma.order.findMany({
      where: {
        c1OrderId: { not: null },
        status: {
          notIn: ['DELIVERED', 'CANCELLED']
        }
      }
    });

    let updatedCount = 0;
    const errors: string[] = [];

    for (const order of orders) {
      try {
        const c1OrderStatus = await c1Client.getOrderStatus(order.c1OrderId!);

        // Check if status changed
        if (c1OrderStatus.status !== order.status) {
          // Update order status in database
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: c1OrderStatus.status,
              trackingNumber: c1OrderStatus.trackingNumber
            }
          });

          // Send notification to customer
          await sendOrderStatusNotification(order.id, c1OrderStatus.status);

          updatedCount++;
        }
      } catch (error: any) {
        errors.push(`Order ${order.orderNumber}: ${error.message}`);
      }
    }

    console.log(`Order status sync completed: ${updatedCount} updated`);

    return {
      updatedCount,
      errors
    };
  } catch (error: any) {
    console.error('Order status sync failed:', error.message);
    
    await prisma.systemLog.create({
      data: {
        component: '1c-integration',
        level: 'ERROR',
        errorType: 'sync_error',
        message: `Order status sync failed: ${error.message}`
      }
    });

    throw error;
  }
};

async function sendOrderStatusNotification(orderId: string, status: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) return;

    let notificationType = '';
    switch (status) {
      case 'CONFIRMED':
        notificationType = 'ORDER_CONFIRMED';
        break;
      case 'SHIPPED':
        notificationType = 'ORDER_SHIPPED';
        break;
      case 'DELIVERED':
        notificationType = 'ORDER_DELIVERED';
        break;
      case 'CANCELLED':
        notificationType = 'ORDER_CANCELLED';
        break;
      default:
        return;
    }

    // Create notification in database
    await prisma.notification.create({
      data: {
        customerId: order.customerId,
        orderId: order.id,
        type: notificationType as any,
        content: `Order ${order.orderNumber} status changed to ${status}`,
        status: 'PENDING'
      }
    });

    // Send via Telegram bot
    await axios.post('http://localhost:3002/api/send-notification', {
      customerId: order.customerId,
      notificationType: notificationType.toLowerCase(),
      orderData: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        trackingNumber: order.trackingNumber
      }
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
