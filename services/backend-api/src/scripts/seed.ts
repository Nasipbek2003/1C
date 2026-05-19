import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create operators
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const operatorPasswordHash = await bcrypt.hash('operator123', 10);

  const admin = await prisma.operator.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      name: 'Администратор',
      isActive: true
    }
  });

  const operator = await prisma.operator.upsert({
    where: { username: 'operator' },
    update: {},
    create: {
      username: 'operator',
      passwordHash: operatorPasswordHash,
      name: 'Оператор',
      isActive: true
    }
  });

  console.log('Created operators:', { admin: admin.username, operator: operator.username });

  // Create sample products
  const products = [
    {
      c1ProductId: 'PROD-001',
      name: 'Футболка базовая',
      price: 1500,
      description: 'Классическая хлопковая футболка',
      category: 'Футболки',
      sizes: ['S', 'M', 'L', 'XL'],
      inventory: 50
    },
    {
      c1ProductId: 'PROD-002',
      name: 'Джинсы slim fit',
      price: 3500,
      description: 'Стильные джинсы зауженного кроя',
      category: 'Джинсы',
      sizes: ['28', '30', '32', '34', '36'],
      inventory: 30
    },
    {
      c1ProductId: 'PROD-003',
      name: 'Худи с капюшоном',
      price: 2800,
      description: 'Теплое худи из флиса',
      category: 'Толстовки',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      inventory: 40
    },
    {
      c1ProductId: 'PROD-004',
      name: 'Рубашка классическая',
      price: 2200,
      description: 'Деловая рубашка из хлопка',
      category: 'Рубашки',
      sizes: ['S', 'M', 'L', 'XL'],
      inventory: 25
    },
    {
      c1ProductId: 'PROD-005',
      name: 'Куртка демисезонная',
      price: 5500,
      description: 'Легкая куртка для весны и осени',
      category: 'Верхняя одежда',
      sizes: ['S', 'M', 'L', 'XL'],
      inventory: 15
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { c1ProductId: product.c1ProductId },
      update: {},
      create: {
        ...product,
        lastSyncedAt: new Date()
      }
    });
  }

  console.log(`Created ${products.length} products`);

  // Create sample customer
  const customer = await prisma.customer.upsert({
    where: { telegramUserId: '123456789' },
    update: {},
    create: {
      telegramUserId: '123456789',
      username: 'test_user',
      firstName: 'Тестовый',
      name: 'Тестовый Пользователь',
      phone: '+79991234567'
    }
  });

  console.log('Created sample customer:', customer.username);

  // Create sample chat session
  const chatSession = await prisma.chatSession.create({
    data: {
      customerId: customer.id,
      isActive: true
    }
  });

  console.log('Created sample chat session');

  // Create sample messages
  await prisma.message.create({
    data: {
      chatSessionId: chatSession.id,
      senderId: customer.telegramUserId,
      senderType: 'CUSTOMER',
      content: 'Здравствуйте! Хочу заказать футболку'
    }
  });

  await prisma.message.create({
    data: {
      chatSessionId: chatSession.id,
      senderId: operator.id,
      senderType: 'OPERATOR',
      content: 'Здравствуйте! Конечно, какой размер вам нужен?'
    }
  });

  await prisma.message.create({
    data: {
      chatSessionId: chatSession.id,
      senderId: customer.telegramUserId,
      senderType: 'CUSTOMER',
      content: 'Размер M, пожалуйста'
    }
  });

  console.log('Created sample messages');

  console.log('Database seeding completed!');
  console.log('\nTest credentials:');
  console.log('Admin: username=admin, password=admin123');
  console.log('Operator: username=operator, password=operator123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
