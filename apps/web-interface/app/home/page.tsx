'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  MessageSquare, 
  Users, 
  Calendar,
  DollarSign
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function HomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [operator, setOperator] = useState<any>(null);
  const [stats, setStats] = useState({
    activeSessions: 0,
    totalCustomers: 0,
    todayOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const operatorData = localStorage.getItem('operator');

    if (!token || !operatorData) {
      router.push('/login');
      return;
    }

    setOperator(JSON.parse(operatorData));
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const sessionsResponse = await axios.get(`${API_URL}/api/chat-sessions?active=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(sessionsResponse.data.sessions);

      const customersResponse = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ordersResponse = await axios.get(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const today = new Date().toDateString();
      const todayOrders = ordersResponse.data.orders.filter((order: any) => 
        new Date(order.createdAt).toDateString() === today
      );

      setStats({
        activeSessions: sessionsResponse.data.sessions.length,
        totalCustomers: customersResponse.data.customers.length,
        todayOrders: todayOrders.length,
        totalRevenue: ordersResponse.data.orders.reduce((sum: number, order: any) => 
          sum + parseFloat(order.totalAmount), 0
        )
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('operator');
    router.push('/login');
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Панель оператора</h2>
            <p className="text-gray-600 mt-1">Обзор системы и активные чаты</p>
          </div>
        </div>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Активные чаты</div>
                <MessageSquare className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{stats.activeSessions}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Всего клиентов</div>
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{stats.totalCustomers}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Заказов сегодня</div>
                <Calendar className="w-5 h-5 text-violet-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{stats.todayOrders}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Общая выручка</div>
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{stats.totalRevenue.toFixed(0)} сом</div>
            </div>
          </div>

          {/* Active Chats */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Активные чаты ({sessions.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session: any) => (
              <div
                key={session.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {session.customer.firstName || session.customer.username || 'Клиент'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      ID: {session.customer.id.substring(0, 8)}...
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-slate-700 text-white text-xs font-medium rounded">
                    Активен
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {new Date(session.lastActivityAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <button
                  onClick={() => router.push(`/chat/${session.id}`)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Открыть чат</span>
                </button>
              </div>
            ))}
          </div>

          {sessions.length === 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">Нет активных чатов</p>
              <p className="text-gray-500 text-sm mt-2">
                Новые чаты появятся здесь, когда клиенты начнут общение
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
