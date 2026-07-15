import { useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Scale, Bell, Menu, CheckSquare } from "lucide-react";

export default function Mainlayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="flex bg-gray-50/50 dark:bg-gray-950 h-[100dvh] overflow-hidden text-right transition-colors duration-300">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            {/* Main Wrapper */}
            <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header toggleSidebar={() => setIsSidebarOpen(true)} />
                
                {/* Scrollable Content */}
                <main className="flex-1 pt-8 pb-24 lg:pb-8 overflow-y-auto">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation */}
                <div className="lg:hidden bottom-0 z-40 fixed flex justify-around items-center bg-white dark:bg-gray-900 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-none border-gray-100 dark:border-gray-800 border-t h-16 transition-colors duration-300 pointer-events-auto start-0 end-0">
                    <Link to="/" className={`flex flex-col items-center gap-1 w-16 transition-colors ${location.pathname === '/' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 dark:text-gray-500'}`}>
                        <Home size={22} className="mb-0.5" />
                        <span className={`text-[10px] ${location.pathname === '/' ? 'font-bold' : 'font-medium'}`}>الرئيسية</span>
                    </Link>
                    <Link to="/cases" className={`flex flex-col items-center gap-1 w-16 transition-colors ${location.pathname.startsWith('/cases') ? 'text-orange-600' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 dark:text-gray-500'}`}>
                        <Scale size={22} className="mb-0.5" />
                        <span className={`text-[10px] ${location.pathname.startsWith('/cases') ? 'font-bold' : 'font-medium'}`}>القضايا</span>
                    </Link>
                    <Link to="/tasks" className={`flex flex-col items-center gap-1 w-16 transition-colors ${location.pathname.startsWith('/tasks') ? 'text-orange-600' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 dark:text-gray-500'}`}>
                        <CheckSquare size={22} className="mb-0.5" />
                        <span className={`text-[10px] ${location.pathname.startsWith('/tasks') ? 'font-bold' : 'font-medium'}`}>المهام</span>
                    </Link>
                    <Link to="#" className="relative flex flex-col items-center gap-1 w-16 text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 dark:text-gray-500 transition-colors">
                        <div className="relative">
                            <Bell size={22} className="mb-0.5" />
                            <span className="-top-0.5 absolute bg-orange-500 border-2 border-white dark:border-gray-900 rounded-full w-2.5 h-2.5 -end-0.5"></span>
                        </div>
                        <span className="font-medium text-[10px]">الإشعارات</span>
                    </Link>
                    <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-1 w-16 text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 dark:text-gray-500 transition-colors">
                        <Menu size={22} className="mb-0.5" />
                        <span className="font-medium text-[10px]">المزيد</span>
                    </button>
                </div>
            </div>
        </div>
    )
}