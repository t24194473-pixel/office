import { useState, useCallback, useRef, useEffect } from 'react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Loader, Eye, EyeOff, AlertCircle, Sparkles, TrendingUp, Users, FolderKanban } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const ERROR_MESSAGES = {
  'auth/invalid-credential':      'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth/user-not-found':          'لا يوجد حساب مرتبط بهذا البريد.',
  'auth/wrong-password':          'كلمة المرور غير صحيحة.',
  'auth/user-disabled':           'هذا الحساب موقوف. تواصل مع الإدارة.',
  'auth/too-many-requests':       'تم تجاوز محاولات الدخول. حاول بعد قليل.',
  'auth/network-request-failed':  'تعذر الاتصال. تحقق من اتصالك بالإنترنت.',
};
const MAX_ATTEMPTS = 5;

// بطاقات الإحصاء الجانبية
const stats = [
  { icon: FolderKanban, label: 'مشروع نشط',  value: '24',  color: 'from-orange-400/80 to-orange-600/80' },
  { icon: Users,        label: 'عضو في الفريق', value: '150', color: 'from-amber-400/80 to-orange-500/80' },
  { icon: TrendingUp,   label: 'نسبة الإنجاز', value: '87%', color: 'from-orange-500/80 to-red-400/80' },
];

export default function Login() {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [attempts,    setAttempts]    = useState(0);
  const [isLocked,    setIsLocked]    = useState(false);
  const lockedUntilRef = useRef(null);
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  // تأثير تلقائي للانتقال عند توفر بيانات الحساب بشكل كامل من Firebase و authStore
  useEffect(() => {
    if (user && profile) {
      if (profile.status === 'pending' || profile.status === 'rejected') {
        navigate('/pending', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    // تحقق من الحظر
    if (lockedUntilRef.current && Date.now() < lockedUntilRef.current) {
      setIsLocked(true);
      return;
    } else {
      lockedUntilRef.current = null;
      setIsLocked(false);
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setAttempts(0);
      // لن نوقف الـ loading هنا، وسنترك الـ useEffect ينقلنا عندما يصبح الـ profile جاهزاً
      // هذا يمنع الشاشة من الوميض وتجنب طرد المستخدم من ProtectedRoute لعدم مزامنة Store
    } catch (err) {
      setLoading(false); // نوقف التحميل فقط في حال الفشل
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        lockedUntilRef.current = Date.now() + 60_000;
        setIsLocked(true);
        setError('تم تجاوز المحاولات المسموحة. يُرجى الانتظار 60 ثانية.');
        setAttempts(0);
      } else {
        setError((ERROR_MESSAGES[err.code] || 'حدث خطأ غير متوقع.') + ` (${next}/${MAX_ATTEMPTS})`);
      }
    }
  }, [email, password, attempts]);

  return (
    <div className="flex lg:flex-row flex-col bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300 rtl">

      {/* ===== الجانب البصري (يسار في RTL = اليمين) ===== */}
      <div className="hidden relative lg:flex flex-col justify-between bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 p-12 lg:w-1/2 xl:w-3/5 overflow-hidden">
        
        {/* خلفية هندسية زخرفية */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="-top-32 -right-32 absolute bg-white/5 blur-3xl rounded-full w-[500px] h-[500px]" />
          <div className="-bottom-40 -left-20 absolute bg-amber-400/20 blur-3xl rounded-full w-[400px] h-[400px]" />
          <div className="top-1/2 left-1/2 absolute border border-white/10 rounded-full w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2" />
          <div className="top-1/2 left-1/2 absolute border border-white/10 rounded-full w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2" />
          {/* نقاط زخرفية */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/30 rounded-full w-1.5 h-1.5"
              style={{
                top: `${15 + (i * 7) % 70}%`,
                left: `${10 + (i * 13) % 80}%`,
              }}
            />
          ))}
        </div>

        {/* شعار وعنوان */}
        <div className="z-10 relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="flex justify-center items-center bg-white/20 shadow-lg backdrop-blur border border-white/30 rounded-xl w-11 h-11 font-bold text-white text-xl">
              D
            </div>
            <span className="font-bold text-white text-2xl tracking-tight">دانزو</span>
          </div>

          <h1 className="mb-4 font-extrabold text-white text-4xl xl:text-5xl leading-tight">
            منصتك الذكية<br />
            <span className="text-orange-200">لإدارة مشاريعك</span>
          </h1>
          <p className="max-w-sm text-orange-100/80 text-lg leading-relaxed">
            تتبع تقدمك، وتعاون مع فريقك، وأنجز مهامك في مكان واحد متكامل.
          </p>
        </div>

        {/* بطاقات الإحصاء الزجاجية */}
        <div className="z-10 relative space-y-3">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="flex items-center gap-4 bg-white/10 hover:bg-white/15 shadow-lg backdrop-blur-md p-4 border border-white/20 rounded-2xl transition-colors"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md shrink-0`}>
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-xl leading-none">{value}</p>
                <p className="mt-1 text-orange-100/70 text-sm">{label}</p>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <Sparkles size={16} className="text-orange-200" />
            <span className="text-orange-200 text-sm">مع دانزو، أنجز أضعاف ما كنت تنجزه</span>
          </div>
        </div>
      </div>

      {/* ===== الجانب الأيسر: النموذج ===== */}
      <div className="flex flex-col flex-1 justify-center items-center p-6 sm:p-10 lg:p-12">

        {/* لوجو للجوال فقط */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="flex justify-center items-center bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 rounded-xl w-10 h-10 font-bold text-white text-lg">
            D
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-xl">دانزو</span>
        </div>

        <div className="w-full max-w-sm">
          {/* العنوان */}
          <div className="mb-8">
            <h2 className="mb-2 font-extrabold text-gray-900 dark:text-white text-2xl sm:text-3xl">
              مرحباً بعودتك 👋
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                أنشئ حساباً الآن
              </Link>
            </p>
          </div>

          {/* رسالة خطأ */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 mb-5 px-4 py-3 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-400 text-sm" role="alert">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate className="space-y-4">

            {/* البريد الإلكتروني */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading || isLocked}
                placeholder="name@example.com"
                className="bg-white dark:bg-gray-800/60 disabled:opacity-60 px-4 py-3 border border-gray-200 focus:border-transparent dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-full text-gray-900 dark:text-white text-sm transition-all placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* كلمة المرور */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                  كلمة المرور
                </label>
                
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading || isLocked}
                  placeholder="••••••••"
                  className="bg-white dark:bg-gray-800/60 disabled:opacity-60 px-4 py-3 pe-11 border border-gray-200 focus:border-transparent dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-full text-gray-900 dark:text-white text-sm transition-all placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  className="absolute inset-y-0 flex justify-center items-center w-11 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors end-0"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {/* زر الدخول */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="flex justify-center items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 shadow-orange-600/25 shadow-xl mt-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 w-full h-12 font-bold text-white text-sm active:scale-[0.98] transition-all disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader className="animate-spin" size={20} />
                : isLocked
                ? '🔒 محظور مؤقتاً'
                : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
