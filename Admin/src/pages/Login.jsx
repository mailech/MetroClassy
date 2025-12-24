import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import brandLogoDark from '../assets/metroclassy-logo.png';
import brandLogoLight from '../assets/metroclassy-logo-light.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const brandLogo = theme === 'dark' ? brandLogoDark : brandLogoLight;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate name
    if (!name || name.trim() === '') {
      setError('Name is required. Please enter your name.');
      return;
    }
    
    setLoading(true);

    const result = await login(email, password, name.trim());
    
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-card max-w-md w-full mx-4"
      >
        <div className="text-center mb-8">
          <img
            src={brandLogo}
            alt="MetroClassy"
            className="w-32 mx-auto mb-4"
            style={theme === 'light' ? { filter: 'brightness(0) saturate(100%)' } : {}}
          />
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Admin Login
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Sign in to access the admin panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="admin-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="admin-input"
              placeholder="admin@metroclassy.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="admin-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="admin-input"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="name" className="admin-label">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="admin-input"
              placeholder="Enter your full name"
              autoComplete="name"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              This name will be displayed in the header and recorded in audit logs
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-button-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <p>Enter your email, password, and name to login</p>
        </div>
      </motion.div>
    </div>
  );
}

