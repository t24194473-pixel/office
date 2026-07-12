import { jsPDF } from 'jspdf';
import { domToJpeg } from 'modern-screenshot';

/**
 * تحويل عنصر HTML إلى ملف PDF وتنزيله
 * يعتمد على modern-screenshot لتفادي أخطاء الألوان الحديثة وفقدان التنسيقات في Vite
 * 
 * @param {string} elementId - معرف العنصر في الصفحة
 * @param {string} filename - اسم الملف المراد تنزيله
 */
export async function downloadElementAsPDF(elementId, filename = 'document.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('لم يتم العثور على العنصر المراد طباعته');
  }

  // التقاط العنصر كصورة بصيغة JPEG بجودة عالية
  const dataUrl = await domToJpeg(element, { 
    quality: 0.98, 
    scale: 2, 
    backgroundColor: '#ffffff' // ضمان خلفية بيضاء للتقرير
  });

  // إنشاء مستند PDF جديد (A4 عمودي)
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  
  // حساب الارتفاع المناسب بناءً على أبعاد العنصر الأصلي
  const elementWidth = element.offsetWidth || 794;
  const elementHeight = element.offsetHeight;
  
  const pdfHeight = (elementHeight * pdfWidth) / elementWidth;

  // إضافة الصورة إلى الـ PDF وتنزيله
  pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}
