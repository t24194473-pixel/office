import { useState, useMemo } from 'react';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Loader, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, Lock, Sparkles } from 'lucide-react';

function getPasswordStrength(pass) {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 8)           score++;
  if (/[A-Z]/.test(pass))         score++;
  if (/[0-9]/.test(pass))         score++;
  if (/[^A-Za-z0-9]/.test(pass))  score++;
  return score;
}

const STRENGTH_BARS   = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
const STRENGTH_TEXT   = ['', 'text-red-500', 'text-orange-400', 'text-yellow-500', 'text-green-500'];
const STRENGTH_LABEL  = ['', 'ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية 🔒'];

// ميزات تعرض في الجانب البصري
const features = [
  { icon: ShieldCheck, text: 'حساباتك وبياناتك محمية بالكامل' },
  { icon: Lock,        text: 'مصادقة آمنة عبر Firebase' },
  { icon: Sparkles,    text: 'دخول فوري بعد الموافقة من الإدارة' },
];

export default function Register() {
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const navigate = useNavigate();

  const strength         = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch   = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch= confirmPassword.length > 0 && password !== confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2)       return setError('الاسم يجب أن يكون حرفين على الأقل.');
    if (password.length < 8)          return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
    if (strength < 2)                 return setError('كلمة المرور ضعيفة. أضف أرقاماً أو أحرفاً كبيرة.');
    if (password !== confirmPassword)  return setError('كلمتا المرور غير متطابقتين.');

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', user.uid), {
        uid:       user.uid,
        name:      name.trim(),
        email:     email.trim().toLowerCase(),
        role:      'user',
        status:    'pending',
        createdAt: new Date().toISOString(),
      });
      navigate('/pending');
    } catch (err) {
      const map = {
        'auth/email-already-in-use':   'البريد مستخدم مسبقاً.',
        'auth/invalid-email':          'صيغة البريد غير صحيحة.',
        'auth/network-request-failed': 'تعذر الاتصال بالشبكة.',
      };
      setError(map[err.code] || 'حدث خطأ. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-950 transition-colors duration-300 rtl">

      {/* ===== الجانب البصري ===== */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-12 flex-col justify-between">
        
        {/* زخارف خلفية */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl" />
          {/* خطوط شبكية زخرفية */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* شعار */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-orange-500/30">
              D
            </div>
            <span className="text-white font-bold text-xl">دانزو</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-snug mb-4">
            انضم إلى مجتمعنا<br/>
            <span className="text-orange-400">وابدأ رحلتك معنا</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            يمكنك إنشاء حسابك الآن. سيراجع فريق الإدارة طلبك ويمنحك الوصول قريباً.
          </p>
        </div>

        {/* قائمة الميزات */}
        <div className="relative z-10 space-y-4">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-orange-400" />
              </div>
              <span className="text-gray-300 text-sm">{text}</span>
            </div>
          ))}

          {/* شارات تقنية */}
          <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-white/5">
            {['React', 'Firebase', 'Firestore', 'Tailwind CSS'].map(t => (
              <span key={t} className="text-[10px] font-mono bg-white/5 border border-white/10 text-gray-400 px-2.5 py-1 rounded-md">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== النموذج ===== */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12">

        {/* لوجو الجوال */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-orange-500/30">
            D
          </div>
          <span className="text-gray-900 dark:text-white font-bold text-xl">دانزو</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
              إنشاء حساب جديد
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-orange-600 font-semibold hover:text-orange-500 transition-colors">
                سجل دخولك هنا
              </Link>
            </p>
          </div>

          {/* رسالة خطأ */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm" role="alert">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} noValidate className="space-y-4">

            {/* الاسم */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                الاسم بالكامل
              </label>
              <input
                id="name" type="text" required
                value={name} onChange={e => setName(e.target.value)}
                disabled={loading} placeholder="أحمد محمد"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:opacity-60"
              />
            </div>

            {/* البريد */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                البريد الإلكتروني
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                disabled={loading} placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:opacity-60"
              />
            </div>

            {/* كلمة المرور */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password" type={showPass ? 'text' : 'password'} autoComplete="new-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  disabled={loading} placeholder="8 أحرف على الأقل"
                  className="w-full px-4 py-3 pe-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:opacity-60"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)} className="absolute inset-y-0 end-0 w-11 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* مؤشر القوة */}
              {password.length > 0 && (
                <div className="pt-1 space-y-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? STRENGTH_BARS[strength] : 'bg-gray-200 dark:bg-gray-700'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${STRENGTH_TEXT[strength]}`}>
                    قوة كلمة المرور: {STRENGTH_LABEL[strength]}
                  </p>
                </div>
              )}
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="confirmPassword" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" required
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  disabled={loading} placeholder="أعد كتابة كلمة المرور"
                  className={`w-full px-4 py-3 pe-11 rounded-xl border text-sm bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60 ${
                    passwordsMismatch ? 'border-red-400 focus:ring-red-400'
                    : passwordsMatch  ? 'border-green-400 focus:ring-green-400'
                    : 'border-gray-200 dark:border-gray-700 focus:ring-orange-500'
                  }`}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)} className="absolute inset-y-0 end-0 w-11 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> كلمتا المرور غير متطابقتين
                </p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <CheckCircle2 size={12} /> كلمتا المرور متطابقتان
                </p>
              )}
            </div>

            {/* زر التسجيل */}
            <button
              type="submit"
              disabled={loading || passwordsMismatch}
              className="w-full h-12 flex justify-center items-center gap-2 rounded-xl font-bold text-sm text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-orange-600/25 mt-1"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : 'إنشاء الحساب'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
