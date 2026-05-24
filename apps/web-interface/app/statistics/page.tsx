'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  ShoppingCart, 
  Package,
  MessageSquare,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Archive
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Цвета для графиков
const COLORS = {
  primary: '#1e293b',    // slate-800
  success: '#10b981',    // emerald-500
  warning: '#f59e0b',    // amber-500
  danger: '#ef4444',     // red-500
  info: '#3b82f6',       // blue-500
  purple: '#8b5cf6',     // violet-500
  indigo: '#6366f1',     // indigo-500
  pink: '#ec4899',       // pink-500
};

const ORDER_STATUS_COLORS = [
  '#94a3b8', // gray - NEW
  '#10b981', // green - CONFIRMED
  '#3b82f6', // blue - PROCESSING
  '#6366f1', // indigo - SHIPPED
  '#10b981', // emerald - DELIVERED
  '#ef4444', // red - CANCELLED
];

export default function StatisticsPage() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<any>(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadStatistics();
  }, [router, period]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/api/statistics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStatistics(response.data.statistics);
      setLoading(false);
    } catch (error) {
      console.error('Error loading statistics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center text-gray-600">
            Не удалось загрузить статистику
          </div>
        </div>
      </div>
    );
  }

  const { overview, orders, products, messages, daily } = statistics;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 overflow-auto ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Статистика</h2>
              <p className="text-gray-600 mt-1">Аналитика и отчеты по системе</p>
            </div>
            
            {/* Period selector */}
            <div className="flex space-x-2">
              <button
                onClick={() => setPeriod('today')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'today'
                    ? 'bg-slate-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Сегодня
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'week'
                    ? 'bg-slate-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Неделя
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'month'
                    ? 'bg-slate-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Месяц
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Все время
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Overview Stats */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Общая статистика</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Всего клиентов</div>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800">{overview.totalCustomers}</div>
                {period !== 'all' && (
                  <div className="text-sm text-green-600 mt-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +{overview.newCustomers} новых
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Заказов</div>
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800">{overview.totalOrders}</div>
                <div className="text-sm text-gray-600 mt-2">
                  Средний чек: {overview.averageOrderValue.toFixed(0)} сом
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Выручка</div>
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {overview.totalRevenue.toFixed(0)} сом
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Активные чаты</div>
                  <MessageSquare className="w-5 h-5 text-violet-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800">{overview.activeChatSessions}</div>
                <div className="text-sm text-gray-600 mt-2">
                  Сообщений: {overview.totalMessages}
                </div>
              </div>
            </div>
          </div>

          {/* Orders Statistics */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Статистика заказов</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Статусы заказов - карточки */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">По статусам</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="text-xs text-gray-500">Новые</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{orders.byStatus.NEW}</div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-xs text-gray-500">Подтверждены</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{orders.byStatus.CONFIRMED}</div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <span className="text-xs text-gray-500">В обработке</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{orders.byStatus.PROCESSING}</div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Truck className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs text-gray-500">Отправлены</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{orders.byStatus.SHIPPED}</div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Archive className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs text-gray-500">Доставлены</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{orders.byStatus.DELIVERED}</div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-xs text-gray-500">Отменены</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{orders.byStatus.CANCELLED}</div>
                  </div>
                </div>
              </div>

              {/* Круговая диаграмма заказов */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Распределение заказов</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Новые', value: orders.byStatus.NEW },
                        { name: 'Подтверждены', value: orders.byStatus.CONFIRMED },
                        { name: 'В обработке', value: orders.byStatus.PROCESSING },
                        { name: 'Отправлены', value: orders.byStatus.SHIPPED },
                        { name: 'Доставлены', value: orders.byStatus.DELIVERED },
                        { name: 'Отменены', value: orders.byStatus.CANCELLED },
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ORDER_STATUS_COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Products Statistics */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Статистика товаров</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Всего товаров</div>
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800">{products.total}</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Низкий запас</div>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800">{products.lowStock}</div>
                <div className="text-sm text-gray-600 mt-2">Меньше 10 шт</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Нет в наличии</div>
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800">{products.outOfStock}</div>
              </div>
            </div>

            {/* Top Products */}
            {products.topProducts && products.topProducts.length > 0 && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Топ-5 товаров</h4>
                <div className="space-y-4">
                  {products.topProducts.map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-gray-800">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-800">{product.ordersCount} заказов</div>
                        <div className="text-sm text-gray-600">{product.totalQuantity} шт</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Messages Statistics */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Статистика сообщений</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Карточки */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">От клиентов</div>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{messages.byType.CUSTOMER}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {messages.total > 0 ? ((messages.byType.CUSTOMER / messages.total) * 100).toFixed(1) : 0}% от всех
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">От операторов</div>
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{messages.byType.OPERATOR}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {messages.total > 0 ? ((messages.byType.OPERATOR / messages.total) * 100).toFixed(1) : 0}% от всех
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">От бота</div>
                    <MessageSquare className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{messages.byType.BOT}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {messages.total > 0 ? ((messages.byType.BOT / messages.total) * 100).toFixed(1) : 0}% от всех
                  </div>
                </div>
              </div>

              {/* Круговая диаграмма сообщений */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Распределение сообщений</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'От клиентов', value: messages.byType.CUSTOMER },
                        { name: 'От операторов', value: messages.byType.OPERATOR },
                        { name: 'От бота', value: messages.byType.BOT },
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill={COLORS.info} />
                      <Cell fill={COLORS.success} />
                      <Cell fill={COLORS.purple} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Daily Statistics */}
          {daily && daily.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Динамика за последние 7 дней</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* График заказов и выручки */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Заказы и выручка</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })}
                        formatter={(value: any, name: string) => {
                          if (name === 'Выручка') return [`${value.toFixed(0)} сом`, name];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="orders" 
                        stroke={COLORS.info} 
                        strokeWidth={2}
                        name="Заказы"
                        dot={{ fill: COLORS.info }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={COLORS.success} 
                        strokeWidth={2}
                        name="Выручка"
                        dot={{ fill: COLORS.success }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* График новых клиентов */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Новые клиенты</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })}
                      />
                      <Legend />
                      <Bar 
                        dataKey="customers" 
                        fill={COLORS.purple} 
                        name="Новые клиенты"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Таблица */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Детальная таблица</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Дата</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Заказы</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Выручка</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Новые клиенты</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daily.map((day: any) => (
                        <tr key={day.date} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-800">
                            {new Date(day.date).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800 text-right font-medium">
                            {day.orders}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800 text-right font-medium">
                            {day.revenue.toFixed(0)} сом
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800 text-right font-medium">
                            {day.customers}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {(overview.pendingNotifications > 0 || overview.failedNotifications > 0) && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Уведомления</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">Ожидают отправки</div>
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{overview.pendingNotifications}</div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">Ошибки отправки</div>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{overview.failedNotifications}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
