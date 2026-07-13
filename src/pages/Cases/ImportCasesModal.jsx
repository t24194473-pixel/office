import { useState, useEffect } from 'react';
import { X, FileSpreadsheet, CheckCircle2, AlertTriangle, ChevronRight, Save } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, query, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { EXPECTED_COLUMNS, buildKeywords } from '../../utils/excelImport';
import { CASE_TYPES, CASE_STATUSES } from './casesConfig';
import { useAuthStore } from '../../store/authStore';

export default function ImportCasesModal({ isOpen, onClose, parsedData, onComplete }) {
  const { user } = useAuthStore();
  const [step, setStep] = useState('mapping'); // 'mapping' | 'review' | 'importing' | 'result'
  
  // بيانات مابين الخطوات
  const [missingDefaults, setMissingDefaults] = useState({});
  const [processedCases, setProcessedCases] = useState([]);
  const [duplicateCases, setDuplicateCases] = useState([]); // { row, existingId }
  const [duplicateAction, setDuplicateAction] = useState('skip'); // 'skip' | 'overwrite' | 'abort'
  
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, skipped: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  // استخراج الداتا عند فتح المودل
  useEffect(() => {
    if (isOpen && parsedData) {
      setStep('mapping');
      setMissingDefaults({});
      setProcessedCases([]);
      setDuplicateCases([]);
      setErrorMsg('');
    }
  }, [isOpen, parsedData]);

  if (!isOpen || !parsedData) return null;

  const { rawRows, missingColumns, fileHeaders } = parsedData;

  // -- خطوة 1: حفظ القيم الافتراضية والانتقال للمراجعة
  const handleMappingSubmit = async (e) => {
    e.preventDefault();
    
    // تركيب البيانات النهائية للصفوف
    const mappedCases = rawRows.map(row => {
      const getVal = (key) => {
        const label = EXPECTED_COLUMNS[key];
        // نبحث عن اسم العمود الفعلي في الملف
        const actualHeader = fileHeaders.find(h => h.trim() === label);
        if (actualHeader && row[actualHeader] !== undefined) {
          return String(row[actualHeader]).trim();
        }
        return missingDefaults[key] || '';
      };

      let titleVal = getVal('title');
      // تجريد القيمة من أي نصوص أو حروف والاحتفاظ بالأرقام فقط (العربية والإنجليزية)
      titleVal = titleVal.replace(/[^\d٠-٩]/g, '');

      return {
        title: titleVal,
        clientName: getVal('clientName'),
        clientRole: getVal('clientRole'),
        opponentName: getVal('opponentName'),
        caseSubject: getVal('caseSubject'),
        type: getVal('type') || CASE_TYPES[0], // النوع الافتراضي
        status: getVal('status') || 'active', // الحالة الافتراضية
        court: getVal('court'),
        nextSessionDate: getVal('nextSessionDate'),
        description: getVal('description'),
      };
    });

    // فلترة الصفوف الفارغة تماماً
    const validCases = mappedCases.filter(c => c.title || c.clientName);
    
    if (validCases.length === 0) {
      setErrorMsg('لم يتم العثور على أي بيانات صالحة بعد مطابقة الأعمدة.');
      return;
    }

    setStep('review');
    setProcessedCases(validCases);

    // فحص التكرار من قاعدة البيانات
    try {
      // بما أن العدد قد يكون كبيراً، سنجلب جميع القضايا الموجودة حالياً لنقاطعها في الذاكرة (أسرع من استعلام لكل صف)
      // إذا كانت القاعدة ضخمة جداً، يمكن استخدام استعلامات محددة، لكن للتبسيط:
      const qSnap = await getDocs(collection(db, 'cases'));
      const existingDb = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const duplicates = [];
      validCases.forEach(newCase => {
        // القاعدة: التكرار إذا كان نفس رقم الحفظ (title) ونفس النوع (type)
        const found = existingDb.find(ex => ex.title === newCase.title && ex.type === newCase.type);
        if (found) {
          duplicates.push({ row: newCase, existingId: found.id });
        }
      });
      setDuplicateCases(duplicates);
    } catch (err) {
      console.error(err);
      setErrorMsg('فشل فحص التكرار من قاعدة البيانات.');
    }
  };

  // -- خطوة 2: بدء الاستيراد الفعلي
  const handleImport = async () => {
    if (duplicateCases.length > 0 && duplicateAction === 'abort') {
      onClose();
      return;
    }

    setStep('importing');
    
    try {
      let successCount = 0;
      let skippedCount = 0;

      // استخدام دفعات (Batches) نظراً ليميت فايربيز (500 عملية بالدفعة)
      let batch = writeBatch(db);
      let opCount = 0;

      for (const c of processedCases) {
        const dupInfo = duplicateCases.find(d => d.row === c);
        
        let docRef;
        let isUpdate = false;

        if (dupInfo) {
          if (duplicateAction === 'skip') {
            skippedCount++;
            continue;
          } else if (duplicateAction === 'overwrite') {
            docRef = doc(db, 'cases', dupInfo.existingId);
            isUpdate = true;
          }
        } else {
          // ملف جديد
          docRef = doc(collection(db, 'cases'));
        }

        // مطابقة النوع والحالة مع القيم الصحيحة
        const safeType = CASE_TYPES.includes(c.type) ? c.type : CASE_TYPES[0];
        const statusMatch = CASE_STATUSES.find(s => s.label === c.status || s.value === c.status);
        const safeStatus = statusMatch ? statusMatch.value : 'active';

        const caseData = {
          title: c.title,
          clientName: c.clientName,
          clientRole: c.clientRole,
          opponentName: c.opponentName,
          caseSubject: c.caseSubject,
          type: safeType,
          status: safeStatus,
          court: c.court,
          nextSessionDate: c.nextSessionDate,
          description: c.description,
          searchKeywords: buildKeywords(c.title, c.clientName, c.opponentName, c.caseSubject, c.court),
          updatedAt: serverTimestamp()
        };

        if (!isUpdate) {
          caseData.createdAt = serverTimestamp();
          caseData.createdBy = user?.uid || null;
          batch.set(docRef, caseData);
        } else {
          batch.update(docRef, caseData);
        }

        successCount++;
        opCount++;

        // تنفيذ الدفعة إذا وصلنا لـ 450 عملية لنتفادى الحد الأقصى (500)
        if (opCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      // رفع الباقي
      if (opCount > 0) {
        await batch.commit();
      }

      setImportStats({ success: successCount, failed: 0, skipped: skippedCount });
      setStep('result');
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء رفع البيانات إلى الخادم.');
      setStep('review');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-500" />
            استيراد القضايا من إكسل
          </h3>
          {step !== 'importing' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle size={18} className="shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* الخطوة 1: تعويض النواقص */}
          {step === 'mapping' && (
            <form id="mapping-form" onSubmit={handleMappingSubmit}>
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  تم قراءة <span className="font-bold text-orange-600">{rawRows.length}</span> صف من الملف.
                </p>
              </div>

              {missingColumns.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">
                      ⚠️ لم نتمكن من العثور على بعض الأعمدة الأساسية في ملف الإكسل الخاص بك.
                    </p>
                    <p className="text-xs text-orange-600/80 dark:text-orange-400/80">
                      يرجى إدخال قيمة افتراضية ليتم تعبئتها لجميع القضايا المرفوعة، أو اتركها فارغة إذا لم تكن مطلوبة.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {missingColumns.map(col => (
                      <div key={col.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {col.label} {col.isRequired && <span className="text-red-500">*</span>}
                        </label>
                        {col.key === 'type' ? (
                          <select
                            required={col.isRequired}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                            onChange={e => setMissingDefaults(p => ({ ...p, [col.key]: e.target.value }))}
                          >
                            <option value="">اختر النوع الافتراضي</option>
                            {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : col.key === 'status' ? (
                           <select
                           required={col.isRequired}
                           className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                           onChange={e => setMissingDefaults(p => ({ ...p, [col.key]: e.target.value }))}
                         >
                           <option value="">اختر الحالة الافتراضية</option>
                           {CASE_STATUSES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                         </select>
                        ) : (
                          <input
                            type="text"
                            required={col.isRequired}
                            placeholder={`قيمة لـ ${col.label}`}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                            onChange={e => setMissingDefaults(p => ({ ...p, [col.key]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  تم التعرف على جميع الأعمدة بنجاح!
                </div>
              )}
            </form>
          )}

          {/* الخطوة 2: المراجعة */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                  <FileSpreadsheet size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">جاهز للاستيراد</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">سيتم إضافة {processedCases.length} قضية إلى النظام.</p>
                </div>
              </div>

              {duplicateCases.length > 0 && (
                <div className="p-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-1">
                        تم العثور على {duplicateCases.length} قضية موجودة مسبقاً!
                      </h4>
                      <p className="text-sm text-amber-800 dark:text-amber-300/80 mb-3">
                        يحتوي الملف على قضايا تحمل أرقام حفظ وأنواع مسجلة بالفعل في النظام. كيف تريد التعامل معها؟
                      </p>
                      
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700/50 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <input type="radio" name="dupAction" value="skip" checked={duplicateAction === 'skip'} onChange={() => setDuplicateAction('skip')} className="text-amber-600" />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">تجاهل المكرر وإضافة القضايا الجديدة فقط</span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700/50 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <input type="radio" name="dupAction" value="overwrite" checked={duplicateAction === 'overwrite'} onChange={() => setDuplicateAction('overwrite')} className="text-amber-600" />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">تحديث القضايا الموجودة ببيانات الملف</span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700/50 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <input type="radio" name="dupAction" value="abort" checked={duplicateAction === 'abort'} onChange={() => setDuplicateAction('abort')} className="text-amber-600" />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">إيقاف وإلغاء عملية الاستيراد بالكامل</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* الخطوة 3: جارٍ الرفع */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">جاري معالجة ورفع البيانات...</h3>
              <p className="text-sm text-gray-500">يرجى عدم إغلاق هذه النافذة.</p>
            </div>
          )}

          {/* الخطوة 4: النتيجة */}
          {step === 'result' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">تم الاستيراد بنجاح!</h3>
              <div className="text-gray-600 dark:text-gray-400 space-y-1">
                <p>تم استيراد/تحديث: <span className="font-bold text-emerald-600">{importStats.success}</span> قضية.</p>
                {importStats.skipped > 0 && <p>تم تجاهل: <span className="font-bold text-amber-600">{importStats.skipped}</span> قضية مكررة.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
          {step === 'mapping' && (
            <>
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                إلغاء
              </button>
              <button form="mapping-form" type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2">
                التالي <ChevronRight size={16} className="rotate-180" />
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <button onClick={() => setStep('mapping')} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                عودة
              </button>
              <button onClick={handleImport} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2">
                <Save size={16} /> بدء الاستيراد
              </button>
            </>
          )}

          {step === 'result' && (
            <button onClick={() => { onClose(); onComplete(); }} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white shadow-sm">
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
