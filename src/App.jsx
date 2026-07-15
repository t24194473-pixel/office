

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import './App.css';
import { router } from './routes/AppRouter';
import { useAuthStore } from './store/authStore';
import { Loader } from 'lucide-react';
import NetworkStatus from './components/NetworkStatus';

function App() {
  const { initAuth, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, [initAuth]);

  if (isLoading) {
    return (
      <div className="flex bg-gray-50 dark:bg-gray-950 h-dvh w-full items-center justify-center">
         <div className="flex flex-col items-center gap-4">
           <Loader size={40} className="text-orange-500 animate-spin" />
           <p className="text-gray-500 font-semibold">جاري تهيئة النظام...</p>
         </div>
      </div>
    );
  }

  return (
    <>
      <NetworkStatus />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
