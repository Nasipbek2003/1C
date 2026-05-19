'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('operator');
    router.push('/login');
  };

  const menuItems = [
    { path: '/home', icon: '📊', label: 'Главная' },
    { path: '/customers', icon: '👥', label: 'Клиенты' },
    { path: '/products', icon: '📦', label: 'Товары' },
    { path: '/orders', icon: '🛒', label: 'Заказы' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Панель управления</h1>
        <p className="text-sm text-gray-400 mt-1">Оператор</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
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
  );
}
