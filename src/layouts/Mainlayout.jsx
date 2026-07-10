import { useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { Outlet } from "react-router-dom";
import { Home, CheckSquare, Bell, Menu } from "lucide-react";

export default function Mainlayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-gray-50/50 dark:bg-gray-950 text-right h-[100dvh] overflow-hidden transition-colors duration-300">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            {/* Main Wrapper */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                <Header toggleSidebar={() => setIsSidebarOpen(true)} />
                
                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto pt-8 pb-24 lg:pb-8">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation */}
                <div className="lg:hidden fixed bottom-0 start-0 end-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around h-16 pointer-events-auto shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-none transition-colors duration-300">
                    <a href="#" className="flex flex-col items-center gap-1 text-orange-600 w-16">
                        <Home size={22} className="mb-0.5" />
                        <span className="text-[10px] font-bold">الرئيسية</span>
                    </a>
                    <a href="#" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 w-16 transition-colors">
                        <CheckSquare size={22} className="mb-0.5" />
                        <span className="text-[10px] font-medium">المهام</span>
                    </a>
                    <a href="#" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 w-16 relative transition-colors">
                        <div className="relative">
                            <Bell size={22} className="mb-0.5" />
                            <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white dark:border-gray-900"></span>
                        </div>
                        <span className="text-[10px] font-medium">الإشعارات</span>
                    </a>
                    <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 w-16 transition-colors">
                        <Menu size={22} className="mb-0.5" />
                        <span className="text-[10px] font-medium">المزيد</span>
                    </button>
                </div>
            </div>
        </div>
    )
}