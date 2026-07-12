export default function PrintableCasesTable({ filtered, hasActiveFilter, printType }) {
  const formatDate = (d) => {
    if (!d) return "-";
    const x = d.seconds ? new Date(d.seconds * 1000) : new Date(d);
    return isNaN(x) ? "-" : x.toLocaleDateString("ar-SA");
  };

  return (
    <div className="hidden print:block bg-white text-slate-800 p-5 print:p-4 text-[12px]" dir="rtl">
      <style>{`
        @media print{
          @page{size:A4 portrait;margin:8mm;}
          thead{display:table-header-group;}
          tr{break-inside:avoid;page-break-inside:avoid;}
          *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
        }
      `}</style>

      <div className="mb-4 border-b border-slate-300 pb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">سجل القضايا</h1>
            <span className="bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
              {hasActiveFilter ? printType.join(" - ") : "جميع القضايا"}
            </span>
          </div>
          <p className="text-slate-500 mt-1.5 text-xs font-medium">
            تقرير تفصيلي بالقضايا المسجلة في النظام
          </p>
        </div>
        <div className="text-left text-[11px] leading-6">
          <div><b>التاريخ:</b> {new Date().toLocaleDateString("ar-SA")}</div>
          <div><b>عدد القضايا:</b> {filtered.length}</div>
        </div>
      </div>

      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-100 text-slate-700">
            {["#", "رقم القضية", "النوع", "الأطراف", "المحكمة", "الجلسة", "الإضافة"].map(h => (
              <th key={h} className="px-2 py-2 text-center border-b border-slate-300 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-slate-500">لا توجد بيانات.</td></tr>
          )}
          {filtered.map((item, i) => (
            <tr key={item.id} className={i % 2 ? "bg-slate-50" : "bg-white"}>
              <td className="px-2 py-2 border-b border-slate-200 text-center">{i + 1}</td>
              <td className="px-2 py-2 border-b border-slate-200 font-medium text-center">{item.title || "-"}</td>
              <td className="px-2 py-2 border-b border-slate-200 text-center">{item.type || "-"}</td>
              <td className="px-2 py-2 border-b border-slate-200">
                <div className="font-medium">{item.clientName || "-"}</div>
                {item.opponentName && <div className="text-slate-500 text-[11px]">ضد {item.opponentName}</div>}
              </td>
              <td className="px-2 py-2 border-b border-slate-200 text-center">{item.court || "-"}</td>
              <td className="px-2 py-2 border-b border-slate-200 text-center">{formatDate(item.nextSessionDate)}</td>
              <td className="px-2 py-2 border-b border-slate-200 text-center">{formatDate(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
