import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiHome,
  FiPackage,
  FiGift,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiShoppingBag,
  FiFileText,
  FiUser,
} from 'react-icons/fi';
import brandLogoDark from '../../assets/metroclassy-logo.png';
import brandLogoLight from '../../assets/metroclassy-logo-light.png';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: FiHome, description: 'Overview & statistics' },
  { path: '/admin/products', label: 'Products', icon: FiPackage, description: 'Manage inventory' },
  { path: '/admin/categories', label: 'Categories', icon: FiSettings, description: 'Organize products' },
  { path: '/admin/orders', label: 'Orders', icon: FiShoppingBag, description: 'Track shipments' },
  { path: '/admin/discount-wheel', label: 'Discount Wheel', icon: FiGift, description: 'Configure rewards' },
  { path: '/admin/analytics', label: 'Analytics', icon: FiBarChart2, description: 'View reports' },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: FiFileText, description: 'Activity history' },
  { path: '/admin/users', label: 'Users', icon: FiUser, description: 'Manage accounts' },
];

export default function Sidebar() {
  const location = useLocation();
  const { theme } = useTheme();
  const { logout } = useAuth();
  const brandLogo = theme === 'dark' ? brandLogoDark : brandLogoLight;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-40">
      <div className={`h-full flex flex-col backdrop-blur-3xl transition-colors duration-400 ${theme === 'dark'
        ? 'bg-white/5 border-r border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]'
        : 'bg-white/80 border-r border-gray-200/50 shadow-[0_20px_60px_rgba(0,0,0,0.08)]'
        }`}>
        {/* Logo */}
        <div className={`px-6 pt-8 pb-6 border-b transition-colors duration-400 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200/50'
          }`}>
          <Link to="/admin" className="flex items-center justify-center mb-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative cursor-pointer ${theme === 'light' ? 'p-2 rounded-lg bg-gray-100' : ''}`}
            >
              <motion.img
                key={theme}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={brandLogo}
                alt="MetroClassy logo"
                className={`w-40 transition-all duration-300 ${theme === 'dark'
                  ? 'drop-shadow-[0_10px_30px_rgba(14,165,233,0.35)]'
                  : 'drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]'
                  }`}
                style={
                  theme === 'light'
                    ? {
                      filter: 'brightness(0) saturate(100%)',
                    }
                    : {}
                }
              />
            </motion.div>
          </Link>
          <p className={`text-center text-xs uppercase tracking-[0.4em] transition-colors duration-400 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'
            }`}>
            Crafted for comfort
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 6, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`
                    flex items-center px-4 py-3 rounded-xl transition-all duration-200
                    ${theme === 'dark'
                      ? isActive
                        ? 'bg-white/15 text-white shadow-[0_10px_30px_rgba(59,130,246,0.25)] border border-white/20'
                        : 'text-white/70 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5'
                      : isActive
                        ? 'bg-primary-50 text-primary-700 shadow-[0_10px_30px_rgba(14,165,233,0.15)] border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="mr-3 text-xl" />
                  <div>
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className={`text-[11px] transition-colors duration-400 ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'
                      }`}>
                      {item.description || (isActive ? 'Currently viewing' : 'Click to open')}
                    </span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t px-4 py-5 transition-colors duration-400 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200/50'
          }`}>
          <button
            onClick={logout}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-400 border border-transparent ${theme === 'dark'
              ? 'text-white/70 hover:text-white hover:bg-white/5 hover:border-white/15'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-200'
              }`}
          >
            <FiLogOut className="mr-3 text-lg" />
            <span>Logout</span>
          </button>
          <div className={`mt-4 text-[11px] uppercase tracking-[0.3em] transition-colors duration-400 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'
            }`}>
            MetroClassy Admin
          </div>
        </div>
      </div>
    </aside>
  );
}

