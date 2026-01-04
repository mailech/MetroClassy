import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from '@studio-freight/lenis';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import axios from 'axios';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const ActionSearchBarDemo = lazy(() => import('./pages/ActionSearchDemo'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
import { CartProvider } from './context/CartContext';

import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import Notification from './components/Notification';
import IntroOverlay from './components/IntroOverlay';
// import ShaderBackground from './components/ui/ShaderBackground';
import swirlLogo from './assets/logo-watermark.png';
import heroDark from './assets/hero-dark.png';
import './App.css';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

// Set default axios base URL
axios.defaults.baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';
axios.defaults.withCredentials = true;

// Add a request interceptor to include auth token if available
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // legacy admin token; shopper uses HttpOnly cookie
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-t-indigo-500 border-r-indigo-500 border-b-indigo-700 border-l-indigo-700 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return children;
}

function App() {
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const animationRef = useRef(null);
  const { theme } = useTheme();
  const watermarkFilter = theme === 'light' ? 'invert(1)' : 'none';
  const brandWatermark = theme === 'dark' ? heroDark : swirlLogo;

  useEffect(() => {
    // Handle notifications from anywhere in the app
    const handleNotification = (event) => {
      const { message, type = 'info' } = event.detail;
      setNotification({ message, type });
      setShowNotification(true);

      // Auto-hide notification after 3 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('show-notification', handleNotification);

    // Simulate initial loading
    // Simulate initial loading - Reduced to near zero for smoothness
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 50);

    return () => {
      window.removeEventListener('show-notification', handleNotification);
      clearTimeout(loadingTimer);
    };
    // Initialize configured theme
    // (Optional: Add lightweight global listeners here if strictly necessary)
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-t-blue-500 border-r-blue-500 border-b-blue-700 border-l-blue-700 rounded-full"
        />
      </div>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <div className={`app-shell theme-${theme}`}>
              <div className="dynamic-backdrop" aria-hidden="true" />
              <div
                className="brand-watermark"
                style={{ backgroundImage: `url(${brandWatermark})`, filter: watermarkFilter }}
                aria-hidden="true"
              />
              <div className="relative z-10 flex flex-col min-h-screen">
                {/* ShaderBackground removed for performance */}
                <IntroOverlay />
                <Navbar />
                <main className="flex-grow bg-transparent pt-20">
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[50vh]">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full"
                      />
                    </div>
                  }>
                    <AnimatePresence mode="wait">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/product/:id" element={<ProductDetails />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/action-search" element={<ActionSearchBarDemo />} />
                        <Route path="/order-success" element={<OrderSuccess />} />
                      </Routes>
                    </AnimatePresence>
                  </Suspense>
                </main>
                <Footer />

                {/* Global Notification */}
                <AnimatePresence>
                  {showNotification && (
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === 'error'
                        ? 'bg-red-100 text-red-800'
                        : notification.type === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                        }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">
                          {notification.type === 'error' ? '❌' : notification.type === 'success' ? '✅' : 'ℹ️'}
                        </span>
                        <span>{notification.message}</span>
                        <button
                          onClick={() => setShowNotification(false)}
                          className="ml-4 text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
