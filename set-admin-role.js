const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setAdminRole() {
  try {
    console.log('🔍 Поиск операторов...');
    
    const operators = await prisma.operator.findMany({
      orderBy: { createdAt: 'asc' }
    });

    if (operators.length === 0) {
      console.log('❌ Операторы не найдены');
      return;
    }

    console.log(`✅ Найдено операторов: ${operators.length}`);
    
    // Устанавливаем роль ADMIN первому оператору
    const firstOperator = operators[0];
    
    await prisma.operator.update({
      where: { id: firstOperator.id },
      data: { role: 'ADMIN' }
    });

    console.log(`✅ Оператору ${firstOperator.username} (${firstOperator.name}) установлена роль ADMIN`);
    
    // Показываем всех операторов
    console.log('\n📋 Список всех операторов:');
    const allOperators = await prisma.operator.findMany({
      select: {
        username: true,
        name: true,
        role: true,
        isActive: true
      }
    });
    
    allOperators.forEach(op => {
      console.log(`  - ${op.username} (${op.name}) - ${op.role} - ${op.isActive ? 'Активен' : 'Неактивен'}`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole();
