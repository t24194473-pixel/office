import { Search, Bell, Settings, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useAuthStore } from '../../store/authStore';

export default function Header() {
  const { isDark, toggleTheme } = useDarkMode();
  const { profile } = useAuthStore();

  return (
    <header className="h-16 sm:h-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex flex-col justify-center px-4 sm:px-6 sticky top-0 z-30 transition-colors duration-300">

      {/* --- Desktop View (Hidden on Mobile) --- */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">

        </div>

        {/* Action Icons & Profile */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              <Settings size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2.5 inset-e-2.5 w-2 h-2 rounded-full bg-orange-500 border-2 border-white dark:border-gray-800"></span>
            </button>
          </div>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 transition-colors"></div>

          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-end">
              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{profile?.name || 'مستخدم'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.email || 'email@example.com'}</p>
            </div>
            <img
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.name || 'User'}&backgroundColor=fbd38d`}
              alt="Profile Avatar"
              className="w-11 h-11 rounded-full object-cover border-2 border-orange-100 dark:border-gray-700 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* --- Mobile View (Hidden on Desktop) --- */}
      <div className="flex sm:hidden items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <img
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.name || 'User'}&backgroundColor=fbd38d`}
            alt="Profile Avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-orange-100 dark:border-gray-700 shadow-sm"
          />
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">مرحباً بعودتك 👋</p>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{profile?.name || 'مستخدم'}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="w-9 h-9 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <Search size={16} />
          </button>
        </div>
      </div>

    </header>
  )
}