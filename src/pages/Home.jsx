import { ArrowUpRight, Plus, Download, MoreHorizontal } from 'lucide-react';

export default function Home() {
  return (
    <div className="px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto w-full transition-colors duration-300">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 transition-colors">لوحة القيادة</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">خطط، رتب أولوياتك، وأنجز مهامك بكل سهولة.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl font-medium text-sm hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
            <Download size={16} />
            استيراد البيانات
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-orange-600/30 dark:shadow-orange-900/30">
            <Plus size={16} />
            إضافة مشروع
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Card 1: Main Highlight */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-orange-500/20 shadow-xl dark:shadow-orange-900/20">
          <div className="absolute top-0 end-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mt-10 -me-10 poiter-events-none"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <p className="font-medium text-orange-50">إجمالي المشاريع</p>
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <ArrowUpRight size={16} className="text-white" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-2">24</h2>
            <div className="inline-flex items-center gap-1.5 bg-orange-500/50 backdrop-blur-sm rounded-md px-2 py-1 border border-white/10">
              <ArrowUpRight size={12} className="text-orange-100" />
              <span className="text-xs text-orange-50">زيادة عن الشهر الماضي</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between group hover:border-orange-200 dark:hover:border-orange-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="font-medium text-gray-500 dark:text-gray-400 text-sm">المشاريع المنتهية</p>
            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center group-hover:bg-orange-50 dark:group-hover:bg-orange-500/20 transition-colors relative isolate">
              <ArrowUpRight size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-orange-500 dark:group-hover:text-orange-400" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">10</h2>
            <div className="inline-flex items-center gap-1.5">
              <div className="w-4 h-4 rounded px-[3px] py-[3px] bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center border border-green-200 dark:border-transparent">
                 <ArrowUpRight size={10} />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">زيادة عن الشهر الماضي</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between group hover:border-orange-200 dark:hover:border-orange-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="font-medium text-gray-500 dark:text-gray-400 text-sm">المشاريع الجارية</p>
            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center group-hover:bg-orange-50 dark:group-hover:bg-orange-500/20 cursor-pointer transition-colors">
              <ArrowUpRight size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-orange-500 dark:group-hover:text-orange-400" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">12</h2>
            <div className="inline-flex items-center gap-1.5">
              <div className="w-4 h-4 rounded px-[3px] py-[3px] bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-transparent">
                 <ArrowUpRight size={10} className="rotate-90" />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">نقصان عن الشهر الماضي</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between group hover:border-orange-200 dark:hover:border-orange-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="font-medium text-gray-500 dark:text-gray-400 text-sm">المشاريع المعلقة</p>
            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center cursor-pointer transition-colors group-hover:bg-orange-50 dark:group-hover:bg-orange-500/20">
              <ArrowUpRight size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-orange-500 dark:group-hover:text-orange-400" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">2</h2>
            <div className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-xs text-gray-400 dark:text-gray-500">قيد المناقشة</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Section: Analytics & Secondary Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Project Analytics chart (Mock) */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm lg:col-span-2 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">تحليلات المشاريع</h3>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
             {[30, 70, 45, 90, 60, 40, 25].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full relative h-full flex items-end justify-center">
                    {/* Background Bar (Light) */}
                    <div className="absolute bottom-0 w-8 sm:w-12 h-full bg-gray-50 dark:bg-gray-700/50 rounded-full overflow-hidden transition-colors">
                       <div className="w-full h-full border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-full bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#f3f4f6_4px,#f3f4f6_8px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#374151_4px,#374151_8px)]"></div>
                    </div>
                    {/* Active Bar (Orange) */}
                    <div 
                      className={`relative w-8 sm:w-12 rounded-full shadow-sm transition-all duration-500 cursor-pointer ${i === 3 ? 'bg-orange-600' : 'bg-orange-300 dark:bg-orange-500/50 group-hover:bg-orange-400 dark:group-hover:bg-orange-500'}`}
                      style={{ height: `${val}%` }}
                    ></div>
                    {i === 3 && (
                      <div className="absolute -top-8 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap border border-white/10">
                        38% زيادة
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 transition-colors">
                    {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][i]}
                  </span>
                </div>
             ))}
          </div>
        </div>

        {/* Meeting Reminder */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">التذكيرات</h3>
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-orange-50/50 dark:bg-orange-500/10 rounded-2xl p-5 border border-orange-100 dark:border-orange-500/20 mb-4 transition-colors">
               <h4 className="font-bold text-gray-900 dark:text-orange-50 text-xl leading-tight mb-2">اجتماع مع شركة آرك التقنية</h4>
               <p className="text-orange-600 dark:text-orange-400 text-sm font-medium flex items-center gap-2">
                 <span>الزمن:</span>
                 <span className="bg-white dark:bg-gray-900/50 px-2 py-0.5 rounded shadow-sm border border-orange-100 dark:border-orange-900/50">02:00 م - 04:00 م</span>
               </p>
            </div>
            <button className="w-full bg-gray-900 dark:bg-orange-600 hover:bg-gray-800 dark:hover:bg-orange-700 text-white font-medium flex items-center justify-center gap-2 py-3 rounded-xl transition-colors shadow-md">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              بدء الاجتماع الجاري
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}