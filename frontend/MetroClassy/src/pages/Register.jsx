import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GoogleLoginBtn from '../components/auth/GoogleLoginBtn';
import axios from 'axios';
import { FiUpload, FiSmartphone, FiCheck } from 'react-icons/fi';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  // Google Auth State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [profileData, setProfileData] = useState({ mobile: '', photo: null, photoPreview: null });

  const { register, socialLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setStatus('loading');

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      const notification = new CustomEvent('show-notification', {
        detail: { message: 'Welcome to MetroClassy', type: 'success' },
      });
      window.dispatchEvent(notification);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create account');
    } finally {
      setStatus('idle');
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setStatus('loading');
      // Fetch user info from Backend Proxy (bypasses browser CORS/Network blockers)
      // Note: We use the configured axios instance which points to our backend
      const { data } = await axios.post('/auth/google-info', {
        token: tokenResponse.access_token
      });

      setGoogleUser(data);
      setStatus('idle');
      setShowProfileModal(true);
    } catch (err) {
      console.error("Google Auth Error", err);
      // Detailed error for debugging
      const errMsg = err?.response?.data?.error_description || err?.message || "Failed to authenticate with Google";
      setError("GOOGLE: " + errMsg);
      setStatus('idle');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const finalUser = {
      name: googleUser.name,
      email: googleUser.email,
      picture: profileData.photoPreview || googleUser.picture,
      mobile: profileData.mobile,
      googleId: googleUser.sub
    };

    try {
      await socialLogin(finalUser);
      setShowProfileModal(false);
      const notification = new CustomEvent('show-notification', {
        detail: { message: `Welcome, ${finalUser.name}!`, type: 'success' },
      });
      window.dispatchEvent(notification);
      navigate('/dashboard');
    } catch (err) {
      setError("BACKEND: " + (err?.response?.data?.message || 'Google signup failed'));
      setShowProfileModal(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, photo: file, photoPreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-white dark:bg-slate-900 dark:border dark:border-white/10 p-8 shadow-xl"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400 dark:text-gray-500">Create account</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Register for MetroClassy</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Secure sign-up stores your session in an HttpOnly cookie for safer browsing.
          </p>

          <div className="mt-8">
            <GoogleLoginBtn
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
            />
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">Or register with email</span>
            </div>
          </div>

          <form className="mt-8 grid gap-6 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">Full name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-3 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-800 dark:text-white"
                placeholder="MetroClassy Patron"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-3 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-800 dark:text-white"
                placeholder="studio@metroclassy.com"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-3 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-800 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">Confirm</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-3 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-800 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="sm:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-full bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-70"
              >
                {status === 'loading' ? 'Creating...' : 'Create account'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Already a patron?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Complete Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/10"
            >
              <h2 className="text-2xl font-bold mb-2 dark:text-white">Complete Profile</h2>
              <p className="text-gray-500 text-sm mb-6">Just one more step to finish setting up your account.</p>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 ring-4 ring-white dark:ring-slate-800 shadow-lg">
                    <img
                      src={profileData.photoPreview || googleUser?.picture || 'https://via.placeholder.com/150'}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white">
                      <FiUpload size={20} />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <span className="text-xs text-indigo-500 font-medium cursor-pointer hover:underline">
                    <label className="cursor-pointer">
                      Change Photo
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </span>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiSmartphone />
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={profileData.mobile}
                      onChange={(e) => setProfileData(prev => ({ ...prev, mobile: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Preserver Google Name */}
                <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg flex items-center gap-3">
                  <img src={googleUser?.picture} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-medium dark:text-white">{googleUser?.name}</p>
                    <p className="text-xs text-gray-500">{googleUser?.email}</p>
                  </div>
                  <FiCheck className="ml-auto text-green-500" />
                </div>

                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                  Complete Setup
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;

