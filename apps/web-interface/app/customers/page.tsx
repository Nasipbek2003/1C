'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Customer {
  id: string;
  telegramUserId: string;
  username?: string;
  firstName?: string;
  phone?: string;
  name?: string;
  createdAt: string;
  _count?: {
    orders: number;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data.customers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading customers:', error);
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = search.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.username?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(search) ||
      customer.name?.toLowerCase().includes(searchLower)
    );
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('operator');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Панель управления</h1>
          <p className="text-sm text-gray-400 mt-1">Оператор</p>
        </div>

        <nav className="flex-1 p-4">
          <button
            onClick={() => router.push('/home')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white mb-2"
          >
            <span className="text-xl">📊</span>
            <span>Главная</span>
          </button>
          
          <button
            onClick={() => router.push('/customers')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-gray-800 text-white mb-2"
          >
            <span className="text-xl">👥</span>
            <span>Клиенты</span>
          </button>

          <button
            onClick={() => router.push('/products')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white mb-2"
          >
            <span className="text-xl">📦</span>
            <span>Товары</span>
          </button>

          <button
            onClick={() => router.push('/orders')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white mb-2"
          >
            <span className="text-xl">🛒</span>
            <span>Заказы</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-800">Клиенты</h2>
          <p className="text-gray-600 mt-1">Управление клиентами системы</p>
        </div>

        <div className="p-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Поиск по имени, телефону, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Всего клиентов</div>
            <div className="text-3xl font-bold text-gray-900">{customers.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">С телефоном</div>
            <div className="text-3xl font-bold text-gray-900">
              {customers.filter(c => c.phone).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Новых за сегодня</div>
            <div className="text-3xl font-bold text-gray-900">
              {customers.filter(c => {
                const today = new Date().toDateString();
                return new Date(c.createdAt).toDateString() === today;
              }).length}
            </div>
          </div>
        </div>

        {/* Customers table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Контакты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telegram ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата регистрации
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.name || customer.firstName || 'Без имени'}
                    </div>
                    {customer.username && (
                      <div className="text-sm text-gray-500">@{customer.username}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.phone || 'Не указан'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 font-mono">
                      {customer.telegramUserId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(customer.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Подробнее →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {search ? 'Клиенты не найдены' : 'Нет клиентов'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
