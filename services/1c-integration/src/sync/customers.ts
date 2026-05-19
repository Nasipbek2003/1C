import { PrismaClient } from '@prisma/client';
import { c1Client } from '../client/1c';

const prisma = new PrismaClient();

export const syncCustomers = async () => {
  console.log('Starting customer sync from 1C...');

  try {
    const customers = await c1Client.getCustomers();

    let syncedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const c1Customer of customers) {
      try {
        // Find customer by phone number
        const existingCustomer = await prisma.customer.findFirst({
          where: { phone: c1Customer.phone }
        });

        if (existingCustomer) {
          await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              c1CustomerId: c1Customer.id,
              name: c1Customer.name
            }
          });
          updatedCount++;
        }
        // Note: We don't create new customers from 1C
        // Customers are created when they interact with Telegram bot
      } catch (error: any) {
        errors.push(`Customer ${c1Customer.id}: ${error.message}`);
      }
    }

    console.log(`Customer sync completed: ${updatedCount} updated`);

    return {
      syncedCount,
      updatedCount,
      errors
    };
  } catch (error: any) {
    console.error('Customer sync failed:', error.message);
    
    await prisma.systemLog.create({
      data: {
        component: '1c-integration',
        level: 'ERROR',
        errorType: 'sync_error',
        message: `Customer sync failed: ${error.message}`
      }
    });

    throw error;
  }
};
