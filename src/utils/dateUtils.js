/**
 * Date utility functions for Week calculations.
 * The work week starts on Saturday and ends on Thursday.
 */

// الحصول على بداية الأسبوع (السبت) لتاريخ معين
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  // في JS: الأحد=0، الإثنين=1، السبت=6
  // لحساب المسافة للرجوع للسبت الماضي:
  const diff = (day + 1) % 7; 
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// الحصول على نهاية الأسبوع (الخميس) لتاريخ معين
export function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date);
  const end = new Date(start);
  // إضافة 5 أيام للوصول للخميس
  end.setDate(end.getDate() + 5);
  end.setHours(23, 59, 59, 999);
  return end;
}

// الحصول على اسم أو معرف فريد للأسبوع لاستخدامه في Firestore
export function getWeekId(date = new Date()) {
  const start = getWeekStart(date);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

// تنسيق تاريخ الأسبوع للعرض في الواجهة
export function formatWeekRange(date = new Date()) {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  
  const options = { month: 'short', day: 'numeric' };
  const formatter = new Intl.DateTimeFormat('ar-EG', options);
  
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

// إضافة/طرح أسابيع للتنقل
export function addWeeks(date, weeks) {
  const d = new Date(date);
  d.setDate(d.getDate() + (weeks * 7));
  return d;
}
