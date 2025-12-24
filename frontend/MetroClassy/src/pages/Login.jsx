import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DiscountWheel from '../components/DiscountWheel';
import { useAuth } from '../context/AuthContext';
import GoogleLoginBtn from '../components/auth/GoogleLoginBtn';
import axios from 'axios';
import { FiUpload, FiUser, FiSmartphone, FiCheck } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  // Mobile Auth State
  const [isMobileLogin, setIsMobileLogin] = useState(false);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Google Auth State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [profileData, setProfileData] = useState({ mobile: '', photo: null, photoPreview: null });

  const { login, socialLogin, refresh } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    setStatus('loading');
    setError('');
    try {
      await axios.post('/auth/send-otp', { mobile });
      setOtpSent(true);
      dispatchSuccess('OTP sent successfully!');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setStatus('idle');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      // Verify and get user (cookie is set by backend)
      const { data } = await axios.post('/auth/verify-otp', { mobile, otp });

      // Refresh auth context to get the user from /auth/me using the new cookie
      await refresh();

      dispatchSuccess(`Welcome back, ${data.user.name || 'User'}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setStatus('idle');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await login(formData);
      dispatchSuccess('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to sign in');
    } finally {
      setStatus('idle');
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setStatus('loading');
      // Fetch user info from Backend Proxy (bypasses browser CORS/Network blockers)
      const { data } = await axios.post('/auth/google-info', {
        token: tokenResponse.access_token
      });

      setGoogleUser(data);
      setStatus('idle');
      // Open Modal to collect extra info
      setShowProfileModal(true);
    } catch (err) {
      console.error("Google Auth Error", err);
      // Detailed error for debugging
      const errMsg = err?.response?.data?.error_description || err?.message || "Failed to authenticate with Google";
      setError(errMsg);
      setStatus('idle');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    // Combine Data
    const finalUser = {
      name: googleUser.name,
      email: googleUser.email,
      picture: profileData.photoPreview || googleUser.picture, // Use uploaded or google
      mobile: profileData.mobile,
      googleId: googleUser.sub
    };

    await socialLogin(finalUser);
    setShowProfileModal(false);
    dispatchSuccess(`Welcome, ${finalUser.name}!`);
    navigate('/dashboard');
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

  const dispatchSuccess = (msg) => {
    window.dispatchEvent(new CustomEvent('show-notification', {
      detail: { message: msg, type: 'success' },
    }));
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen py-16 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-2">
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl dark:border dark:border-white/10 relative z-10">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400 dark:text-gray-500">User Panel</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Sign in to continue</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
            Access your orders, wishlist, and recommendations.
          </p>

          <GoogleLoginBtn
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
          />

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={isMobileLogin ? handleVerifyOtp : handleSubmit}>
            {!isMobileLogin ? (
              <>
                <div>
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
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">Mobile Number</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      name="mobile"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-3 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-800 dark:text-white"
                      placeholder="+91 9876543210"
                      disabled={otpSent}
                    />
                    {!otpSent && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={status === 'loading'}
                        className="mt-2 px-6 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Get OTP
                      </button>
                    )}
                  </div>
                </div>
                {otpSent && (
                  <div>
                    <label className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">Enter OTP</label>
                    <input
                      type="text"
                      name="otp"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-3 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-800 dark:text-white tracking-widest text-center text-lg"
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>
                )}
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-full bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-70 transition-transform active:scale-95"
            >
              {status === 'loading' ? 'Processing...' : (isMobileLogin ? 'Verify & Login' : 'Sign in')}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileLogin(!isMobileLogin)}
              className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
            >
              {isMobileLogin ? 'Login with Email' : 'Login with Mobile Number'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            First time?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold">
              Register here
            </Link>
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-1 shadow-2xl"
        >
          <div className="h-full rounded-[calc(1.5rem-4px)] bg-black/40 p-6">
            <DiscountWheel />
          </div>
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

export default Login;
