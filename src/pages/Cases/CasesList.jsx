import { useState, useEffect, useMemo } from 'react';
import { db } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, Scale, MapPin, Calendar,
  Clock, ChevronDown, Archive,
  FolderOpen, CheckCircle2, Loader
} from 'lucide-react';
import { CASE_TYPES, CASE_STATUSES, STATUS_STYLES } from './casesConfig';

/* ─── شارة حالة القضية ─── */
function StatusBadge({ value }) {
  const s   = CASE_STATUSES.find(x => x.value === value) ?? { label: value };
  const cls = STATUS_STYLES[value] ?? STATUS_STYLES.archived;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${cls}`}>
      {s.label}
    </span>
  );
}

/* ─── قائمة منسدلة مُنسَّقة ─── */
function FilterSelect({ icon: Icon, value, onChange, children }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 flex items-center ps-3 pointer-events-none start-0">
        <Icon size={15} className="text-gray-400" />
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-gray-50 dark:bg-gray-900/50 py-2.5 ps-9 pe-8 border border-gray-200 focus:border-orange-500 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-700 dark:text-gray-300 text-sm transition-colors appearance-none cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={13} className="absolute inset-y-0 my-auto me-3 text-gray-400 pointer-events-none end-0" />
    </div>
  );
}

/* ─── حالة "لا توجد نتائج" ─── */
function EmptyState({ isArchive, hasSearch }) {
  const Icon = isArchive ? Archive : hasSearch ? Search : Scale;
  const msg  = hasSearch
    ? 'لم نجد قضايا مطابقة لبحثك.'
    : isArchive
    ? 'لا توجد قضايا مؤرشفة حتى الآن.'
    : 'لا توجد قضايا نشطة. ابدأ بإضافة قضيتك الأولى!';

  return (
    <tr>
      <td colSpan={5} className="py-16 text-center">
        <div className="flex justify-center items-center bg-gray-50 dark:bg-gray-700/50 mx-auto mb-3 rounded-2xl w-14 h-14">
          <Icon size={26} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{msg}</p>
        {!hasSearch && !isArchive && (
          <Link
            to="/cases/new"
            className="inline-flex items-center gap-1.5 mt-3 font-medium text-orange-600 dark:text-orange-400 text-sm hover:underline"
          >
            <Plus size={15} /> إضافة أول قضية
          </Link>
        )}
      </td>
    </tr>
  );
}

/* ─── خلية سريعة لتغيير الحالة ─── */
function StatusCell({ caseId, current }) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

  const change = async (val) => {
    if (val === current) { setOpen(false); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'cases', caseId), { status: val });
    } catch (e) { console.error(e); }
    finally { setLoading(false); setOpen(false); }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="group flex items-center gap-1.5"
        disabled={loading}
      >
        <StatusBadge value={current} />
        {loading
          ? <Loader size={12} className="text-gray-400 animate-spin" />
          : <ChevronDown size={12} className="text-gray-400 dark:group-hover:text-gray-300 group-hover:text-gray-600" />
        }
      </button>

      {open && (
        <>
          <div className="z-10 fixed inset-0" onClick={() => setOpen(false)} />
          <div className="top-full z-20 absolute bg-white dark:bg-gray-800 shadow-lg mt-1 border border-gray-200 dark:border-gray-700 rounded-xl min-w-[160px] overflow-hidden start-0">
            {CASE_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => change(s.value)}
                className={`w-full text-start px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors ${s.value === current ? 'font-semibold text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`}
              >
                {s.value === current && <CheckCircle2 size={14} className="text-orange-500 shrink-0" />}
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   صفحة لوحة القضايا (الجدول الرئيسي)
══════════════════════════════════════════ */
export default function CasesList() {
  const navigate = useNavigate();
  const [cases,   setCases]   = useState([]);
  const [loading, setLoading] = useState(true);

  // فلاتر البحث
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // النشطة افتراضياً

  /* ─── جلب القضايا لحظياً ─── */
  useEffect(() => {
    const q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setCases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ─── الفلترة الذكية في المتصفح ─── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return cases.filter(c => {
      if (statusFilter && statusFilter !== 'all' && c.status !== statusFilter)        return false;
      if (typeFilter   && typeFilter   !== 'all' && c.type !== typeFilter)            return false;
      if (q) {
        const inTitle    = c.title?.toLowerCase().includes(q);
        const inClient   = c.clientName?.toLowerCase().includes(q);
        const inOpponent = c.opponentName?.toLowerCase().includes(q);
        const inCourt    = c.court?.toLowerCase().includes(q);
        if (!inTitle && !inClient && !inOpponent && !inCourt) return false;
      }
      return true;
    });
  }, [cases, search, typeFilter, statusFilter]);

  /* ─── إحصاءات عداد الحالات ─── */
  const counts = useMemo(() => ({
    active:   cases.filter(c => c.status === 'active').length,
    archived: cases.filter(c => c.status === 'archived').length,
    total:    cases.length,
  }), [cases]);

  const isArchiveView = statusFilter === 'archived';

  return (
    <div className="mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">

      {/* ─── رأس الصفحة ─── */}
      <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="mb-1 font-bold text-gray-900 dark:text-white text-2xl sm:text-3xl">
            القضايا
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {counts.active} قضية نشطة &nbsp;·&nbsp; {counts.archived} مؤرشفة &nbsp;·&nbsp; {counts.total} إجمالي
          </p>
        </div>
        <Link
          to="/cases/new"
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 shadow-orange-600/25 shadow-sm px-5 py-2.5 rounded-xl font-medium text-white text-sm active:scale-95 transition-all"
        >
          <Plus size={18} /> إضافة قضية
        </Link>
      </div>

      {/* ─── شريط الفلاتر ─── */}
      <div className="flex md:flex-row flex-col items-center gap-3 bg-white dark:bg-gray-800 shadow-sm mb-6 p-4 border border-gray-100 dark:border-gray-700/80 rounded-2xl">

        {/* بحث */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 flex items-center ps-4 pointer-events-none start-0">
            <Search size={17} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث برقم القضية، الموكل، الخصم، أو المحكمة..."
            className="bg-gray-50 dark:bg-gray-900/50 py-2.5 ps-11 pe-4 border border-gray-200 focus:border-orange-500 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full text-gray-900 dark:text-white text-sm transition-colors placeholder-gray-400 dark:placeholder-gray-600"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {/* فلتر النوع */}
          <FilterSelect icon={Filter} value={typeFilter} onChange={setTypeFilter}>
            <option value="">كل الأنواع</option>
            {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </FilterSelect>

          {/* فلتر الحالة */}
          <FilterSelect icon={FolderOpen} value={statusFilter} onChange={setStatusFilter}>
            <option value="active">نشطة</option>
            <option value="review">قيد المراجعة</option>
            <option value="verdict">محجوزة للحكم</option>
            <option value="archived">مؤرشفة 🗄️</option>
            <option value="all">كل الحالات</option>
          </FilterSelect>
        </div>
      </div>

      {/* ─── الجدول ─── */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start">

            {/* رأس الجدول */}
            <thead>
              <tr className="bg-gray-50/70 dark:bg-gray-900/40 border-gray-100 dark:border-gray-700/60 border-b">
                {['تفاصيل القضية','الأطراف','المحكمة والجلسة','الحالة',''].map((h, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ${i === 4 ? 'text-end' : 'text-start'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <span className="inline-block border-2 border-orange-200 border-t-orange-500 rounded-full w-8 h-8 animate-spin" />
                    <p className="mt-3 text-gray-400 dark:text-gray-500 text-sm">جاري تحميل القضايا...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <EmptyState isArchive={isArchiveView} hasSearch={!!search} />
              ) : (
                filtered.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/cases/${item.id}`)}
                    className="group hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors cursor-pointer"
                  >
                    {/* اسم وتصنيف القضية */}
                    <td className="px-5 py-4 max-w-[220px]">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate" title={item.title}>
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-gray-500 dark:text-gray-400 text-xs">{item.type}</p>
                    </td>

                    {/* الأطراف */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5 text-sm">
                        <span className="flex items-center gap-1.5">
                          <span className="bg-emerald-500 rounded-full w-1.5 h-1.5 shrink-0" />
                          <span className="max-w-[130px] text-gray-800 dark:text-gray-200 truncate" title={item.clientName}>
                            {item.clientName}
                          </span>
                        </span>
                        {item.opponentName && (
                          <span className="flex items-center gap-1.5">
                            <span className="bg-red-400 rounded-full w-1.5 h-1.5 shrink-0" />
                            <span className="max-w-[130px] text-gray-500 dark:text-gray-400 truncate" title={item.opponentName}>
                              {item.opponentName}
                            </span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* المحكمة والجلسة */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5 text-xs">
                        {item.court ? (
                          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <MapPin size={12} className="text-gray-400 shrink-0" />
                            <span className="max-w-[150px] truncate" title={item.court}>{item.court}</span>
                          </span>
                        ) : null}
                        {item.nextSessionDate ? (
                          <span className="flex items-center gap-1.5 font-medium text-orange-600 dark:text-orange-400">
                            <Calendar size={12} className="shrink-0" />
                            {new Date(item.nextSessionDate).toLocaleDateString('ar-SA', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={12} className="shrink-0" />
                            لم يُحدد
                          </span>
                        )}
                      </div>
                    </td>

                    {/* الحالة — stopPropagation حتى لا يفتح صفحة التفاصيل عند تغيير الحالة */}
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <StatusCell caseId={item.id} current={item.status} />
                    </td>

                    {/* سهم الانتقال */}
                    <td className="px-5 py-4 text-end">
                      <span className="inline-flex justify-center items-center text-gray-300 group-hover:text-orange-400 dark:group-hover:text-orange-500 transition-colors">
                        <FolderOpen size={16} />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* عداد النتائج */}
      {!loading && filtered.length > 0 && (
        <p className="mt-3 text-gray-400 dark:text-gray-500 text-xs text-center">
          {filtered.length} {filtered.length === 1 ? 'نتيجة' : 'نتيجة'}
        </p>
      )}
    </div>
  );
}
