import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 flex items-center justify-between gap-3 bg-red-600/90 backdrop-blur text-white px-4 py-3 rounded-lg shadow-xl shadow-red-900/20 rtl:flex-row-reverse animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3">
        <WifiOff size={20} className="animate-pulse" />
        <span className="font-medium text-sm md:text-base">أنت في وضع عدم الاتصال. يتم الحفظ محلياً.</span>
      </div>
    </div>
  );
}
