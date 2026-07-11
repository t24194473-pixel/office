import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, doc, runTransaction } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Scale, MapPin, Calendar, Clock,
  ChevronDown, Archive, FolderOpen, Filter, X,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import { CASE_TYPES, CASE_STATUSES, STATUS_STYLES } from './casesConfig';
import PrintableCasesTable from './PrintableCasesTable';

/* ══════════════════════════════════════════
   ثوابت الألوان
══════════════════════════════════════════ */
const STATUS_DOT = {
  active: 'bg-emerald-500',
  review: 'bg-blue-500',
  verdict: 'bg-amber-500',
  archived: 'bg-gray-400',
};

/* ─── شارة حالة صغيرة ─── */
function StatusBadge({ value, size = 'sm' }) {
  const s = CASE_STATUSES.find(x => x.value === value) ?? { label: value };
  const cls = STATUS_STYLES[value] ?? STATUS_STYLES.archived;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium border whitespace-nowrap
      ${size === 'xs' ? 'text-[10px]' : 'text-[11px]'} ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[value] ?? 'bg-gray-400'}`} />
      {s.label}
    </span>
  );
}

/* ─── تغيير الحالة — قائمة أنيقة كـ Chips ─── */
function StatusChanger({ caseId, current, onArchiveClick }) {
  return (
    <div onClick={e => e.stopPropagation()} className="flex flex-wrap gap-1.5">
      {current !== 'archived' ? (
        <button
          onClick={(e) => { e.stopPropagation(); onArchiveClick(caseId); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 shadow-sm"
        >
          <Archive size={12} className="shrink-0" />
          أرشفة القضية
        </button>
      ) : (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <CheckCircle2 size={12} className="shrink-0" />
          مؤرشفة
        </span>
      )}
    </div>
  );
}

/* ─── بطاقة قضية للجوال ─── */
function CaseCard({ item, onNavigate, onArchiveClick }) {
  return (
    <div
      onClick={() => onNavigate(item.id)}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-sm p-4 cursor-pointer
        hover:shadow-md hover:border-orange-200 dark:hover:border-orange-700/50 transition-all active:scale-[0.99]"
    >
      {/* رأس البطاقة */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-orange-50 border border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded text-xs font-bold tracking-wide">
              {item.title}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.type}</p>
        </div>
        <StatusBadge value={item.status} size="xs" />
      </div>

      {/* الأطراف */}
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate font-medium">{item.clientName}</span>
        </div>
        {item.opponentName && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span className="truncate">{item.opponentName}</span>
          </div>
        )}
      </div>

      {/* المحكمة والجلسة */}
      <div className="flex flex-wrap gap-3 mb-3">
        {item.court && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <MapPin size={11} className="text-gray-400 shrink-0" />
            <span className="truncate max-w-[140px]">{item.court}</span>
          </div>
        )}
        {item.nextSessionDate ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
            <Calendar size={11} className="shrink-0" />
            {new Date(item.nextSessionDate).toLocaleDateString('ar-SA', {
              month: 'short', day: 'numeric', year: 'numeric'
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={11} className="shrink-0" />
            <span>لم تحدد جلسة</span>
          </div>
        )}
      </div>

      {/* زر تغيير الحالة */}
      <div className="border-t border-gray-50 dark:border-gray-700/80 pt-3">
        <StatusChanger caseId={item.id} current={item.status} onArchiveClick={onArchiveClick} />
      </div>
    </div>
  );
}

/* ─── حالة فراغ ─── */
function EmptyState({ isArchive, hasSearch }) {
  const Icon = isArchive ? Archive : hasSearch ? Search : Scale;
  const msg = hasSearch
    ? 'لم نجد قضايا مطابقة لبحثك.'
    : isArchive
      ? 'لا توجد قضايا مؤرشفة حتى الآن.'
      : 'لا توجد قضايا نشطة. ابدأ بإضافة قضيتك الأولى!';

  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Icon size={26} className="text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{msg}</p>
      {!hasSearch && !isArchive && (
        <Link to="/cases/new" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline">
          <Plus size={15} /> إضافة أول قضية
        </Link>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   المكوّن الرئيسي
══════════════════════════════════════════ */
export default function CasesList() {
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [filtersOpen, setFiltersOpen] = useState(false); // للجوال

  const [caseToArchive, setCaseToArchive] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchiveConfirm = async () => {
    if (!caseToArchive) return;
    setIsArchiving(true);
    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'cases', '--metadata-archive--');
        const counterDoc = await transaction.get(counterRef);

        let newSeq = 1;
        if (counterDoc.exists()) {
          newSeq = (counterDoc.data().seq || 0) + 1;
        }

        transaction.set(counterRef, { seq: newSeq }, { merge: true });

        const caseRef = doc(db, 'cases', caseToArchive);
        transaction.update(caseRef, {
          title: '',
          status: 'archived',
          archiveNumber: newSeq,
          archivedAt: new Date().toISOString()
        });
      });
      setCaseToArchive(null);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الأرشفة: " + err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  /* ─── Firestore real-time ─── */
  useEffect(() => {
    const q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      snap => {
        setCases(
          snap.docs
            .filter(d => d.id !== '--metadata-archive--')
            .map(d => ({ id: d.id, ...d.data() }))
        );
        setLoading(false);
      },
      err => { console.error(err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  /* ─── فلترة ذكية ─── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return cases.filter(c => {
      if (statusFilter && statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter && typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (q) {
        const hit = [c.title, c.clientName, c.opponentName, c.court]
          .some(v => v?.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [cases, search, typeFilter, statusFilter]);

  /* ─── التمرير اللانهائي (Pagination) ─── */
  const [displayCount, setDisplayCount] = useState(7);
  const observerRef = useRef(null);

  // إعادة تعيين العدد عند تغيير الفلاتر
  useEffect(() => {
    setDisplayCount(7);
  }, [search, typeFilter, statusFilter]);

  const displayedCases = useMemo(() => {
    return filtered.slice(0, displayCount);
  }, [filtered, displayCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount(prev => Math.min(prev + 7, filtered.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [filtered.length]);

  const counts = useMemo(() => ({
    active: cases.filter(c => c.status === 'active').length,
    archived: cases.filter(c => c.status === 'archived').length,
    total: cases.length,
  }), [cases]);

  const isArchiveView = statusFilter === 'archived';
  const hasActiveFilter = typeFilter !== '' || statusFilter !== 'active';

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <>
      <div className="mx-auto px-4 sm:px-6 md:px-8 max-w-7xl print:hidden">

        {/* ─── رأس الصفحة ─── */}
        <div className="flex justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-2xl sm:text-3xl">القضايا</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {counts.active} نشطة · {counts.archived} مؤرشفة · {counts.total} إجمالي
            </p>
          </div>
          <Link
            to="/cases/new"
            className="flex items-center gap-1.5 sm:gap-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-sm font-medium
            px-3 sm:px-5 py-2.5 rounded-xl shadow-sm shadow-orange-600/25 transition-all shrink-0"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">إضافة قضية</span>
          </Link>
        </div>

        {/* ─── شريط بحث + فلاتر ─── */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 rounded-2xl shadow-sm p-3 sm:p-4 mb-5">
          <div className="flex gap-2">
            {/* حقل البحث */}
            <div className="relative flex-1">
              <Search size={16} className="absolute inset-y-0 my-auto start-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث بالقضية، الموكل، الخصم..."
                className="w-full ps-10 pe-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700
                rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600
                focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute inset-y-0 my-auto end-3 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              )}
            </div>

            {/* زر الفلاتر */}
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all shrink-0
              ${filtersOpen || hasActiveFilter
                  ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/40'
                  : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}
            >
              <Filter size={15} />
              <span className="hidden sm:inline">فلترة</span>
              {hasActiveFilter && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              )}
            </button>
          </div>

          {/* لوحة الفلاتر — تنزلق عند الفتح */}
          {filtersOpen && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* فلتر الحالة — Chip Tabs */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">الحالة</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'active', label: 'نشطة' },
                    { value: 'archived', label: 'مؤرشفة' },
                    { value: 'all', label: 'الكل' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setStatusFilter(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${statusFilter === opt.value
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-600/20'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-orange-400'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* فلتر النوع — Chip Tabs */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">نوع القضية</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setTypeFilter('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${typeFilter === ''
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-600/20'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-orange-400'
                      }`}
                  >
                    الكل
                  </button>
                  {CASE_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${typeFilter === t
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-600/20'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-orange-400'
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* زر مسح الفلاتر */}
              {hasActiveFilter && (
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    onClick={() => { setTypeFilter(''); setStatusFilter('active'); }}
                    className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <X size={12} /> مسح الفلاتر
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
          جدول القضايا — للشاشات الكبيرة
      ══════════════════════════════════════════ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="w-9 h-9 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400 dark:text-gray-500">جاري تحميل القضايا...</p>
          </div>
        ) : filtered.length === 0 ? (
          /* فراغ */
          <EmptyState isArchive={isArchiveView} hasSearch={!!search} />
        ) : (
          <>
            {/* ─── جدول (md فما فوق) ─── */}
            <div className="hidden md:block bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-start">
                  <thead>
                    <tr className="bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700/60">
                      {['تفاصيل القضية', 'الأطراف', 'المحكمة والجلسة', 'الحالة', ''].map((h, i) => (
                        <th key={i}
                          className={`px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide
                          ${i === 4 ? 'text-end w-10' : 'text-start'}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {displayedCases.map(item => (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/cases/${item.id}`)}
                        className="group hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors cursor-pointer"
                      >
                        {/* اسم وتصنيف */}
                        <td className="px-5 py-4 max-w-[220px]">
                          <div className="flex flex-col items-start gap-1">
                            <span className="bg-orange-50 border border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded text-xs font-bold tracking-wide shadow-sm" title={item.title}>
                              {item.title}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{item.type}</span>
                          </div>
                        </td>

                        {/* الأطراف */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5 text-sm">
                            <span className="flex items-center gap-1.5">
                              <span className="bg-emerald-500 rounded-full w-1.5 h-1.5 shrink-0" />
                              <span className="text-gray-800 dark:text-gray-200 truncate max-w-[140px]" title={item.clientName}>{item.clientName}</span>
                            </span>
                            {item.opponentName && (
                              <span className="flex items-center gap-1.5">
                                <span className="bg-red-400 rounded-full w-1.5 h-1.5 shrink-0" />
                                <span className="text-gray-500 dark:text-gray-400 truncate max-w-[140px]" title={item.opponentName}>{item.opponentName}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* المحكمة */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5 text-xs">
                            {item.court && (
                              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                <MapPin size={12} className="text-gray-400 shrink-0" />
                                <span className="truncate max-w-[150px]" title={item.court}>{item.court}</span>
                              </span>
                            )}
                            {item.nextSessionDate ? (
                              <span className="flex items-center gap-1.5 font-semibold text-orange-600 dark:text-orange-400">
                                <Calendar size={12} className="shrink-0" />
                                {new Date(item.nextSessionDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-gray-400">
                                <Clock size={12} className="shrink-0" /> لم يُحدد
                              </span>
                            )}
                          </div>
                        </td>

                        {/* الحالة — Chips كاملة */}
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <StatusChanger caseId={item.id} current={item.status} onArchiveClick={setCaseToArchive} />
                        </td>

                        {/* سهم */}
                        <td className="px-4 py-4 text-end">
                          <FolderOpen size={16} className="text-gray-300 group-hover:text-orange-400 dark:group-hover:text-orange-500 transition-colors ms-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── بطاقات (أقل من md) ─── */}
            <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayedCases.map(item => (
                <CaseCard key={item.id} item={item} onNavigate={id => navigate(`/cases/${id}`)} onArchiveClick={setCaseToArchive} />
              ))}
            </div>
          </>
        )}

        {/* مؤشر التمرير وعداد القضايا */}
        {!loading && filtered.length > 0 && (
          <div className="mt-6 mb-2 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              عرض {displayedCases.length} من أصل {filtered.length} قضية
            </p>
            <div ref={observerRef} className="h-4" />
          </div>
        )}

        {/* ─── مودال تأكيد الأرشفة ─── */}
        {caseToArchive && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="text-orange-600 dark:text-orange-500" size={24} />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">تأكيد الأرشفة</h3>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                هل أنت متأكد من رغبتك في أرشفة هذه القضية؟ سيتم تخصيص <strong>رقم أرشفة تسلسلي فريد</strong> لها ونقلها إلى سجل القضايا المؤرشفة.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setCaseToArchive(null)}
                  disabled={isArchiving}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleArchiveConfirm}
                  disabled={isArchiving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-sm font-medium text-white shadow-sm shadow-orange-600/20 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {isArchiving ? (
                    <span className="w-5 h-5 border-2 border-orange-300 border-t-white rounded-full animate-spin" />
                  ) : (
                    'أرشفة القضية'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── جدول الطباعة (يظهر فقط عند الطباعة) ─── */}
      <PrintableCasesTable filtered={filtered} hasActiveFilter={hasActiveFilter} />
    </>
  );
}
