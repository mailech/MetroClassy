import { motion } from 'framer-motion';
import { FiBell, FiSearch, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 z-30">
      <div className={`h-20 px-8 flex items-center justify-between backdrop-blur-2xl transition-colors duration-400 ${
        theme === 'dark'
          ? 'bg-white/5 border-b border-white/10'
          : 'bg-white/70 border-b border-gray-200/50'
      }`}>
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative group"
          >
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-400 ${
              theme === 'dark'
                ? 'text-white/40 group-focus-within:text-white/70'
                : 'text-gray-400 group-focus-within:text-gray-600'
            }`} />
            <input
              type="text"
              placeholder="Search insights, products or customers..."
              className={`w-full pl-11 pr-4 py-2.5 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/50'
                  : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/30'
              }`}
            />
          </motion.div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                  : 'bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <FiSun className="text-lg" />
              ) : (
                <FiMoon className="text-lg" />
              )}
            </button>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="relative">
            <button className={`p-2.5 rounded-full transition-colors ${
              theme === 'dark'
                ? 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                : 'bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200'
            }`}>
              <FiBell className="text-lg" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            </button>
          </motion.div>

          <motion.div whileHover={{ y: -2 }}>
            <button className={`flex items-center space-x-3 px-4 py-2 rounded-full transition-all duration-400 border ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-primary-600/70 to-purple-600/70 text-white shadow-[0_20px_40px_rgba(14,165,233,0.35)] border-white/10'
                : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-[0_20px_40px_rgba(14,165,233,0.2)] border-primary-300/30'
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur ${
                theme === 'dark' ? 'bg-white/10' : 'bg-white/20'
              }`}>
                <FiUser className="text-white text-lg" />
              </div>
              <div className="text-left">
                <p className={`text-xs uppercase tracking-wider ${
                  theme === 'dark' ? 'text-white/60' : 'text-white/80'
                }`}>Welcome</p>
                <p className="text-sm font-semibold">
                  {user?.name && user.name.trim() !== '' ? user.name : (user?.email?.split('@')[0] || 'Admin')}
                </p>
              </div>
            </button>
          </motion.div>
        </div>
      </div>
    </header>
  );
}

