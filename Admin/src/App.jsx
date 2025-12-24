import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Notification from './components/Notification';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductEdit from './pages/ProductEdit';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import DiscountWheel from './pages/DiscountWheel';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';
import ErrorBoundary from './components/ErrorBoundary';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

// Add axios interceptor to include token in all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or unauthorized
      localStorage.removeItem('admin_token');
      delete axios.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function AppContent() {
  useEffect(() => {
    const handlePointerMove = (event) => {
      const { clientX, clientY } = event;
      document.documentElement.style.setProperty('--pointer-x', `${clientX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${clientY}px`);
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin/*"
          element={
            <div className="admin-shell">
              <div className="ambient-gradient" aria-hidden="true" />
              <div className="orb orb-1" aria-hidden="true" />
              <div className="orb orb-2" aria-hidden="true" />
              <div className="orb orb-3" aria-hidden="true" />

              <div className="admin-shell__content">
                <Sidebar />
                <div className="admin-shell__main">
                  <Header />
                  <main className="admin-main">
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/products"
                        element={
                          <ProtectedRoute>
                            <Products />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/products/new"
                        element={
                          <ProtectedRoute>
                            <ProductEdit />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/products/edit/:id"
                        element={
                          <ProtectedRoute>
                            <ProductEdit />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/categories"
                        element={
                          <ProtectedRoute>
                            <Categories />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute>
                            <Orders />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/discount-wheel"
                        element={
                          <ProtectedRoute>
                            <DiscountWheel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute>
                            <Analytics />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/audit-logs"
                        element={
                          <ProtectedRoute>
                            <AuditLogs />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/users"
                        element={
                          <ProtectedRoute>
                            <Users />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </main>
                </div>
                <Notification />
              </div>
            </div>
          }
        />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
