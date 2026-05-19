import { PrismaClient } from '@prisma/client';
import { c1Client } from '../client/1c';

const prisma = new PrismaClient();

export const sendOrderTo1C = async (orderData: any) => {
  console.log(`Sending order ${orderData.orderNumber} to 1C...`);

  try {
    // Get customer phone for 1C
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderData.orderNumber },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Prepare data for 1C
    const c1OrderData = {
      customerPhone: order.customer.phone || '',
      items: order.items.map(item => ({
        productId: item.product.c1ProductId,
        quantity: item.quantity,
        size: item.size
      })),
      deliveryAddress: order.deliveryAddress,
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod
    };

    // Send to 1C
    const c1Response = await c1Client.createOrder(c1OrderData);

    // Update order with 1C order ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        c1OrderId: c1Response.orderId
      }
    });

    console.log(`Order ${orderData.orderNumber} sent to 1C successfully`);

    return {
      c1OrderId: c1Response.orderId,
      success: true
    };
  } catch (error: any) {
    console.error('Failed to send order to 1C:', error.message);
    
    await prisma.systemLog.create({
      data: {
        component: '1c-integration',
        level: 'ERROR',
        errorType: 'order_sync_error',
        message: `Failed to send order to 1C: ${error.message}`,
        metadata: { orderNumber: orderData.orderNumber }
      }
    });

    throw error;
  }
};
