import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  FiMenu, FiX, FiShoppingCart, FiSun, FiMoon, FiSearch, FiHeart,
  FiHome, FiGrid, FiUser, FiLogOut
} from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import logoLight from '../../assets/logo-light-mode.png';
import logoDark from '../../assets/logo-dark-mode.png';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Primary Navigation (Text + Icon)
  const navLinks = [
    { name: 'Home', path: '/', icon: FiHome },
    { name: 'Products', path: '/products', icon: FiGrid },
  ];

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishCount = wishlist.length;
  const currentLogo = theme === 'light' ? logoLight : logoDark;

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(`/products?q=${encodeURIComponent(search.trim())}`);
      setIsOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 border-b ${isOpen
        ? (theme === 'dark' ? 'bg-[#0b0d1a] border-white/5' : 'bg-white border-gray-200')
        : (theme === 'dark'
          ? 'bg-[#0b0d1a]/80 backdrop-blur-xl border-white/5 shadow-lg shadow-black/20'
          : 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-sm')
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-3 group" aria-label="Go home">
              <motion.img
                src={currentLogo}
                alt="MetroClassy"
                className="h-10 w-auto object-contain drop-shadow-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
            </Link>
          </div>

          {/* Center Navigation (Desktop) */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${isActive
                    ? (theme === 'dark' ? 'text-white' : 'text-gray-900')
                    : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                  <span>{link.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className={`absolute -bottom-8 left-0 right-0 h-0.5 ${theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-5">
            {/* Search Bar */}
            <div className="relative group">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search..."
                className={`w-32 focus:w-48 transition-all duration-300 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none ${theme === 'dark'
                  ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-indigo-500/50'
                  : 'bg-gray-100 border border-transparent text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-200'
                  }`}
              />
              <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-2 border-l border-r border-gray-200/50 dark:border-white/10 px-4 mx-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-yellow-300 hover:bg-white/5' : 'text-gray-400 hover:text-orange-500 hover:bg-gray-100'}`}
              >
                {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
              </button>

              <Link to="/wishlist" className={`p-2 rounded-full relative transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-pink-400 hover:bg-white/5' : 'text-gray-400 hover:text-pink-600 hover:bg-gray-100'}`}>
                <FiHeart className="w-5 h-5" />
                {wishCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-white dark:ring-[#0b0d1a]" />
                )}
              </Link>

              <Link to="/cart" className={`p-2 rounded-full relative transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-indigo-400 hover:bg-white/5' : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'}`}>
                <FiShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-indigo-600 rounded-full ring-2 ring-white dark:ring-[#0b0d1a]">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Profile */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="flex items-center gap-2 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                    {user.name?.charAt(0) || 'U'}
                  </div>
                </Link>
              </div>
            ) : (
              <Link to="/login" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <Link to="/cart" className="relative text-gray-400 hover:text-indigo-500">
              <FiShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <motion.div
        initial={{ opacity: 0, y: -10, pointerEvents: 'none' }}
        animate={{
          opacity: isOpen ? 1 : 0,
          y: isOpen ? 0 : -10,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`fixed inset-0 z-49 md:hidden pt-24 px-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#000000]' : 'bg-[#ffffff]'
          }`}
      >
        <div className="px-4 py-6 space-y-6 h-full flex flex-col">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search products..."
              className={`w-full rounded-2xl py-4 pl-12 pr-4 text-base shadow-sm ${theme === 'dark'
                ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500'
                : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
            />
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${theme === 'dark' ? 'active:bg-white/10 text-gray-200' : 'active:bg-gray-100 text-gray-800'
                  }`}
              >
                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-indigo-50 text-indigo-600'}`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-lg">{link.name}</span>
              </Link>
            ))}
            <Link
              to="/wishlist"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${theme === 'dark' ? 'active:bg-white/10 text-gray-200' : 'active:bg-gray-100 text-gray-800'
                }`}
            >
              <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-pink-50 text-pink-500'}`}>
                <FiHeart className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg">Wishlist</span>
              {wishCount > 0 && <span className="ml-auto text-sm font-bold bg-pink-500 text-white px-2.5 py-0.5 rounded-full">{wishCount}</span>}
            </Link>
          </div>

          <div className="mt-auto pb-8 space-y-4">
            <div className={`p-4 rounded-3xl ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Settings</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${theme === 'dark' ? 'bg-black/20 text-gray-300' : 'bg-white text-gray-700 shadow-sm'
                  }`}
              >
                <span className="flex items-center gap-3">
                  {theme === 'light' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </span>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${theme === 'dark' ? 'left-5' : 'left-1'}`} />
                </div>
              </button>
            </div>

            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
              >
                My Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;
