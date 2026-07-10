import { useState } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Save, AlertCircle, ArrowRight, Scale, MapPin, Calendar, FileText } from 'lucide-react';
import { CASE_TYPES, CASE_STATUSES } from './casesConfig';

/* ─── توليد كلمات مفتاحية للبحث الذكي ─── */
function buildKeywords(...texts) {
  const kws = new Set();
  texts.filter(Boolean).forEach(text => {
    const words = text.toLowerCase().trim().split(/\s+/);
    words.forEach(word => {
      let prefix = '';
      for (const ch of word) {
        prefix += ch;
        kws.add(prefix);
      }
    });
  });
  return Array.from(kws);
}

/* ─── مكوِّن مجموعة حقول النموذج ─── */
function FormSection({ icon: Icon, title, children }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 mb-5 font-semibold text-gray-900 dark:text-white text-base">
        <span className="flex justify-center items-center bg-orange-50 dark:bg-orange-500/15 rounded-lg w-7 h-7 text-orange-500">
          <Icon size={15} />
        </span>
        {title}
      </h3>
      <div className="gap-5 grid grid-cols-1 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

/* ─── مكوِّن حقل إدخال نصي ─── */
function InputField({ label, required, wider, name, ...props }) {
  return (
    <div className={wider ? 'md:col-span-2' : ''}>
      <label htmlFor={name} className="block mb-1.5 font-medium text-gray-700 dark:text-gray-300 text-sm">
        {label} {required && <span className="text-orange-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        {...props}
        className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5 border border-gray-200 focus:border-orange-500 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full text-gray-900 dark:text-white text-sm transition-colors placeholder-gray-400 dark:placeholder-gray-600"
      />
    </div>
  );
}

/* ─── مكوِّن قائمة منسدلة ─── */
function SelectField({ label, options, name, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="block mb-1.5 font-medium text-gray-700 dark:text-gray-300 text-sm">{label}</label>
      <select
        id={name}
        name={name}
        {...props}
        className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5 border border-gray-200 focus:border-orange-500 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full text-gray-900 dark:text-white text-sm transition-colors appearance-none cursor-pointer"
      >
        {options.map(opt =>
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
    </div>
  );
}

/* ═══════════════════════════════════════════
   صفحة إضافة قضية جديدة
═══════════════════════════════════════════ */
export default function AddCase() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [form, setForm] = useState({
    title:           '',
    clientName:      '',
    opponentName:    '',
    type:            CASE_TYPES[0],
    status:          CASE_STATUSES[0].value,
    court:           '',
    nextSessionDate: '',
    description:     '',
  });

  const handle = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.clientName.trim()) {
      setError('يرجى تعبئة عنوان القضية واسم الموكل على الأقل.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'cases'), {
        ...form,
        searchKeywords: buildKeywords(form.title, form.clientName, form.opponentName),
        createdAt: serverTimestamp(),
        createdBy: user?.uid ?? null,
      });
      navigate('/cases');
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto px-4 sm:px-6 md:px-8 max-w-4xl">

      {/* ─── رأس الصفحة ─── */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/cases"
          className="flex justify-center items-center border border-gray-200 hover:border-orange-300 dark:border-gray-700 dark:hover:border-orange-600 rounded-xl w-9 h-9 text-gray-400 hover:text-orange-500 transition-all"
        >
          <ArrowRight size={18} />
        </Link>
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white text-2xl">إضافة قضية جديدة</h1>
          <p className="mt-0.5 text-gray-500 dark:text-gray-400 text-sm">أدخل بيانات القضية لتسجيلها في النظام</p>
        </div>
      </div>

      {/* ─── رسالة خطأ ─── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 mb-6 px-4 py-3 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ─── النموذج ─── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/80 rounded-2xl overflow-hidden">
          <div className="space-y-8 p-6 md:p-8">

            {/* بيانات أساسية */}
            <FormSection icon={Scale} title="البيانات الأساسية">
              <InputField
                label="عنوان / رقم القضية" required wider
                type="text" name="title" value={form.title} onChange={handle}
                placeholder="مثال: قضية عمالية رقم 154 / 2024"
              />
              <InputField
                label="اسم الموكل" required
                type="text" name="clientName" value={form.clientName} onChange={handle}
              />
              <InputField
                label="اسم الخصم"
                type="text" name="opponentName" value={form.opponentName} onChange={handle}
              />
              <SelectField
                label="نوع القضية"
                name="type" value={form.type} onChange={handle}
                options={CASE_TYPES}
              />
              <SelectField
                label="حالة القضية"
                name="status" value={form.status} onChange={handle}
                options={CASE_STATUSES}
              />
            </FormSection>

            <hr className="border-gray-100 dark:border-gray-700/60" />

            {/* تفاصيل المحكمة */}
            <FormSection icon={MapPin} title="المحكمة والجلسة">
              <InputField
                label="المحكمة المختصة"
                type="text" name="court" value={form.court} onChange={handle}
                placeholder="مثال: محكمة العمل الابتدائية بالرياض"
              />
              <div>
                <label htmlFor="nextSessionDate" className="block flex items-center gap-1.5 mb-1.5 font-medium text-gray-700 dark:text-gray-300 text-sm">
                  <Calendar size={13} className="text-gray-400" /> تاريخ الجلسة القادمة
                </label>
                <input
                  id="nextSessionDate"
                  type="date"
                  name="nextSessionDate"
                  value={form.nextSessionDate}
                  onChange={handle}
                  className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5 border border-gray-200 focus:border-orange-500 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full text-gray-900 dark:text-white text-sm transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </FormSection>

            <hr className="border-gray-100 dark:border-gray-700/60" />

            {/* ملاحظات */}
            <div>
              <h3 className="flex items-center gap-2 mb-5 font-semibold text-gray-900 dark:text-white text-base">
                <span className="flex justify-center items-center bg-orange-50 dark:bg-orange-500/15 rounded-lg w-7 h-7 text-orange-500">
                  <FileText size={15} />
                </span>
                ملاحظات إضافية
              </h3>
              <textarea
                name="description"
                value={form.description}
                onChange={handle}
                rows={4}
                placeholder="أي تفاصيل أو ملاحظات أولية حول القضية..."
                className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border border-gray-200 focus:border-orange-500 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full text-gray-900 dark:text-white text-sm transition-colors resize-y placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>

          </div>

          {/* ─── أزرار الحفظ ─── */}
          <div className="flex justify-end items-center gap-3 bg-gray-50/50 dark:bg-gray-900/30 px-6 md:px-8 py-4 border-gray-100 dark:border-gray-700/60 border-t">
            <Link
              to="/cases"
              className="hover:bg-gray-100 dark:hover:bg-gray-700 px-5 py-2 rounded-xl font-medium text-gray-600 dark:text-gray-300 text-sm transition-colors"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-60 shadow-orange-600/20 shadow-sm px-6 py-2 rounded-xl font-medium text-white text-sm transition-all"
            >
              {loading
                ? <span className="border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin" />
                : <Save size={16} />
              }
              حفظ القضية
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
