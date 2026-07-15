import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, doc, runTransaction, deleteDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Scale, MapPin, Calendar, Clock, Archive, FolderOpen, Filter, X,
  CheckCircle2, AlertTriangle, Printer, Info, FileSpreadsheet, FileOutput, Trash2
} from 'lucide-react';
import { CASE_TYPES, CASE_STATUSES, STATUS_STYLES } from './casesConfig';
import PrintableCasesTable from './PrintableCasesTable';
import ImportCasesModal from './ImportCasesModal';
import { parseExcelFile, exportCasesToExcel } from '../../utils/excelImport';

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
          className="flex items-center gap-1.5 bg-white dark:bg-gray-800 shadow-sm px-3 py-1.5 border border-gray-200 hover:border-orange-400 dark:border-gray-600 dark:hover:border-orange-500 rounded-full font-medium text-[11px] text-gray-600 hover:text-orange-600 dark:text-gray-300 transition-all"
        >
          <Archive size={12} className="shrink-0" />
          أرشفة القضية
        </button>
      ) : (
        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-full font-medium text-[11px] text-gray-500">
          <CheckCircle2 size={12} className="shrink-0" />
          مؤرشفة
        </span>
      )}
    </div>
  );
}

/* ─── بطاقة قضية للجوال ─── */
function CaseCard({ item, onNavigate, onArchiveClick, onDeleteClick }) {
  return (
    <div
      onClick={() => onNavigate(item.id)}
      className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md p-4 border border-gray-100 hover:border-orange-200 dark:border-gray-700/80 dark:hover:border-orange-700/50 rounded-2xl active:scale-[0.99] transition-all cursor-pointer"
    >
      {/* رأس البطاقة */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 border border-orange-200 dark:border-orange-500/30 rounded font-bold text-orange-700 dark:text-orange-400 text-xs tracking-wide">
              {item.title}
            </span>
          </div>
          <p className="font-medium text-gray-500 dark:text-gray-400 text-xs">{item.type}</p>
        </div>
        <StatusBadge value={item.status} size="xs" />
      </div>

      {/* الأطراف */}
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-xs">
          <span className="bg-emerald-500 mt-1.5 rounded-full w-1.5 h-1.5 shrink-0" />
          <span className="font-medium break-words leading-snug">{item.clientName}</span>
        </div>
        {item.opponentName && (
          <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400 text-xs">
            <span className="bg-red-400 mt-1.5 rounded-full w-1.5 h-1.5 shrink-0" />
            <span className="break-words leading-snug">{item.opponentName}</span>
          </div>
        )}
      </div>

      {/* موضوع الدعوى */}
      {item.caseSubject && (
        <div className="bg-gray-50 dark:bg-gray-700/30 mb-3 px-3 py-1.5 border border-gray-100 dark:border-gray-700/50 rounded-lg text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
          <span className="block mb-0.5 font-semibold text-[10px] text-gray-400 dark:text-gray-500">موضوع الدعوى:</span>
          {item.caseSubject}
        </div>
      )}

      {/* المحكمة والجلسة */}
      <div className="flex flex-wrap gap-3 mb-3">
        {item.court && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
            <MapPin size={11} className="text-gray-400 shrink-0" />
            <span className="max-w-[140px] truncate">{item.court}</span>
          </div>
        )}
        {item.nextSessionDate ? (
          <div className="flex items-center gap-1.5 font-semibold text-orange-600 dark:text-orange-400 text-xs">
            <Calendar size={11} className="shrink-0" />
            {new Date(item.nextSessionDate).toLocaleDateString('ar-SA', {
              month: 'short', day: 'numeric', year: 'numeric'
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Clock size={11} className="shrink-0" />
            <span>لم تحدد جلسة</span>
          </div>
        )}
      </div>

      {/* الأزرار السفلية */}
      <div className="flex justify-between items-center pt-3 border-gray-50 dark:border-gray-700/80 border-t">
        <StatusChanger caseId={item.id} current={item.status} onArchiveClick={onArchiveClick} />
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteClick(item.id); }}
          className="hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-colors"
          title="حذف القضية"
        >
          <Trash2 size={16} />
        </button>
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
      <div className="flex justify-center items-center bg-gray-50 dark:bg-gray-700/50 mx-auto mb-3 rounded-2xl w-14 h-14">
        <Icon size={26} className="text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{msg}</p>
      {!hasSearch && !isArchive && (
        <Link to="/cases/new" className="inline-flex items-center gap-1.5 mt-3 font-medium text-orange-600 dark:text-orange-400 text-sm hover:underline">
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

  const [caseToDelete, setCaseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printTypeFilter, setPrintTypeFilter] = useState([]);

  // استيراد الإكسل
  const fileInputRef = useRef(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [parsedExcelData, setParsedExcelData] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await parseExcelFile(file);
      setParsedExcelData(data);
      setImportModalOpen(true);
    } catch (err) {
      alert(err.message);
    } finally {
      // تفريغ الحقل لتتمكن من رفع نفس الملف مرة أخرى إذا لزم الأمر
      e.target.value = null;
    }
  };

  // اختصار لوحة المفاتيح للطباعة (Ctrl + P)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPrintModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!caseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'cases', caseToDelete));
      setCaseToDelete(null);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحذف: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

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

  const printFiltered = useMemo(() => {
    return cases.filter(c => {
      // إخفاء القضايا المؤرشفة من الطباعة
      if (c.status === 'archived') return false;
      
      if (printTypeFilter.length > 0 && !printTypeFilter.includes(c.type)) return false;
      return true;
    });
  }, [cases, printTypeFilter]);

  /* ─── التمرير اللانهائي (Pagination) ─── */
  const [displayCount, setDisplayCount] = useState(7);
  const observerRef = useRef(null);

  // تمت إزالة useEffect الجانبي لتحديث displayCount
  // للوقاية من الـ Double Rendering وبطء واجهة البحث

  const displayedCases = useMemo(() => {
    return filtered.slice(0, displayCount);
  }, [filtered, displayCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount(prev => Math.min(prev + 15, filtered.length));
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [filtered.length, displayCount]); // تضاف displayCount لضمان تكرار الجلب إذا كان العنصر ما زال مرئياً

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
      <div className="print:hidden mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">

        {/* ─── رأس الصفحة ─── */}
        <div className="flex justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-2xl sm:text-3xl">القضايا</h1>
            <p className="mt-0.5 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {counts.active} نشطة · {counts.archived} مؤرشفة · {counts.total} إجمالي
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* حقل رفع مخفي */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload} 
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 sm:gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 shadow-sm px-3 sm:px-4 py-2.5 border border-emerald-200 dark:border-emerald-500/30 rounded-xl font-medium text-emerald-700 dark:text-emerald-400 text-sm active:scale-95 transition-all shrink-0"
              title="استيراد قضايا من ملف إكسل"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden xl:inline">استيراد</span>
            </button>

            <button
              onClick={() => exportCasesToExcel(cases)}
              className="flex items-center gap-1.5 sm:gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 shadow-sm px-3 sm:px-4 py-2.5 border border-indigo-200 dark:border-indigo-500/30 rounded-xl font-medium text-indigo-700 dark:text-indigo-400 text-sm active:scale-95 transition-all shrink-0"
              title="تصدير السجل الكامل إلى إكسل"
            >
              <FileOutput size={18} />
              <span className="hidden xl:inline">تصدير الإكسل</span>
            </button>

            <button
              onClick={() => setPrintModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-sm px-3 sm:px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-200 text-sm active:scale-95 transition-all shrink-0"
              title="طباعة (Ctrl + P)"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">طباعة</span>
            </button>
            <Link
              to="/cases/new"
              className="flex items-center gap-1.5 sm:gap-2 bg-orange-600 hover:bg-orange-700 shadow-orange-600/25 shadow-sm px-3 sm:px-5 py-2.5 rounded-xl font-medium text-white text-sm active:scale-95 transition-all shrink-0"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">إضافة قضية</span>
            </Link>
          </div>
        </div>

        {/* ─── شريط بحث + فلاتر ─── */}
        <div className="bg-white dark:bg-gray-800 shadow-sm mb-5 p-3 sm:p-4 border border-gray-100 dark:border-gray-700/80 rounded-2xl">
          <div className="flex gap-2">
            {/* حقل البحث */}
            <div className="relative flex-1">
              <Search size={16} className="absolute inset-y-0 my-auto text-gray-400 pointer-events-none start-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setDisplayCount(7); }}
                placeholder="ابحث بالقضية، الموكل، الخصم..."
                className="bg-gray-50 dark:bg-gray-900/50 py-2.5 ps-10 pe-4 border border-gray-200 focus:border-orange-500 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full text-gray-900 dark:text-white text-sm transition-colors placeholder-gray-400 dark:placeholder-gray-600"
              />
              {search && (
                <button onClick={() => { setSearch(''); setDisplayCount(7); }} className="absolute inset-y-0 my-auto text-gray-400 hover:text-gray-600 end-3">
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
                <span className="bg-orange-500 rounded-full w-1.5 h-1.5 shrink-0" />
              )}
            </button>
          </div>

          {/* لوحة الفلاتر — تنزلق عند الفتح */}
          {filtersOpen && (
            <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 mt-3 pt-3 border-gray-100 dark:border-gray-700/60 border-t">

              {/* فلتر الحالة — Chip Tabs */}
              <div>
                <p className="mb-2 font-semibold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">الحالة</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'active', label: 'نشطة' },
                    { value: 'archived', label: 'مؤرشفة' },
                    { value: 'all', label: 'الكل' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setStatusFilter(opt.value); setDisplayCount(7); }}
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
                <p className="mb-2 font-semibold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">نوع القضية</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => { setTypeFilter(''); setDisplayCount(7); }}
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
                      onClick={() => { setTypeFilter(t); setDisplayCount(7); }}
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
                <div className="flex justify-end sm:col-span-2">
                  <button
                    onClick={() => { setTypeFilter(''); setStatusFilter('active'); setDisplayCount(7); }}
                    className="flex items-center gap-1 text-red-400 hover:text-red-500 text-xs transition-colors"
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
          <div className="flex flex-col justify-center items-center gap-3 py-20">
            <span className="border-2 border-orange-200 border-t-orange-500 rounded-full w-9 h-9 animate-spin" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">جاري تحميل القضايا...</p>
          </div>
        ) : filtered.length === 0 ? (
          /* فراغ */
          <EmptyState isArchive={isArchiveView} hasSearch={!!search} />
        ) : (
          <>
            {/* ─── جدول (md فما فوق) ─── */}
            <div className="hidden md:block bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-start">
                  <thead>
                    <tr className="bg-gray-50/70 dark:bg-gray-900/40 border-gray-100 dark:border-gray-700/60 border-b">
                      {['تفاصيل القضية', 'الأطراف', 'موضوع الدعوى', 'المحكمة والجلسة', 'الحالة', ''].map((h, i) => (
                        <th key={i}
                          className={`px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide
                          ${i === 5 ? 'text-end w-10' : 'text-start'}`}
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
                            <span className="bg-orange-50 dark:bg-orange-500/10 shadow-sm px-2 py-0.5 border border-orange-200 dark:border-orange-500/30 rounded font-bold text-orange-700 dark:text-orange-400 text-xs tracking-wide" title={item.title}>
                              {item.title}
                            </span>
                            <span className="font-medium text-gray-500 dark:text-gray-400 text-xs">{item.type}</span>
                          </div>
                        </td>

                        {/* الأطراف */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5 text-sm">
                            <span className="flex items-start gap-1.5">
                              <span className="bg-emerald-500 mt-1.5 rounded-full w-1.5 h-1.5 shrink-0" />
                              <span className="max-w-[200px] text-gray-800 dark:text-gray-200 break-words leading-snug" title={item.clientName}>{item.clientName}</span>
                            </span>
                            {item.opponentName && (
                              <span className="flex items-start gap-1.5">
                                <span className="bg-red-400 mt-1.5 rounded-full w-1.5 h-1.5 shrink-0" />
                                <span className="max-w-[200px] text-gray-500 dark:text-gray-400 break-words leading-snug" title={item.opponentName}>{item.opponentName}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* موضوع الدعوى */}
                        <td className="px-5 py-4">
                          <div className="max-w-[200px] text-gray-600 dark:text-gray-300 text-xs break-words leading-snug">
                            {item.caseSubject || <span className="text-gray-400 italic">غير محدد</span>}
                          </div>
                        </td>

                        {/* المحكمة */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5 text-xs">
                            {item.court && (
                              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                <MapPin size={12} className="text-gray-400 shrink-0" />
                                <span className="max-w-[150px] truncate" title={item.court}>{item.court}</span>
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

                        {/* أزرار الإجراءات */}
                        <td className="px-4 py-4 text-end">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setCaseToDelete(item.id); }}
                              className="hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-all"
                              title="حذف القضية"
                            >
                              <Trash2 size={16} />
                            </button>
                            <FolderOpen size={16} className="text-gray-300 dark:group-hover:text-orange-500 group-hover:text-orange-400 transition-colors" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── بطاقات (أقل من md) ─── */}
            <div className="md:hidden gap-3 grid grid-cols-1 sm:grid-cols-2">
              {displayedCases.map(item => (
                <CaseCard key={item.id} item={item} onNavigate={id => navigate(`/cases/${id}`)} onArchiveClick={setCaseToArchive} onDeleteClick={setCaseToDelete} />
              ))}
            </div>
          </>
        )}

        {/* مؤشر التمرير وعداد القضايا */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col justify-center items-center mt-6 mb-2">
            <p className="mb-4 text-gray-400 dark:text-gray-500 text-xs">
              عرض {displayedCases.length} من أصل {filtered.length} قضية
            </p>
            <div ref={observerRef} className="h-4" />
          </div>
        )}

        {/* ─── مودال تأكيد الحذف ─── */}
        {caseToDelete && (
          <div className="z-[100] fixed inset-0 flex justify-center items-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white dark:bg-gray-800 shadow-xl p-6 rounded-2xl w-full max-w-sm overflow-hidden animate-in duration-200 fade-in zoom-in-95">
              <div className="flex justify-center items-center bg-red-100 dark:bg-red-500/20 mx-auto mb-4 rounded-full w-12 h-12">
                <Trash2 className="text-red-600 dark:text-red-500" size={24} />
              </div>
              <h3 className="mb-2 font-bold text-gray-900 dark:text-white text-lg text-center">تأكيد الحذف</h3>
              <p className="mb-6 text-gray-500 dark:text-gray-400 text-sm text-center leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذه القضية؟ هذا الإجراء لا يمكن التراجع عنه.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setCaseToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex flex-1 justify-center items-center bg-red-600 hover:bg-red-700 disabled:opacity-50 shadow-red-600/20 shadow-sm px-4 py-2.5 rounded-xl font-medium text-white text-sm active:scale-[0.98] transition-all"
                >
                  {isDeleting ? (
                    <span className="border-2 border-red-300 border-t-white rounded-full w-5 h-5 animate-spin" />
                  ) : (
                    "حذف نهائي"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── مودال تأكيد الأرشفة ─── */}
        {caseToArchive && (
          <div className="z-[100] fixed inset-0 flex justify-center items-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white dark:bg-gray-800 shadow-xl p-6 rounded-2xl w-full max-w-sm overflow-hidden animate-in duration-200 fade-in zoom-in-95">
              <div className="flex justify-center items-center bg-orange-100 dark:bg-orange-500/20 mx-auto mb-4 rounded-full w-12 h-12">
                <AlertTriangle className="text-orange-600 dark:text-orange-500" size={24} />
              </div>
              <h3 className="mb-2 font-bold text-gray-900 dark:text-white text-lg text-center">تأكيد الأرشفة</h3>
              <p className="mb-6 text-gray-500 dark:text-gray-400 text-sm text-center leading-relaxed">
                هل أنت متأكد من رغبتك في أرشفة هذه القضية؟ سيتم تخصيص <strong>رقم أرشفة تسلسلي فريد</strong> لها ونقلها إلى سجل القضايا المؤرشفة.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setCaseToArchive(null)}
                  disabled={isArchiving}
                  className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleArchiveConfirm}
                  disabled={isArchiving}
                  className="flex flex-1 justify-center items-center bg-orange-600 hover:bg-orange-700 disabled:opacity-50 shadow-orange-600/20 shadow-sm px-4 py-2.5 rounded-xl font-medium text-white text-sm active:scale-[0.98] transition-all"
                >
                  {isArchiving ? (
                    <span className="border-2 border-orange-300 border-t-white rounded-full w-5 h-5 animate-spin" />
                  ) : (
                    'أرشفة القضية'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── مودال خيارات الطباعة ─── */}
        {printModalOpen && (
          <div className="z-[100] fixed inset-0 flex justify-center items-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white dark:bg-gray-800 shadow-xl p-6 rounded-2xl w-full max-w-md overflow-hidden animate-in duration-200 fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-lg">
                  <Printer className="text-orange-600 dark:text-orange-500" size={20} />
                  خيارات الطباعة
                </h3>
                <button onClick={() => setPrintModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 mb-5 p-3.5 border border-blue-100 dark:border-blue-800/30 rounded-xl font-medium text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
                <Info className="mt-0.5 shrink-0" size={16} />
                <p>
                  <strong>تلميح:</strong> إذا كنت ترغب في حفظ التقرير كملف PDF عالي الجودة بدلاً من طباعته على الورق، اختر <span className="font-bold decoration-blue-300 underline underline-offset-2">حفظ بتنسيق PDF</span> (أو Save as PDF) من قائمة الطابعات في النافذة التالية.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block mb-4 font-medium text-gray-700 dark:text-gray-300 text-sm">نوع القضايا للطباعة</label>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setPrintTypeFilter([])}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        printTypeFilter.length === 0
                          ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:text-orange-600'
                      }`}
                    >
                      الكل
                    </button>
                    {CASE_TYPES.map(t => {
                      const isSelected = printTypeFilter.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => {
                            if (isSelected) {
                              setPrintTypeFilter(prev => prev.filter(x => x !== t));
                            } else {
                              setPrintTypeFilter(prev => [...prev, t]);
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            isSelected
                              ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:text-orange-600'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 text-sm transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => {
                    setPrintModalOpen(false);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="flex flex-1 justify-center items-center gap-2 bg-orange-600 hover:bg-orange-700 shadow-orange-600/20 shadow-sm px-4 py-2.5 rounded-xl font-medium text-white text-sm active:scale-[0.98] transition-all"
                >
                  <Printer size={16} />
                  تأكيد وطباعة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── جدول الطباعة (يظهر فقط عند الطباعة) ─── */}
      <PrintableCasesTable filtered={printFiltered} hasActiveFilter={printTypeFilter.length > 0} printType={printTypeFilter} />

      {/* ─── مودل استيراد الإكسل ─── */}
      <ImportCasesModal 
        isOpen={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        parsedData={parsedExcelData}
        onComplete={() => {
          // يمكن إضافة أي إجراء بعد الانتهاء
        }}
      />
    </>
  );
}