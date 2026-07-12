import { read, utils, writeFile } from 'xlsx';

// الأعمدة المتوقعة في النظام
export const EXPECTED_COLUMNS = {
  title: 'رقم الحفظ',
  clientName: 'اسم الموكل',
  opponentName: 'اسم الخصم',
  type: 'نوع القضية',
  status: 'حالة القضية',
  court: 'المحكمة المختصة',
  nextSessionDate: 'تاريخ الجلسة',
  description: 'الملاحظات'
};

// الأعمدة التي لا يمكن الاستغناء عنها
export const REQUIRED_KEYS = ['title', 'clientName', 'type'];

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // تحويل البيانات إلى مصفوفة كائنات
        const rawRows = utils.sheet_to_json(worksheet, { defval: '' });
        
        if (rawRows.length === 0) {
          throw new Error('الملف فارغ ولا يحتوي على أي بيانات.');
        }

        // استخراج رؤوس الأعمدة من الملف (أول صف بيانات) لمعرفة الناقص
        const fileHeaders = Object.keys(rawRows[0] || {});
        
        const missingColumns = [];
        Object.entries(EXPECTED_COLUMNS).forEach(([key, label]) => {
          // نبحث عن العمود في الملف
          // نتجاهل المسافات الزائدة وحالة الأحرف للتقريب
          const found = fileHeaders.find(h => h.trim() === label);
          if (!found) {
            missingColumns.push({ key, label, isRequired: REQUIRED_KEYS.includes(key) });
          }
        });

        resolve({ rawRows, missingColumns, fileHeaders });
      } catch (err) {
        reject(new Error('فشل قراءة الملف. يرجى التأكد من أنه ملف إكسل صالح.'));
      }
    };
    reader.onerror = () => reject(new Error('حدث خطأ أثناء قراءة الملف.'));
    reader.readAsArrayBuffer(file);
  });
}

// دالة توليد كلمات البحث المفتاحية
export function buildKeywords(...texts) {
  const kws = new Set();
  texts.filter(Boolean).forEach(text => {
    const words = String(text).toLowerCase().trim().split(/\s+/);
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

// تصدير القضايا إلى إكسل
export function exportCasesToExcel(cases) {
  const workbook = utils.book_new();
  
  // دالة مساعدة لتنسيق البيانات وتصديرها كشيت
  const addSheet = (sheetCases, sheetName) => {
    if (sheetCases.length === 0) return;
    
    // تحويل الكائنات إلى التنسيق المطلوب للأعمدة
    const formattedData = sheetCases.map(c => ({
      [EXPECTED_COLUMNS.title]: c.title || '-',
      [EXPECTED_COLUMNS.clientName]: c.clientName || '-',
      [EXPECTED_COLUMNS.opponentName]: c.opponentName || '-',
      [EXPECTED_COLUMNS.type]: c.type || '-',
      [EXPECTED_COLUMNS.status]: c.status || '-',
      [EXPECTED_COLUMNS.court]: c.court || '-',
      [EXPECTED_COLUMNS.nextSessionDate]: c.nextSessionDate || '-',
      [EXPECTED_COLUMNS.description]: c.description || '-'
    }));

    const worksheet = utils.json_to_sheet(formattedData);
    
    // ضبط اتجاه الشيت ليكون من اليمين لليسار
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'][0] = { rightToLeft: true };
    
    // ضبط عرض الأعمدة لتكون مقروءة
    worksheet['!cols'] = [
      { wch: 15 }, // رقم الحفظ
      { wch: 25 }, // الموكل
      { wch: 25 }, // الخصم
      { wch: 20 }, // النوع
      { wch: 15 }, // الحالة
      { wch: 25 }, // المحكمة
      { wch: 15 }, // الجلسة
      { wch: 40 }  // الملاحظات
    ];

    // لضمان أن اسم الشيت صالح (يجب أن لا يتجاوز 31 حرف ولا يحتوي على رموز معينة)
    const safeSheetName = sheetName.substring(0, 31).replace(/[\\/?*[\]]/g, '');
    utils.book_append_sheet(workbook, worksheet, safeSheetName);
  };

  // 1. تجميع القضايا النشطة (التي ليست مؤرشفة) حسب نوع القضية
  const activeCases = cases.filter(c => c.status !== 'archived');
  const types = [...new Set(activeCases.map(c => c.type))];
  
  types.forEach(type => {
    const casesOfType = activeCases.filter(c => c.type === type);
    addSheet(casesOfType, type);
  });

  // 2. تجميع القضايا المؤرشفة في شيت مستقل
  const archivedCases = cases.filter(c => c.status === 'archived');
  if (archivedCases.length > 0) {
    addSheet(archivedCases, 'القضايا المؤرشفة');
  }

  // إذا كان الملف فارغاً تماماً
  if (workbook.SheetNames.length === 0) {
    addSheet([{ 'النظام': 'لا توجد قضايا للتصدير' }], 'فارغ');
  }

  // تنزيل الملف
  writeFile(workbook, 'سجل_القضايا_الكامل.xlsx');
}
