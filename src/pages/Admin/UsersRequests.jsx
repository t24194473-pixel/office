import { useEffect, useState, useCallback } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Check, X, User as UserIcon, Loader, ShieldCheck, Clock, Users, ShieldAlert, Crown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// البريد الإلكتروني للمسؤول الأعلى (Super Admin) — مقروء من متغيرات البيئة
const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL?.trim().toLowerCase();

// ===== مكوِّن بطاقة المستخدم =====
function UserCard({ user, actions }) {
  const initial = user.name ? user.name.charAt(0).toUpperCase() : null;

  return (
    <li className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-4">
        {/* أفاتار */}
        <div className="flex justify-center items-center bg-orange-100 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/30 rounded-full w-12 h-12 font-bold text-orange-600 dark:text-orange-400 text-xl shrink-0">
          {initial ?? <UserIcon size={20} />}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
              {user.name || 'مستخدم جديد'}
            </h3>
            {user.email?.toLowerCase() === SUPER_ADMIN_EMAIL ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-full">
                <Crown size={10} /> المسؤول الأعلى
              </span>
            ) : user.role === 'admin' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 px-2 py-0.5 rounded-full">
                <ShieldCheck size={10} /> مسؤول
              </span>
            ) : null}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{user.email}</p>
          {user.createdAt && (
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 flex items-center gap-1">
              <Clock size={11} />
              {new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex items-center gap-2 mt-1 sm:mt-0 w-full sm:w-auto flex-wrap">
        {actions}
      </div>
    </li>
  );
}

// ===== الصفحة الرئيسية =====
export default function UsersRequests() {
  const { profile } = useAuthStore();
  // هل المستخدم الحالي هو المسؤول الأعلى؟
  const isSuperAdmin = profile?.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  const [pendingUsers,  setPendingUsers]  = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('pending');
  const [actionLoading, setActionLoading] = useState(null); // uid الذي يجري عليه عملية

  // جلب جميع المستخدمين عند تحميل الصفحة
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [pendingSnap, approvedSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'users'), where('status', '==', 'approved'))),
        ]);

        if (!cancelled) {
          setPendingUsers(pendingSnap.docs.map(d => d.data()));
          setApprovedUsers(approvedSnap.docs.map(d => d.data()));
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ====== الإجراءات ======
  const updateUser = useCallback(async (uid, data, onSuccess) => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), data);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleApprove = (uid) =>
    updateUser(uid, { status: 'approved' }, () => {
      const user = pendingUsers.find(u => u.uid === uid);
      setPendingUsers(prev => prev.filter(u => u.uid !== uid));
      if (user) setApprovedUsers(prev => [...prev, { ...user, status: 'approved' }]);
    });

  const handleReject = (uid) =>
    updateUser(uid, { status: 'rejected' }, () => {
      setPendingUsers(prev => prev.filter(u => u.uid !== uid));
    });

  const handleMakeAdmin = (uid) =>
    updateUser(uid, { role: 'admin' }, () => {
      setApprovedUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: 'admin' } : u));
    });

  const handleRemoveAdmin = (uid) =>
    updateUser(uid, { role: 'user' }, () => {
      setApprovedUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: 'user' } : u));
    });

  const handleRevokeAccess = (uid) =>
    updateUser(uid, { status: 'pending', role: 'user' }, () => {
      const user = approvedUsers.find(u => u.uid === uid);
      setApprovedUsers(prev => prev.filter(u => u.uid !== uid));
      if (user) setPendingUsers(prev => [...prev, { ...user, status: 'pending', role: 'user' }]);
    });

  // ====== Tabs ======
  const tabs = [
    { id: 'pending',  label: 'قيد الانتظار', icon: Clock,    count: pendingUsers.length },
    { id: 'approved', label: 'المقبولون',    icon: Users,    count: approvedUsers.length },
  ];

  return (
    <div className="mx-auto px-4 sm:px-6 md:px-8 w-full max-w-5xl transition-colors duration-300">

      {/* العنوان */}
      <div className="mb-6">
        <h1 className="font-bold text-gray-900 dark:text-white text-2xl sm:text-3xl mb-1 transition-colors">
          إدارة الفريق
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          موافقة على الطلبات الجديدة وإدارة صلاحيات الأعضاء.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit transition-colors">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Icon size={15} />
            {label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              activeTab === id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* البطاقة الرئيسية */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm transition-colors">

        {loading ? (
          <div className="flex flex-col justify-center items-center h-52 gap-3 text-gray-400 dark:text-gray-500">
            <Loader size={32} className="text-orange-500 animate-spin" />
            <p className="text-sm">جاري تحميل البيانات...</p>
          </div>

        ) : activeTab === 'pending' ? (
          pendingUsers.length === 0 ? (
            <EmptyState icon={Clock} message="لا توجد طلبات انضمام في الوقت الحالي." />
          ) : (
            <ul>
              {pendingUsers.map(user => (
                <UserCard
                  key={user.uid}
                  user={user}
                  actions={
                    <>
                      <button
                        disabled={actionLoading === user.uid}
                        onClick={() => handleReject(user.uid)}
                        className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 py-2 border border-red-200 dark:border-red-700 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === user.uid ? <Loader size={14} className="animate-spin" /> : <X size={14} />}
                        رفض
                      </button>
                      <button
                        disabled={actionLoading === user.uid}
                        onClick={() => handleApprove(user.uid)}
                        className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-xl text-white text-sm font-medium transition-colors shadow-sm shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === user.uid ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                        قبول
                      </button>
                    </>
                  }
                />
              ))}
            </ul>
          )

        ) : (
          approvedUsers.length === 0 ? (
            <EmptyState icon={Users} message="لا يوجد أعضاء مقبولون حتى الآن." />
          ) : (
            <ul>
              {approvedUsers.map(user => (
                <UserCard
                  key={user.uid}
                  user={user}
                  actions={
                    (() => {
                      const isTargetSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
                      const targetIsAdmin = user.role === 'admin';

                      // السوبر أدمن محمي دائماً
                      if (isTargetSuperAdmin) {
                        return (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center gap-1.5">
                            <Crown size={13} /> محمي
                          </span>
                        );
                      }

                      // زر إلغاء القبول (مشترك لجميع المستخدمين غير المحميين)
                      const revokeBtn = (
                        <button
                          disabled={actionLoading === user.uid}
                          onClick={() => handleRevokeAccess(user.uid)}
                          className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === user.uid ? <Loader size={14} className="animate-spin" /> : <X size={14} />}
                          إلغاء القبول
                        </button>
                      );

                      if (targetIsAdmin) {
                        // أدمن عادي: فقط السوبر أدمن يرى زري (إزالة المسؤولية + إلغاء القبول)
                        if (!isSuperAdmin) {
                          return (
                            <span className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center gap-1.5">
                              <ShieldCheck size={13} /> مسؤول
                            </span>
                          );
                        }
                        return (
                          <>
                            <button
                              disabled={actionLoading === user.uid}
                              onClick={() => handleRemoveAdmin(user.uid)}
                              className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 py-2 border border-orange-200 dark:border-orange-700 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === user.uid ? <Loader size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                              إزالة المسؤولية
                            </button>
                            {revokeBtn}
                          </>
                        );
                      }

                      // مستخدم عادي: زر الترقية + زر إلغاء القبول
                      return (
                        <>
                          <button
                            disabled={actionLoading === user.uid}
                            onClick={() => handleMakeAdmin(user.uid)}
                            className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-xl text-white text-sm font-medium transition-colors shadow-sm shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === user.uid ? <Loader size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                            ترقية لمسؤول
                          </button>
                          {revokeBtn}
                        </>
                      );
                    })()

                  }
                />
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col justify-center items-center h-52 gap-3 text-gray-400 dark:text-gray-500">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <Icon size={28} className="opacity-60" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
