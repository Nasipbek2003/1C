interface LoadingSpinnerProps {
  variant?: 'default' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ 
  variant = 'default', 
  size = 'md',
  text = 'Загрузка...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const innerSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">{text}</p>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className={`${sizeClasses[size]} bg-slate-700 rounded-full animate-ping absolute`}></div>
          <div className={`${sizeClasses[size]} bg-slate-700 rounded-full`}></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium animate-pulse">{text}</p>
      </div>
    );
  }

  // Default spinner
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className={`${sizeClasses[size]} border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin`}></div>
        
        {/* Inner pulsing circle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className={`${innerSizeClasses[size]} bg-slate-700 rounded-full animate-pulse`}></div>
        </div>
      </div>
      
      <p className="mt-6 text-gray-600 font-medium animate-pulse">{text}</p>
    </div>
  );
}
