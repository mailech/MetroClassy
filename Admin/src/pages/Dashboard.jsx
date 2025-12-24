import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPackage, FiDollarSign, FiTrendingUp, FiShoppingCart } from 'react-icons/fi';
import { adminMetricsApi } from '../api/admin';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

export default function Dashboard() {
  const { data: metricsData, isLoading, error } = useQuery({
    queryKey: ['admin-metrics-dashboard'],
    queryFn: adminMetricsApi.getDashboard,
    retry: 1,
  });

  const overview = metricsData?.overview || {};
  const recentOrders = metricsData?.recentOrders || [];
  const topProducts = metricsData?.topProducts || [];
  const productsByCategory = metricsData?.productsByCategory || [];

  // Use metrics data
  const stats = {
    totalProducts: overview.totalProducts || 0,
    totalValue: 0, // Calculate from products if needed
    lowStock: overview.lowStockProducts || 0,
    totalRevenue: overview.totalRevenue || 0,
  };

  // Build chart data from API (products by category) using stock totals
  const chartData = productsByCategory.map((item) => ({
    name: item._id === 'uncategorized' ? 'Uncategorized' : item._id,
    stock: item.totalStock ?? item.count ?? 0,
    count: item.count ?? 0,
  }));

  // Color palette for categories
  const categoryColors = [
    '#0ea5e9', // sky
    '#22c55e', // green
    '#a855f7', // purple
    '#f97316', // orange
    '#eab308', // amber
    '#06b6d4', // cyan
    '#f43f5e', // rose
    '#8b5cf6', // violet
  ];

  const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => {
    const colorClasses = {
      blue: { text: 'text-sky-300', bg: 'bg-sky-500/10', ring: 'ring-sky-400/30' },
      green: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-400/30' },
      orange: { text: 'text-amber-300', bg: 'bg-amber-500/10', ring: 'ring-amber-400/30' },
      purple: { text: 'text-fuchsia-300', bg: 'bg-fuchsia-500/10', ring: 'ring-fuchsia-400/30' },
    };
    const colors = colorClasses[color] || colorClasses.blue;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`admin-card ring-1 ${colors.ring}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">{label}</p>
            <p className={`text-3xl font-semibold ${colors.text} mt-1`}>{value}</p>
          </div>
          <div className={`p-3 rounded-2xl ${colors.bg} backdrop-blur`}>
            <Icon className={`text-2xl ${colors.text}`} />
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card">
        <div className="text-center py-12">
          <p className="text-red-600 mb-2">Error loading products</p>
          <p className="text-sm text-gray-600">
            {error.message || 'Make sure the backend server is running on port 5000'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiPackage}
          label="Total Products"
          value={stats.totalProducts}
          color="blue"
        />
        <StatCard
          icon={FiShoppingCart}
          label="Total Orders"
          value={overview.totalOrders || 0}
          color="green"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Low Stock Items"
          value={stats.lowStock}
          color="orange"
        />
        <StatCard
          icon={FiDollarSign}
          label="Total Revenue"
          value={`$${Math.round(stats.totalRevenue).toLocaleString()}`}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Category */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="admin-card"
        >
          <h2 className="text-xl font-semibold mb-4">Products by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="stock">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={categoryColors[index % categoryColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue by Category */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="admin-card"
        >
          <h2 className="text-xl font-semibold mb-4">Revenue by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-card"
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    No recent orders
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id} className="hover:opacity-80 transition-opacity" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        #{order._id?.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {order.user?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      ₹{order.totalPrice?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

