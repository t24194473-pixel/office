/**
 * CASES CONFIG
 * ملف مركزي لثوابت نظام القضايا
 * — قابل للتعديل المباشر من هنا دون المساس بصفحات الواجهة —
 */

export const CASE_TYPES = [
  'أحوال شخصية',
  'تجاري',
  'جنائي',
  'مدني',
  'تنفيذي',
  'شركة شهاب'
];

export const CASE_STATUSES = [
  { value: 'active', label: 'نشطة', color: 'emerald' },
  { value: 'review', label: 'قيد المراجعة', color: 'blue' },
  { value: 'verdict', label: 'محجوزة للحكم', color: 'amber' },
  { value: 'archived', label: 'مؤرشفة', color: 'gray' },
];

/** لبناء ألوان Tailwind لشاراتdynam الحالة */
export const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  review: 'bg-blue-100   text-blue-700   border-blue-200   dark:bg-blue-500/15   dark:text-blue-400   dark:border-blue-500/30',
  verdict: 'bg-amber-100  text-amber-700  border-amber-200  dark:bg-amber-500/15  dark:text-amber-400  dark:border-amber-500/30',
  archived: 'bg-gray-100   text-gray-600   border-gray-200   dark:bg-gray-500/15   dark:text-gray-400   dark:border-gray-500/30',
};

/**
 * بنية مستند قضية في Firestore (للمرجع فقط)
 *
 * cases/{caseId}:
 * - title: string             — عنوان / رقم القضية
 * - clientName: string        — اسم الموكل
 * - opponentName: string      — اسم الخصم
 * - type: string              — من CASE_TYPES
 * - status: string            — قيمة value من CASE_STATUSES
 * - court: string             — المحكمة المختصة
 * - nextSessionDate: string   — ISO date (YYYY-MM-DD)
 * - description: string       — ملاحظات إضافية
 * - searchKeywords: string[]  — كلمات مفتاحية مُولَّدة للبحث
 * - createdAt: Timestamp      — serverTimestamp
 * - createdBy: string         — uid المحامي
 *
 * ربط المهام الأسبوعية (مستقبلاً):
 * tasks/{taskId}:
 * - caseId: string            — مرجع للقضية
 * - lawyerId: string          — uid المحامي المعيَّن
 * - weekStart: string         — ISO date أول يوم في الأسبوع
 * - description: string       — تفاصيل المهمة
 * - status: 'pending'|'done'
 * - createdAt: Timestamp
 *
 * التقارير (مستقبلاً):
 * reports/{reportId}:
 * - caseId: string
 * - weekStart: string
 * - content: string
 * - createdBy: string
 * - createdAt: Timestamp
 */
