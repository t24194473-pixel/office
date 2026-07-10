import { useAuthStore } from '../store/authStore';
import { Clock, LogOut } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function PendingApproval() {
  const { profile, logout } = useAuthStore();

  // لو كان الحساب أُعطي صلاحية بالخطأ واليوزر في هذه الصفحة، يتم طرده للصفحة الرئيسية
  if (profile?.status === 'approved') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-10 px-6 shadow-xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 text-center transition-colors">
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-orange-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            حسابك قيد المراجعة
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            مرحباً بك {profile?.name}. لقد تم استلام طلب تسجيلك بنجاح. يرجى الانتظار لحين مراجعة حسابك والموافقة عليه من قبل الإدارة.
          </p>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
