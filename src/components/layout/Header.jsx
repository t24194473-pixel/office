import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useAuthStore } from '../../store/authStore';

export default function Header() {
  const { isDark, toggleTheme } = useDarkMode();
  const { profile } = useAuthStore();

  return (
    <header className="top-0 z-30 sticky flex flex-col justify-center bg-white dark:bg-gray-900 px-4 sm:px-6 border-gray-100 dark:border-gray-800 border-b h-16 sm:h-20 transition-colors duration-300">

      {/* --- Desktop View (Hidden on Mobile) --- */}
      <div className="hidden sm:flex justify-between items-center w-full">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">

        </div>

        {/* Action Icons & Profile */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="flex justify-center items-center bg-gray-50 hover:bg-orange-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 rounded-full w-10 h-10 text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 dark:text-gray-400 transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="relative flex justify-center items-center bg-gray-50 hover:bg-orange-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 rounded-full w-10 h-10 text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 dark:text-gray-400 transition-colors">
              <Bell size={18} />
              <span className="top-2.5 absolute inset-e-2.5 bg-orange-500 border-2 border-white dark:border-gray-800 rounded-full w-2 h-2"></span>
            </button>
          </div>

          <div className="bg-gray-200 dark:bg-gray-700 w-px h-8 transition-colors"></div>

          <div className="group flex items-center gap-3 cursor-pointer">
            <div className="text-end">
              <p className="font-semibold text-gray-900 dark:group-hover:text-orange-400 dark:text-white group-hover:text-orange-600 text-sm transition-colors">{profile?.name || 'مستخدم'}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">{profile?.email || 'email@example.com'}</p>
            </div>
            <img
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.name || 'User'}&backgroundColor=fbd38d`}
              alt="Profile Avatar"
              className="shadow-sm border-2 border-orange-100 dark:border-gray-700 rounded-full w-11 h-11 object-cover"
            />
          </div>
        </div>
      </div>

      {/* --- Mobile View (Hidden on Desktop) --- */}
      <div className="sm:hidden flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <img
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.name || 'User'}&backgroundColor=fbd38d`}
            alt="Profile Avatar"
            className="shadow-sm border-2 border-orange-100 dark:border-gray-700 rounded-full w-10 h-10 object-cover"
          />
          <div>
            <p className="mb-0.5 text-[10px] text-gray-500 dark:text-gray-400">مرحباً بعودتك 👋</p>
            <h2 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{profile?.name || 'مستخدم'}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="flex justify-center items-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full w-9 h-9 text-gray-600 dark:text-gray-400">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="flex justify-center items-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full w-9 h-9 text-gray-600 dark:text-gray-400">
            <Search size={16} />
          </button>
        </div>
      </div>

    </header>
  )
}