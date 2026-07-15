import { Home, Settings, LogOut, Menu, Users, Scale } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { profile, logout } = useAuthStore();
  const location = useLocation();

  const menuItems = [
    { name: 'لوحة القيادة', icon: <Home size={20} />, path: '/', active: location.pathname === '/', badge: '' },
    { name: 'القضايا', icon: <Scale size={20} />, path: '/cases', active: location.pathname.startsWith('/cases'), badge: '' },
  ];

  // أضف قائمة الإدارة إذا كان المستخدم أدمن
  if (profile?.role === 'admin') {
    menuItems.push({
      name: 'الفريق',
      icon: <Users size={20} />,
      path: '/admin/requests',
      active: location.pathname === '/admin/requests',
      badge: ''
    });
  }

  const generalItems = [
    { name: 'الإعدادات', icon: <Settings size={20} />, path: '#' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden z-40 fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed top-0 bottom-0 start-0 z-50 w-64 shrink-0 bg-white dark:bg-gray-900 border-e border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:static'}`}>

        {/* Logo Area */}
        <div className="flex items-center gap-3 px-6 border-gray-50/50 dark:border-gray-800 border-b h-20 transition-colors duration-300 shrink-0">
          <div className="flex justify-center items-center bg-gradient-to-br from-orange-100 dark:from-orange-500/20 to-orange-200 dark:to-orange-500/40 shadow-sm border border-orange-300/50 dark:border-orange-500/50 rounded-[14px] hover:scale-105 transition-all shrink-0">
            <img src="/pwa-icon.png" alt="Logo" className="drop-shadow-md w-14 h-13 object-contain" />
          </div>
          <button className="lg:hidden ms-auto outline-none focus:outline-none focus:ring-0 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 shrink-0" onClick={() => setIsOpen(false)}>
            <Menu size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col flex-1 gap-8 px-4 py-6 overflow-y-auto custom-scrollbar">

          {/* Main Menu */}
          <div>
            <p className="mb-3 px-3 font-semibold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">القائمة الرئيسية</p>
            <ul className="space-y-1">
              {menuItems.map((item, idx) => (
                <li key={idx}>
                  <Link onClick={() => setIsOpen(false)} to={item.path} className={`outline-none focus:outline-none focus:ring-0 [-webkit-tap-highlight-color:transparent] flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${item.active ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 font-semibold shadow-sm border border-orange-100/50 dark:border-orange-500/20' : 'border border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                    <span className={`shrink-0 ${item.active ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span className="bg-green-100 dark:bg-green-900/30 ms-auto px-2 py-0.5 border border-green-200 dark:border-green-800/50 rounded-md font-bold text-[10px] text-green-700 dark:text-green-400 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* General Menu */}
          <div>
            <p className="mb-3 px-3 font-semibold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">عام</p>
            <ul className="space-y-1">
              {generalItems.map((item, idx) => (
                <li key={idx}>
                  <Link onClick={() => setIsOpen(false)} to={item.path} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-3 py-2.5 rounded-xl outline-none focus:outline-none focus:ring-0 [-webkit-tap-highlight-color:transparent] border border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 dark:text-gray-400 transition-colors">
                    <span className="text-gray-400 dark:text-gray-500 shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              ))}
              <li>
                <button onClick={logout} className="flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2.5 rounded-xl outline-none focus:outline-none focus:ring-0 [-webkit-tap-highlight-color:transparent] border border-transparent w-full text-red-500 dark:text-red-400 transition-colors">
                  <span className="shrink-0"><LogOut size={20} /></span>
                  <span className="truncate">تسجيل الخروج</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

      </aside>
    </>
  );
}
