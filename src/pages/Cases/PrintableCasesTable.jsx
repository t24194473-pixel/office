import { CASE_STATUSES } from './casesConfig';

export default function PrintableCasesTable({ filtered, hasActiveFilter }) {
  return (
    <div className="hidden print:block p-8 bg-white" dir="rtl">
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-black mb-2">سجل القضايا</h1>
        <p className="text-sm text-gray-700 font-medium">
          {hasActiveFilter ? 'قائمة مفلترة مخصصة' : 'جميع القضايا المسجلة'}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}
        </p>
      </div>

      <table className="w-full text-right border-collapse border border-gray-400 text-sm">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-200">
            <th className="border border-gray-400 px-4 py-3 font-bold text-black text-center">رقم القضية</th>
            <th className="border border-gray-400 px-4 py-3 font-bold text-black text-center">النوع</th>
            <th className="border border-gray-400 px-4 py-3 font-bold text-black text-center">الأطراف (المدعي - المدعى عليه)</th>
            <th className="border border-gray-400 px-4 py-3 font-bold text-black text-center">المحكمة والجلسة القادمة</th>
            <th className="border border-gray-400 px-4 py-3 font-bold text-black text-center w-32">تاريخ الإضافة</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(item => {
            let createdDate = '-';
            if (item.createdAt) {
               const dateObj = item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
               if (!isNaN(dateObj)) createdDate = dateObj.toLocaleDateString('ar-SA');
            }
            return (
              <tr key={item.id} className="break-inside-avoid">
                <td className="border border-gray-400 px-4 py-3 font-bold text-black text-center">{item.title}</td>
                <td className="border border-gray-400 px-4 py-3 text-black text-center">{item.type}</td>
                <td className="border border-gray-400 px-4 py-3 text-black text-center">
                  <div className="font-semibold">{item.clientName}</div>
                  {item.opponentName && <div className="text-gray-700 mt-1">ضد: {item.opponentName}</div>}
                </td>
                <td className="border border-gray-400 px-4 py-3 text-black text-center">
                  <div>{item.court || '-'}</div>
                  {item.nextSessionDate && (
                    <div className="mt-1 font-semibold">
                      جلسة: {new Date(item.nextSessionDate).toLocaleDateString('ar-SA')}
                    </div>
                  )}
                </td>
                <td className="border border-gray-400 px-4 py-3 text-black font-semibold text-center">
                  {createdDate}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-500 font-bold border-x border-b border-gray-400">
          لا توجد قضايا لعرضها في هذه القائمة.
        </div>
      )}

      <div className="mt-6 flex justify-between items-center text-xs text-gray-500 font-medium">
        <p>إجمالي القضايا: {filtered.length}</p>
        <p>نظام إدارة القضايا</p>
      </div>
    </div>
  );
}
