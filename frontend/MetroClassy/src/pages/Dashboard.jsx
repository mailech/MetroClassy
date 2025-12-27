import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiShoppingBag, FiTrendingUp, FiDollarSign, FiX, FiMapPin, FiPackage } from 'react-icons/fi';
import { getImageUrl } from '../utils/imageUtils';

const StatCard = ({ label, value, hint, icon: Icon, color = 'indigo' }) => (
  <div className={`rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-white/10 p-4 sm:p-5`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`mt-2 text-2xl sm:text-3xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
        {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
      </div>
      {Icon && (
        <div className={`w-12 h-12 rounded-full bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [showCartNotification, setShowCartNotification] = useState(false);

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      await axiosInstance.put(`/orders/${orderToCancel._id}/cancel`);
      // Update local state
      const updatedOrders = orders.map(o => o._id === orderToCancel._id ? { ...o, status: 'Cancelled' } : o);
      setOrders(updatedOrders);

      // Update selected order if it's the one being cancelled
      if (selectedOrder && selectedOrder._id === orderToCancel._id) {
        setSelectedOrder({ ...selectedOrder, status: 'Cancelled' });
      }

      setIsCancelModalOpen(false);
      setOrderToCancel(null);

      // Show success notification (could use a toast lib here)
      alert("Order cancelled successfully.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to cancel order";
      alert(msg);
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  // Show cart notification if user has items
  useEffect(() => {
    if (user && cartItems.length > 0) {
      const hasSeenNotification = sessionStorage.getItem('cartNotificationShown');
      if (!hasSeenNotification) {
        setShowCartNotification(true);
        sessionStorage.setItem('cartNotificationShown', 'true');
      }
    }
  }, [user, cartItems]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      try {
        const { data } = await axiosInstance.get('/orders/my');
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    loadOrders();
  }, [user]);

  // Calculate analytics
  const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalSavings = orders.reduce((sum, o) => sum + (o.discount || 0), 0);

  // Spending over time data
  const spendingData = orders.slice(0, 6).reverse().map((order, idx) => ({
    name: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: order.totalPrice || 0,
  }));

  // Category breakdown
  const categoryData = [
    { name: 'Orders', value: orders.length, color: '#6366f1' },
    { name: 'Delivered', value: orders.filter(o => o.isDelivered).length, color: '#10b981' },
    { name: 'Pending', value: orders.filter(o => !o.isDelivered && o.status !== 'Cancelled').length, color: '#f59e0b' },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'Cancelled').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="surface min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 space-y-8">
        {/* Header with User Info and Logout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">Welcome back, {user?.name}!</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-xl font-medium transition-colors self-start md:self-auto"
          >
            Logout
          </button>
        </div>

        {/* Cart Notification */}
        <AnimatePresence>
          {showCartNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 shadow-lg shadow-indigo-500/20"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-white">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                    <FiShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">You have {cartItems.length} item(s) in your cart!</p>
                    <p className="text-indigo-100">Don't let them verify away.</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => navigate('/checkout')}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    Checkout Now
                  </button>
                  <button
                    onClick={() => setShowCartNotification(false)}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-800/40 text-white rounded-xl hover:bg-indigo-800/60 transition-colors font-medium backdrop-blur-md"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard label="Total Orders" value={orders.length} hint="All time stats" icon={FiShoppingBag} color="indigo" />
          <StatCard label="Total Spent" value={`₹${totalSpent.toFixed(2)}`} hint="Lifetime value" icon={FiDollarSign} color="green" />
          <StatCard label="Total Savings" value={`₹${totalSavings.toFixed(2)}`} hint="Discounts applied" icon={FiTrendingUp} color="purple" />
        </div>

        {/* Analytics Charts */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending Trend */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-6 border border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <FiTrendingUp className="text-indigo-500" /> Spending Trend
              </h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendingData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      formatter={(val) => [`₹${val}`, 'Amount']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-6 border border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <FiPackage className="text-emerald-500" /> Order Status
              </h3>
              <div className="flex flex-col items-center justify-center h-[250px]">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {categoryData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track your recent purchases</p>
            </div>
            <Link to="/products" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1">
              Continue Shopping →
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {isLoadingOrders ? (
              <div className="p-8"><LoadingSkeleton count={3} /></div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <FiShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium">No orders found</p>
                <p className="text-sm">Looks like you haven't made any purchases yet.</p>
                <Link to="/products" className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Start Shopping
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => openOrderDetails(order)}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex gap-4">
                      <div className="hidden sm:flex w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center text-gray-500">
                        <FiPackage />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">#{order.orderNumber || order._id.slice(-8)}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                              ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} • {order.orderItems.length} items
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 dark:border-white/5">
                      <div className="text-right">
                        <span className="block text-xs text-gray-400 uppercase">Total</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">₹{(order.totalPrice || 0).toFixed(2)}</span>
                      </div>
                      <span className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-600 transition-all">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 100 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeOrderDetails}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-start bg-white dark:bg-slate-900 z-10 shrink-0">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h3>
                  <p className="text-gray-500 text-sm mt-1">Order #{selectedOrder.orderNumber || selectedOrder._id}</p>
                </div>
                <button onClick={closeOrderDetails} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto grow">
                {/* Status Bar */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${selectedOrder.status === 'delivered' ? 'bg-green-500' : selectedOrder.status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <p className="font-bold text-gray-900 dark:text-white capitalize">{selectedOrder.status}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Payment</p>
                    <p className="font-bold text-gray-900 dark:text-white capitalize truncate">
                      {selectedOrder.paymentMethod} • {selectedOrder.isPaid ? 'Paid' : 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-8">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiShoppingBag className="text-indigo-500" /> Items Included
                  </h4>
                  <div className="space-y-4">
                    {selectedOrder.orderItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                        <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/100x120?text=Item';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h5>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.size && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-xs text-gray-600 dark:text-gray-300 font-medium">
                                Size: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-xs text-gray-600 dark:text-gray-300 font-medium">
                                Color: {item.color}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            QTY: <strong className="text-gray-900 dark:text-white">{item.qty}</strong>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-gray-900 dark:text-white">₹{item.price}</p>
                          <p className="text-xs text-gray-400 mt-1">Total: ₹{item.price * item.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FiMapPin className="text-red-500" /> Shipping Details
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-6">
                    <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                    <p className="mt-2 text-indigo-500 font-medium">{selectedOrder.shippingAddress.phone || user?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Actions */}
              <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 shrink-0 flex justify-end gap-3">
                {/* Cancel Button - Only for Pending/Processing */}
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'Processing') && (
                  <button
                    onClick={() => {
                      setOrderToCancel(selectedOrder);
                      setIsCancelModalOpen(true);
                    }}
                    className="px-6 py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold transition-colors dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400"
                  >
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={closeOrderDetails}
                  className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg shadow-gray-200 dark:shadow-none hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 150 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-white/10"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4 mx-auto">
                <FiX className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Cancel Order?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">
                Are you sure you want to cancel order <span className="font-mono font-bold text-gray-900 dark:text-white">#{orderToCancel?.orderNumber}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-slate-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  No, Keep it
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
