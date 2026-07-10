import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ requireAdmin = false }) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return null; // Controlled globally by App.jsx loader

  if (!user) {
    // لم يتم تسجيل الدخول
    return <Navigate to="/login" replace />;
  }

  if (profile?.status === 'pending') {
    // الحساب مسجل لكنه قيد الانتظار
    return <Navigate to="/pending" replace />;
  }

  if (profile?.status === 'rejected') {
    // الحساب مرفوض
    // يمكن عمل صفحة مستقلة للرفض، لكن مبدئياً نحوله لمعلومات الحساب
    return <Navigate to="/pending" replace />;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    // اليوزر ليس أدمن ولا يملك صلاحية الدخول لصفحات الإدارة
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
