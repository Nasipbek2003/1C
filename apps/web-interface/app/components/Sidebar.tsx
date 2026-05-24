'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart,
  Shield,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [operatorRole, setOperatorRole] = useState<string>('OPERATOR');

  useEffect(() => {
    const operatorData = localStorage.getItem('operator');
    if (operatorData) {
      const operator = JSON.parse(operatorData);
      setOperatorRole(operator.role || 'OPERATOR');
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('operator');
    router.push('/login');
  };

  const allMenuItems = [
    { path: '/home', icon: LayoutDashboard, label: 'Главная', roles: ['ADMIN', 'OPERATOR'] },
    { path: '/customers', icon: Users, label: 'Клиенты', roles: ['ADMIN', 'OPERATOR'] },
    { path: '/products', icon: Package, label: 'Товары', roles: ['ADMIN', 'OPERATOR'] },
    { path: '/orders', icon: ShoppingCart, label: 'Заказы', roles: ['ADMIN', 'OPERATOR'] },
    { path: '/operators', icon: Shield, label: 'Операторы', roles: ['ADMIN'] },
  ];

  // Фильтруем меню в зависимости от роли
  const menuItems = allMenuItems.filter(item => item.roles.includes(operatorRole));

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Панель управления</h1>
        <p className="text-sm text-gray-400 mt-1">
          {operatorRole === 'ADMIN' ? 'Администратор' : 'Оператор'}
        </p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}
