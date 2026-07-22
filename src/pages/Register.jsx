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
  const [phone,           setPhone]           = useState('');
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
    if (!phone.trim())                return setError('الرجاء إدخال رقم المحامي.');
    if (phone.trim().startsWith('+') || phone.trim().startsWith('00')) return setError('الرجاء إدخال الرقم بدون مفتاح الدولة.');
    if (password.length < 8)          return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
    if (strength < 2)                 return setError('كلمة المرور ضعيفة. أضف أرقاماً أو أحرفاً كبيرة.');
    if (password !== confirmPassword)  return setError('كلمتا المرور غير متطابقتين.');

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', user.uid), {
        uid:       user.uid,
        name:      name.trim(),
        phone:     phone.trim(),
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
    <div className="flex lg:flex-row flex-col bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300 rtl">

      {/* ===== الجانب البصري ===== */}
      <div className="hidden relative lg:flex flex-col justify-between bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-12 lg:w-1/2 xl:w-2/5 overflow-hidden">
        
        {/* زخارف خلفية */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="-top-24 -left-24 absolute bg-orange-500/10 blur-3xl rounded-full w-96 h-96" />
          <div className="-right-16 -bottom-16 absolute bg-amber-400/10 blur-3xl rounded-full w-80 h-80" />
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
        <div className="z-10 relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="flex justify-center items-center bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 rounded-xl w-11 h-11 font-bold text-white text-xl">
              D
            </div>
            <span className="font-bold text-white text-xl">دانزو</span>
          </div>

          <h1 className="mb-4 font-extrabold text-white text-4xl leading-snug">
            انضم إلى مجتمعنا<br/>
            <span className="text-orange-400">وابدأ رحلتك معنا</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            يمكنك إنشاء حسابك الآن. سيراجع فريق الإدارة طلبك ويمنحك الوصول قريباً.
          </p>
        </div>

        {/* قائمة الميزات */}
        <div className="z-10 relative space-y-4">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-4">
              <div className="flex justify-center items-center bg-orange-500/10 border border-orange-500/20 rounded-xl w-10 h-10 shrink-0">
                <Icon size={18} className="text-orange-400" />
              </div>
              <span className="text-gray-300 text-sm">{text}</span>
            </div>
          ))}

          {/* شارات تقنية */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-white/5 border-t">
            {['React', 'Firebase', 'Firestore', 'Tailwind CSS'].map(t => (
              <span key={t} className="bg-white/5 px-2.5 py-1 border border-white/10 rounded-md font-mono text-[10px] text-gray-400">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== النموذج ===== */}
      <div className="flex flex-col flex-1 justify-center items-center p-6 sm:p-10 lg:p-12">

        {/* لوجو الجوال */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="flex justify-center items-center bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 rounded-xl w-10 h-10 font-bold text-white text-lg">
            D
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-xl">دانزو</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="mb-2 font-extrabold text-gray-900 dark:text-white text-2xl sm:text-3xl">
              إنشاء حساب جديد
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                سجل دخولك هنا
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

          <form onSubmit={handleRegister} noValidate className="space-y-4">

            {/* الاسم */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                الاسم بالكامل
              </label>
              <input
                id="name" type="text" required
                value={name} onChange={e => setName(e.target.value)}
                disabled={loading} placeholder="أحمد محمد"
                className="bg-white dark:bg-gray-800/60 disabled:opacity-60 px-4 py-3 border border-gray-200 focus:border-transparent dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-full text-gray-900 dark:text-white text-sm transition-all placeholder-gray-400"
              />
            </div>

            {/* البريد */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                البريد الإلكتروني
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                disabled={loading} placeholder="name@example.com"
                className="bg-white dark:bg-gray-800/60 disabled:opacity-60 px-4 py-3 border border-gray-200 focus:border-transparent dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-full text-gray-900 dark:text-white text-sm transition-all placeholder-gray-400"
              />
            </div>

            {/* رقم المحامي */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                رقم الجوال <span className="font-normal text-gray-400 text-xs">(بدون مفتاح الدولة)</span>
              </label>
              <input
                id="phone" type="tel" required
                value={phone} onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, ''); // السماح بالأرقام فقط
                  setPhone(val);
                }}
                disabled={loading} placeholder="مثال: 05XXXXXXXX"
                dir="ltr"
                className="bg-white dark:bg-gray-800/60 disabled:opacity-60 px-4 py-3 border border-gray-200 focus:border-transparent dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-full text-gray-900 dark:text-white text-sm text-left transition-all placeholder-gray-400"
              />
            </div>

            {/* كلمة المرور */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password" type={showPass ? 'text' : 'password'} autoComplete="new-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  disabled={loading} placeholder="8 أحرف على الأقل"
                  className="bg-white dark:bg-gray-800/60 disabled:opacity-60 px-4 py-3 pe-11 border border-gray-200 focus:border-transparent dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-full text-gray-900 dark:text-white text-sm transition-all placeholder-gray-400"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)} className="absolute inset-y-0 flex justify-center items-center w-11 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors end-0">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* مؤشر القوة */}
              {password.length > 0 && (
                <div className="space-y-1.5 pt-1">
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
              <label htmlFor="confirmPassword" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
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
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)} className="absolute inset-y-0 flex justify-center items-center w-11 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors end-0">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle size={12} /> كلمتا المرور غير متطابقتين
                </p>
              )}
              {passwordsMatch && (
                <p className="flex items-center gap-1 mt-1 text-green-500 text-xs">
                  <CheckCircle2 size={12} /> كلمتا المرور متطابقتان
                </p>
              )}
            </div>

            {/* زر التسجيل */}
            <button
              type="submit"
              disabled={loading || passwordsMismatch}
              className="flex justify-center items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 shadow-orange-600/25 shadow-xl mt-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 w-full h-12 font-bold text-white text-sm active:scale-[0.98] transition-all disabled:cursor-not-allowed"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : 'إنشاء الحساب'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
