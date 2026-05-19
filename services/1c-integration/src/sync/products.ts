import { PrismaClient } from '@prisma/client';
import { c1Client } from '../client/1c';

const prisma = new PrismaClient();

export const syncProducts = async () => {
  console.log('Starting product sync from 1C...');

  try {
    const products = await c1Client.getProducts();

    let syncedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        const existingProduct = await prisma.product.findUnique({
          where: { c1ProductId: product.id }
        });

        if (existingProduct) {
          await prisma.product.update({
            where: { c1ProductId: product.id },
            data: {
              name: product.name,
              price: product.price,
              description: product.description,
              category: product.category,
              sizes: product.sizes,
              inventory: product.inventory,
              lastSyncedAt: new Date()
            }
          });
          updatedCount++;
        } else {
          await prisma.product.create({
            data: {
              c1ProductId: product.id,
              name: product.name,
              price: product.price,
              description: product.description,
              category: product.category,
              sizes: product.sizes,
              inventory: product.inventory,
              lastSyncedAt: new Date()
            }
          });
          syncedCount++;
        }
      } catch (error: any) {
        errors.push(`Product ${product.id}: ${error.message}`);
      }
    }

    console.log(`Product sync completed: ${syncedCount} new, ${updatedCount} updated`);

    return {
      syncedCount,
      updatedCount,
      errors
    };
  } catch (error: any) {
    console.error('Product sync failed:', error.message);
    
    // Log error to database
    await prisma.systemLog.create({
      data: {
        component: '1c-integration',
        level: 'ERROR',
        errorType: 'sync_error',
        message: `Product sync failed: ${error.message}`
      }
    });

    throw error;
  }
};
