import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/statistics - Получить статистику
router.get('/', authenticate, async (req, res) => {
  try {
    const { period = 'all' } = req.query; // all, today, week, month

    // Определяем временной диапазон
    let dateFilter: any = {};
    const now = new Date();
    
    if (period === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { gte: startOfDay };
    } else if (period === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - 7));
      dateFilter = { gte: startOfWeek };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.setDate(now.getDate() - 30));
      dateFilter = { gte: startOfMonth };
    }

    // Общая статистика
    const [
      totalCustomers,
      totalOrders,
      totalProducts,
      activeChatSessions,
      totalMessages,
      newCustomers,
      pendingNotifications,
      failedNotifications
    ] = await Promise.all([
      // Всего клиентов
      prisma.customer.count(),
      
      // Всего заказов
      prisma.order.count(
        Object.keys(dateFilter).length > 0 
          ? { where: { createdAt: dateFilter } }
          : undefined
      ),
      
      // Всего товаров
      prisma.product.count(),
      
      // Активные чаты
      prisma.chatSession.count({
        where: { isActive: true }
      }),
      
      // Всего сообщений
      prisma.message.count(
        Object.keys(dateFilter).length > 0 
          ? { where: { createdAt: dateFilter } }
          : undefined
      ),
      
      // Новые клиенты
      prisma.customer.count(
        Object.keys(dateFilter).length > 0 
          ? { where: { createdAt: dateFilter } }
          : undefined
      ),
      
      // Ожидающие уведомления
      prisma.notification.count({
        where: { status: 'PENDING' }
      }),
      
      // Неудачные уведомления
      prisma.notification.count({
        where: { status: 'FAILED' }
      })
    ]);

    // Статистика по заказам
    const orders = await prisma.order.findMany({
      where: Object.keys(dateFilter).length > 0 
        ? { createdAt: dateFilter }
        : undefined,
      select: {
        status: true,
        totalAmount: true,
        createdAt: true
      }
    });

    const ordersByStatus = {
      NEW: orders.filter(o => o.status === 'NEW').length,
      CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
      PROCESSING: orders.filter(o => o.status === 'PROCESSING').length,
      SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
      DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
      CANCELLED: orders.filter(o => o.status === 'CANCELLED').length
    };

    const totalRevenue = orders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount.toString());
    }, 0);

    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Статистика по товарам
    const [
      lowStockProducts,
      outOfStockProducts,
      topProducts
    ] = await Promise.all([
      // Товары с низким запасом (меньше 10)
      prisma.product.count({
        where: {
          inventory: {
            lt: 10,
            gt: 0
          }
        }
      }),
      
      // Товары без запаса
      prisma.product.count({
        where: { inventory: 0 }
      }),
      
      // Топ товаров по количеству заказов
      prisma.orderItem.groupBy({
        by: ['productId'],
        _count: {
          productId: true
        },
        _sum: {
          quantity: true
        },
        orderBy: {
          _count: {
            productId: 'desc'
          }
        },
        take: 5
      })
    ]);

    // Получаем информацию о топ товарах
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            category: true
          }
        });
        return {
          ...product,
          ordersCount: item._count.productId,
          totalQuantity: item._sum.quantity || 0
        };
      })
    );

    // Статистика по сообщениям
    const messagesByType = await prisma.message.groupBy({
      by: ['senderType'],
      _count: {
        senderType: true
      },
      where: Object.keys(dateFilter).length > 0 
        ? { createdAt: dateFilter }
        : undefined
    });

    const messagesStats = {
      CUSTOMER: messagesByType.find(m => m.senderType === 'CUSTOMER')?._count.senderType || 0,
      OPERATOR: messagesByType.find(m => m.senderType === 'OPERATOR')?._count.senderType || 0,
      BOT: messagesByType.find(m => m.senderType === 'BOT')?._count.senderType || 0
    };

    // Статистика по дням (последние 7 дней)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const dailyStats = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const [ordersCount, revenue, customersCount] = await Promise.all([
          prisma.order.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDay
              }
            }
          }),
          prisma.order.aggregate({
            where: {
              createdAt: {
                gte: date,
                lt: nextDay
              }
            },
            _sum: {
              totalAmount: true
            }
          }),
          prisma.customer.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDay
              }
            }
          })
        ]);

        return {
          date: date.toISOString().split('T')[0],
          orders: ordersCount,
          revenue: parseFloat(revenue._sum.totalAmount?.toString() || '0'),
          customers: customersCount
        };
      })
    );

    res.json({
      success: true,
      period,
      statistics: {
        overview: {
          totalCustomers,
          newCustomers,
          totalOrders,
          totalProducts,
          activeChatSessions,
          totalMessages,
          totalRevenue,
          averageOrderValue,
          pendingNotifications,
          failedNotifications
        },
        orders: {
          byStatus: ordersByStatus,
          total: totalOrders,
          revenue: totalRevenue,
          averageValue: averageOrderValue
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
          topProducts: topProductsWithDetails
        },
        messages: {
          total: totalMessages,
          byType: messagesStats
        },
        daily: dailyStats
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
