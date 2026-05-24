interface LoadingSpinnerProps {
  variant?: 'default' | 'dots' | 'pulse' | 'circle';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean; // Новый параметр для полноэкранного режима
}

export default function LoadingSpinner({ 
  variant = 'circle', 
  size = 'lg',
  text = 'Загрузка...',
  fullScreen = false // По умолчанию не полноэкранный
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  // Определяем классы контейнера в зависимости от режима
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-gray-50 z-50'
    : 'flex items-center justify-center min-h-screen bg-gray-100';

  // Современная круговая анимация
  if (variant === 'circle') {
    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Внешнее кольцо */}
            <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full`}></div>
            
            {/* Анимированное кольцо */}
            <div className={`${sizeClasses[size]} border-4 border-transparent border-t-slate-700 border-r-slate-700 rounded-full animate-spin absolute top-0 left-0`}></div>
            
            {/* Центральная точка */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-3 bg-slate-700 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <p className="mt-6 text-gray-700 font-medium text-lg">{text}</p>
        </div>
      </div>
    );
  }

  // Анимация точек
  if (variant === 'dots') {
    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center">
          <div className="flex space-x-3">
            <div className="w-4 h-4 bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-4 h-4 bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-4 h-4 bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="mt-6 text-gray-700 font-medium text-lg">{text}</p>
        </div>
      </div>
    );
  }

  // Пульсирующая анимация
  if (variant === 'pulse') {
    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Внешние волны */}
            <div className={`${sizeClasses[size]} bg-slate-700 rounded-full opacity-20 animate-ping absolute`}></div>
            <div className={`${sizeClasses[size]} bg-slate-700 rounded-full opacity-40 animate-pulse`}></div>
          </div>
          <p className="mt-6 text-gray-700 font-medium text-lg animate-pulse">{text}</p>
        </div>
      </div>
    );
  }

  // Старая анимация (default)
  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin`}></div>
        </div>
        <p className="mt-6 text-gray-700 font-medium text-lg">{text}</p>
      </div>
    </div>
  );
}
