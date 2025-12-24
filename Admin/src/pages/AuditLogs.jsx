import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEye, FiFilter, FiX, FiInfo, FiLock, FiMapPin, FiLoader } from 'react-icons/fi';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const auditLogsApi = {
  getAll: async (params = {}) => {
    const response = await axios.get('/admin/audit-logs', { params });
    return response.data;
  },
};

// Password for accessing Audit Logs (change this to your desired password)
const AUDIT_LOGS_PASSWORD = 'admin@audit2024';

export default function AuditLogs() {
  const { theme } = useTheme();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  // Always start locked - do NOT persist authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [ipLocation, setIpLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedIp, setSelectedIp] = useState(null);

  // Reset authentication when component mounts (page is visited)
  useEffect(() => {
    // When component mounts, always reset to locked state
    setIsAuthenticated(false);
    setPassword('');
    setPasswordError('');
    setIpLocation(null);
    setSelectedIp(null);
    setSelectedLog(null);

    // Cleanup when component unmounts (user navigates away)
    return () => {
      setIsAuthenticated(false);
      setPassword('');
      setPasswordError('');
    };
  }, []); // Empty array = only run on mount/unmount

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter, resourceFilter, searchTerm],
    queryFn: () =>
      auditLogsApi.getAll({
        page,
        limit: 50,
        actionType: actionFilter || undefined,
        resourceType: resourceFilter || undefined,
        adminUser: searchTerm || undefined,
      }),
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  const getActionColor = (action) => {
    const isDark = theme === 'dark';

    switch (action) {
      case 'CREATE':
        return isDark
          ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }
          : { backgroundColor: '#dcfce7', color: '#166534' };
      case 'UPDATE':
        return isDark
          ? { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }
          : { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'DELETE':
        return isDark
          ? { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }
          : { backgroundColor: '#fee2e2', color: '#991b1b' };
      case 'VIEW':
        return isDark
          ? { backgroundColor: 'rgba(156, 163, 175, 0.2)', color: '#d1d5db', border: '1px solid rgba(156, 163, 175, 0.3)' }
          : { backgroundColor: '#f3f4f6', color: '#374151' };
      case 'LOGIN':
        return isDark
          ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }
          : { backgroundColor: '#dcfce7', color: '#166534' };
      case 'LOGIN_FAILED':
        return isDark
          ? { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }
          : { backgroundColor: '#fee2e2', color: '#991b1b' };
      case 'LOGOUT':
        return isDark
          ? { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }
          : { backgroundColor: '#f3e8ff', color: '#6b21a8' };
      case 'STATUS_CHANGE':
        return isDark
          ? { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)' }
          : { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'UPLOAD':
        return isDark
          ? { backgroundColor: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.3)' }
          : { backgroundColor: '#e0f2fe', color: '#0c4a6e' };
      default:
        return isDark
          ? { backgroundColor: 'rgba(156, 163, 175, 0.2)', color: '#d1d5db', border: '1px solid rgba(156, 163, 175, 0.3)' }
          : { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatResourceId = (id) => {
    if (!id) return 'N/A';
    if (typeof id !== 'string') id = String(id);
    // Show last 12 characters for better readability, or full if shorter
    return id.length > 12 ? '...' + id.slice(-12) : id;
  };

  const getFullResourceId = (id) => {
    if (!id) return 'N/A';
    return String(id);
  };

  const formatIpAddress = (ip) => {
    if (!ip || ip === 'Unknown') return 'Unknown';
    // Handle localhost addresses
    if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
      return 'Localhost';
    }
    return ip;
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (password === AUDIT_LOGS_PASSWORD) {
      setIsAuthenticated(true);
      // Do NOT save to sessionStorage - lock should persist only while on page
      setPassword('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const fetchIpLocation = async (ip) => {
    // Skip location lookup for localhost
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1' || ip === 'Unknown') {
      setIpLocation({ error: 'Location lookup not available for localhost addresses' });
      return;
    }

    setLoadingLocation(true);
    setSelectedIp(ip);

    try {
      // Using ip-api.com (free, no API key required)
      const response = await axios.get(`http://ip-api.com/json/${ip}`, {
        timeout: 5000,
      });

      if (response.data.status === 'success') {
        setIpLocation({
          ip: response.data.query,
          country: response.data.country,
          region: response.data.regionName,
          city: response.data.city,
          zip: response.data.zip,
          lat: response.data.lat,
          lon: response.data.lon,
          isp: response.data.isp,
          org: response.data.org,
        });
      } else {
        setIpLocation({ error: 'Location information not available' });
      }
    } catch (error) {
      setIpLocation({ error: 'Failed to fetch location information' });
    } finally {
      setLoadingLocation(false);
    }
  };

  // Password protection gate
  if (!isAuthenticated) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="admin-card max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <FiLock className="text-3xl" style={{ color: 'var(--primary-600)' }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Audit Logs Protected
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter the password to access audit logs and view all admin activities
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {passwordError}
              </div>
            )}

            <div>
              <label htmlFor="audit-password" className="admin-label">
                Password
              </label>
              <input
                id="audit-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                required
                className="admin-input"
                placeholder="Enter audit logs password"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="admin-button-primary w-full"
            >
              Unlock Audit Logs
            </button>
          </form>

          <div className="mt-6 p-4 rounded-lg text-xs" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>🔒 Security Note:</strong> Audit logs contain sensitive information about all admin actions.
              This password protection ensures only authorized personnel can access this section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Audit Logs
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Track all admin actions and changes in the system
        </p>
      </div>

      {/* Info Card */}
      <div className="admin-card" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
        <div className="flex items-start space-x-3">
          <FiInfo className="text-lg mt-0.5 flex-shrink-0" style={{ color: 'var(--primary-600)' }} />
          <div className="flex-1">
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              📋 Understanding Audit Logs
            </h3>
            <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <p>
                <strong>What are Audit Logs?</strong> Every action taken by admins is automatically logged here with complete details.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                  <strong>• Timestamp:</strong> When the action occurred
                </div>
                <div>
                  <strong>• Admin User:</strong> Who performed the action
                </div>
                <div>
                  <strong>• Action:</strong> What was done (Create, Update, Delete, etc.)
                </div>
                <div>
                  <strong>• Resource:</strong> What was affected (Product, Order, etc.)
                </div>
                <div>
                  <strong>• Resource ID:</strong> The specific item that was changed
                </div>
                <div>
                  <strong>• IP Address:</strong> Where the action came from
                </div>
              </div>
              <p className="mt-3 text-xs">
                <strong>💡 Tip:</strong> Click on any Action badge or Resource ID to see full details. Click on IP Address to view location information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card space-y-4">
        <div className="flex items-center space-x-2 mb-2">
          <FiFilter className="text-lg" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search by admin user ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="admin-input pl-10"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="VIEW">View</option>
            <option value="LOGIN">Login</option>
            <option value="LOGIN_FAILED">Failed Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="STATUS_CHANGE">Status Change</option>
            <option value="UPLOAD">Upload</option>
          </select>
          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input"
          >
            <option value="">All Resources</option>
            <option value="PRODUCT">Products</option>
            <option value="VARIANT">Variants</option>
            <option value="IMAGE">Images</option>
            <option value="CATEGORY">Categories</option>
            <option value="ORDER">Orders</option>
            <option value="COUPON">Coupons</option>
            <option value="USER">Users</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Admin User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Resource ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {log.adminUser?.name || 'N/A'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {log.adminUser?.email || log.adminUser?._id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedLog(log);
                          setIpLocation(null);
                          setSelectedIp(null);
                        }}
                        className="px-2 py-1 text-xs rounded-full cursor-pointer transition-all hover:opacity-80 font-medium"
                        style={getActionColor(log.actionType)}
                      >
                        {log.actionType}
                      </motion.button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      {log.resourceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.resourceId ? (
                        <code
                          className="text-xs px-2 py-1 rounded font-mono cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                          onClick={() => {
                            setSelectedLog(log);
                            setIpLocation(null);
                            setSelectedIp(null);
                          }}
                          title="Click to view details"
                        >
                          {formatResourceId(log.resourceId)}
                        </code>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedLog(log);
                          setIpLocation(null);
                          setSelectedIp(null);
                        }}
                        className="text-xs px-2 py-1 rounded font-mono cursor-pointer hover:opacity-80 transition-all flex items-center space-x-1"
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                        title="Click to view details"
                      >
                        <span>{formatIpAddress(log.ipAddress || 'Unknown')}</span>
                        <FiMapPin className="text-xs opacity-60" />
                      </motion.button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Showing page {pagination.page} of {pagination.pages} (Total: {pagination.total} logs)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="admin-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
                className="admin-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => {
              setSelectedLog(null);
              setIpLocation(null);
              setSelectedIp(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="admin-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Audit Log Details
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(selectedLog.createdAt)}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setSelectedLog(null);
                    setIpLocation(null);
                    setSelectedIp(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <FiX className="text-xl" />
                </motion.button>
              </div>

              {/* Details */}
              <div className="space-y-4">
                {/* Action & Resource */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Action Type
                    </label>
                    <div className="mt-1">
                      <span
                        className="px-3 py-1 text-sm rounded-full font-medium"
                        style={getActionColor(selectedLog.actionType)}
                      >
                        {selectedLog.actionType}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Resource Type
                    </label>
                    <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedLog.resourceType}
                    </p>
                  </div>
                </div>

                {/* Admin User */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Admin User
                  </label>
                  <div className="mt-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedLog.adminUser?.name || 'N/A'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {selectedLog.adminUser?.email || selectedLog.adminUser?._id || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Resource ID */}
                {selectedLog.resourceId && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Resource ID
                    </label>
                    <div className="mt-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <code className="text-sm font-mono break-all" style={{ color: 'var(--text-primary)' }}>
                        {getFullResourceId(selectedLog.resourceId)}
                      </code>
                    </div>
                  </div>
                )}

                {/* IP Address & Location */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                    IP Address & Location
                  </label>
                  <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatIpAddress(selectedLog.ipAddress || 'Unknown')}
                        </code>
                        {selectedLog.ipAddress && selectedLog.ipAddress !== '::1' && selectedLog.ipAddress !== '127.0.0.1' && (
                          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                            Original: {selectedLog.ipAddress}
                          </p>
                        )}
                      </div>
                      {selectedLog.ipAddress &&
                        selectedLog.ipAddress !== '::1' &&
                        selectedLog.ipAddress !== '127.0.0.1' &&
                        selectedLog.ipAddress !== 'Unknown' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchIpLocation(selectedLog.ipAddress)}
                            disabled={loadingLocation}
                            className="admin-button-secondary text-xs flex items-center space-x-2"
                          >
                            {loadingLocation ? (
                              <>
                                <FiLoader className="animate-spin" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <FiMapPin />
                                <span>Get Location</span>
                              </>
                            )}
                          </motion.button>
                        )}
                    </div>

                    {/* Location Information */}
                    {ipLocation && selectedIp === selectedLog.ipAddress && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        {ipLocation.error ? (
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {ipLocation.error}
                          </p>
                        ) : (
                          <div className="space-y-2 text-sm">
                            {ipLocation.city && ipLocation.country && (
                              <p style={{ color: 'var(--text-primary)' }}>
                                <strong>📍 Location:</strong> {ipLocation.city}, {ipLocation.region}, {ipLocation.country}
                                {ipLocation.zip && ` ${ipLocation.zip}`}
                              </p>
                            )}
                            {ipLocation.lat && ipLocation.lon && (
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <strong>Coordinates:</strong> {ipLocation.lat}, {ipLocation.lon}
                              </p>
                            )}
                            {ipLocation.isp && (
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <strong>ISP:</strong> {ipLocation.isp}
                              </p>
                            )}
                            {ipLocation.org && (
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <strong>Organization:</strong> {ipLocation.org}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* User Agent */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Browser/Device Info (User Agent)
                  </label>
                  <div className="mt-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <p className="text-xs break-all" style={{ color: 'var(--text-primary)' }}>
                      {selectedLog.userAgent || 'Unknown'}
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                      This shows the browser and device used to perform the action.
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                {selectedLog.meta && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Additional Details
                    </label>
                    <div className="mt-1 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <div className="space-y-3">
                        {selectedLog.meta.method && (
                          <div>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Method: </span>
                            <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{selectedLog.meta.method}</span>
                          </div>
                        )}
                        {selectedLog.meta.path && (
                          <div>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Path: </span>
                            <span className="text-sm font-mono break-all" style={{ color: 'var(--text-primary)' }}>{selectedLog.meta.path}</span>
                          </div>
                        )}
                        {selectedLog.meta.requestBody && Object.keys(selectedLog.meta.requestBody).length > 0 && (
                          <div>
                            <span className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Request Body:</span>
                            <pre className="text-xs p-2 rounded overflow-auto max-h-40" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                              {JSON.stringify(selectedLog.meta.requestBody, null, 2)}
                            </pre>
                          </div>
                        )}
                        {selectedLog.meta.changes && Object.keys(selectedLog.meta.changes).length > 0 && (
                          <div>
                            <span className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Changes Made:</span>
                            <pre className="text-xs p-2 rounded overflow-auto max-h-40" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                              {JSON.stringify(selectedLog.meta.changes, null, 2)}
                            </pre>
                          </div>
                        )}
                        {selectedLog.meta.createdResource && (
                          <div>
                            <span className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Created Resource:</span>
                            <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                                ID: <code>{selectedLog.meta.createdResource.id}</code>
                              </p>
                              {selectedLog.meta.createdResource.name && (
                                <p className="text-xs mt-1" style={{ color: 'var(--text-primary)' }}>
                                  Name: {selectedLog.meta.createdResource.name}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedLog.meta.responseStatus && (
                          <div>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Response Status: </span>
                            <span className={`text-sm font-bold ${selectedLog.meta.responseStatus >= 400 ? 'text-red-600' :
                              selectedLog.meta.responseStatus >= 300 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                              {selectedLog.meta.responseStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

