import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Save, AlertCircle, CheckCircle2,
  Scale, MapPin, FileText, Pencil, X
} from 'lucide-react';
import { CASE_TYPES, CASE_STATUSES, STATUS_STYLES } from './casesConfig';

/* ─── شارة حالة ─── */
function StatusBadge({ value }) {
  const s   = CASE_STATUSES.find(x => x.value === value) ?? { label: value };
  const cls = STATUS_STYLES[value] ?? STATUS_STYLES.archived;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {s.label}
    </span>
  );
}

/* ─── حقل عرض/تحرير نصي ─── */
function EditableField({ label, name, value, onChange, editing, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {editing ? (
        <input
          id={name}
          type={type}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
        />
      ) : (
        <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100 min-h-[34px] flex items-center">
          {value || <span className="text-gray-400 dark:text-gray-500 text-sm italic font-normal">غير مُحدّد</span>}
        </p>
      )}
    </div>
  );
}

/* ─── حقل قائمة منسدلة ─── */
function EditableSelect({ label, name, value, onChange, editing, options }) {
  const current =
    options.find(o => (typeof o === 'string' ? o === value : o.value === value));
  const display = typeof current === 'string' ? current : current?.label ?? value;

  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {editing ? (
        <select
          id={name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors appearance-none cursor-pointer"
        >
          {options.map(opt =>
            typeof opt === 'string'
              ? <option key={opt} value={opt}>{opt}</option>
              : <option key={opt.value} value={opt.value}>{opt.label}</option>
          )}
        </select>
      ) : (
        <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100 min-h-[34px] flex items-center">
          {display || <span className="text-gray-400 dark:text-gray-500 text-sm italic font-normal">غير مُحدّد</span>}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   صفحة تفاصيل القضية + التعديل
══════════════════════════════════════════ */
export default function CaseDetail() {
  const { caseId } = useParams();
  const navigate   = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [form,     setForm]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null); // { type: 'success'|'error', msg }

  /* ─── جلب بيانات القضية ─── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'cases', caseId));
        if (!snap.exists()) { navigate('/cases'); return; }
        const data = { id: snap.id, ...snap.data() };
        if (!cancelled) { setCaseData(data); setForm(data); }
      } catch (e) {
        console.error(e);
        if (!cancelled) navigate('/cases');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [caseId, navigate]);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  /* ─── حفظ التعديلات ─── */
  const handleSave = async () => {
    if (!form.title?.trim() || !form.clientName?.trim()) {
      showToast('error', 'يرجى تعبئة عنوان القضية واسم الموكل.');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'cases', caseId), {
        title:           form.title,
        clientName:      form.clientName,
        opponentName:    form.opponentName,
        type:            form.type,
        status:          form.status,
        court:           form.court,
        nextSessionDate: form.nextSessionDate,
        description:     form.description,
        updatedAt:       serverTimestamp(),
      });
      setCaseData(form);
      setEditing(false);
      showToast('success', 'تم حفظ التعديلات بنجاح!');
    } catch (e) {
      console.error(e);
      showToast('error', 'حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  /* ─── إلغاء التعديل ─── */
  const handleCancel = () => { setForm(caseData); setEditing(false); };

  /* ─── إشعار مؤقت ─── */
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <span className="w-10 h-10 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm">جاري تحميل بيانات القضية...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 md:px-8 max-w-4xl">

      {/* ─── إشعار عائم (Toast) ─── */}
      {toast && (
        <div className={`fixed top-6 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium transition-all max-w-sm w-full mx-4
          ${toast.type === 'success'
            ? 'bg-emerald-600 text-white shadow-emerald-600/25'
            : 'bg-red-600 text-white shadow-red-600/25'}`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={18} className="shrink-0" />
            : <AlertCircle  size={18} className="shrink-0" />
          }
          {toast.msg}
        </div>
      )}

      {/* ─── رأس الصفحة ─── */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 p-6 mb-8 bg-gradient-to-l from-orange-50/50 via-white to-white dark:from-orange-500/5 dark:via-gray-900/50 dark:to-gray-900/50 border border-orange-100/50 dark:border-orange-500/10 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/cases"
            className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-orange-500 hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-sm transition-all shrink-0"
          >
            <ArrowRight size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white truncate max-w-[400px] tracking-tight">
              {caseData?.title}
            </h1>
            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              <StatusBadge value={caseData?.status} />
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{caseData?.type}</span>
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X size={15} /> إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2 rounded-xl shadow-sm shadow-orange-600/20 transition-all disabled:opacity-60"
              >
                {saving
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Save size={15} />
                }
                حفظ التعديلات
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-600 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 text-sm font-medium px-4 py-2 rounded-xl transition-all"
            >
              <Pencil size={15} /> تعديل
            </button>
          )}
        </div>
      </div>

      {/* ─── بطاقات التفاصيل ─── */}
      <div className="space-y-5">

        {/* البيانات الأساسية */}
        <div className="bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/80 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:shadow-none dark:hover:border-gray-600 transition-all duration-300 overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50">
            <Scale size={18} className="text-orange-500" />
            <h2 className="font-bold text-gray-800 dark:text-white text-[15px]">البيانات الأساسية</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <EditableField
                label="عنوان / رقم القضية"
                name="title"
                value={form?.title}
                onChange={handleChange}
                editing={editing}
                placeholder="مثال: قضية عمالية رقم 154 / 2024"
              />
            </div>
            <EditableField
              label="اسم الموكل"
              name="clientName"
              value={form?.clientName}
              onChange={handleChange}
              editing={editing}
            />
            <EditableField
              label="اسم الخصم"
              name="opponentName"
              value={form?.opponentName}
              onChange={handleChange}
              editing={editing}
            />
            <EditableSelect
              label="نوع القضية"
              name="type"
              value={form?.type}
              onChange={handleChange}
              editing={editing}
              options={CASE_TYPES}
            />
            <EditableSelect
              label="حالة القضية"
              name="status"
              value={form?.status}
              onChange={handleChange}
              editing={editing}
              options={CASE_STATUSES}
            />
          </div>
        </div>

        {/* المحكمة والجلسات */}
        <div className="bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/80 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:shadow-none dark:hover:border-gray-600 transition-all duration-300 overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50">
            <MapPin size={18} className="text-orange-500" />
            <h2 className="font-bold text-gray-800 dark:text-white text-[15px]">المحكمة والجلسات</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <EditableField
              label="المحكمة المختصة"
              name="court"
              value={form?.court}
              onChange={handleChange}
              editing={editing}
              placeholder="مثال: محكمة العمل الابتدائية"
            />
            <EditableField
              label="تاريخ الجلسة القادمة"
              name="nextSessionDate"
              value={form?.nextSessionDate}
              onChange={handleChange}
              editing={editing}
              type="date"
            />
          </div>
        </div>

        {/* الملاحظات */}
        <div className="bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/80 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:shadow-none dark:hover:border-gray-600 transition-all duration-300 overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50">
            <FileText size={18} className="text-orange-500" />
            <h2 className="font-bold text-gray-800 dark:text-white text-[15px]">ملاحظات إضافية</h2>
          </div>
          <div className="p-6">
            {editing ? (
              <textarea
                id="description"
                name="description"
                value={form?.description ?? ''}
                onChange={handleChange}
                rows={5}
                placeholder="أي تفاصيل أو ملاحظات حول القضية..."
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-y"
              />
            ) : (
              <p className="text-[15px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                {caseData?.description || <span className="text-gray-400 dark:text-gray-500 text-sm italic">لا توجد ملاحظات.</span>}
              </p>
            )}
          </div>
        </div>

        {/* بيانات الإنشاء (للمرجع فقط) */}
        {caseData?.createdAt && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
            تمت الإضافة في{' '}
            {new Date(caseData.createdAt.seconds * 1000).toLocaleDateString('ar-SA', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        )}
      </div>
    </div>
  );
}
