import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiSearch, FiEye, FiPackage } from 'react-icons/fi';
import { adminOrdersApi } from '../api/admin';
import { useState } from 'react';

export default function Orders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter, searchTerm],
    queryFn: () =>
      adminOrdersApi.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, trackingNumber }) =>
      adminOrdersApi.updateStatus(id, status, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(null);
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Order status updated successfully', type: 'success' },
        })
      );
    },
  });

  const handleStatusUpdate = (orderId, status, trackingNumber = '') => {
    updateStatusMutation.mutate({ id: orderId, status, trackingNumber });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Orders</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Manage and track customer orders</p>
      </div>

      {/* Filters */}
      <div className="admin-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search by tracking number or coupon..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="admin-input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {order.orderNumber || order._id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {order.user?.name || 'N/A'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {order.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      ₹{order.totalPrice?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {order.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FiEye className="text-lg" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="admin-button-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page === pagination.pages}
                className="admin-button-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-card max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Order {selectedOrder.orderNumber || selectedOrder._id}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-2xl"
                style={{ color: 'var(--text-secondary)' }}
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Customer</h3>
                <div className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <p>{selectedOrder.user?.name}</p>
                  <p>{selectedOrder.user?.email}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Items</h3>
                <div className="space-y-2">
                  {selectedOrder.orderItems?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <div className="flex items-center space-x-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="h-12 w-12 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Qty: {item.qty}</p>
                        </div>
                      </div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        ₹{(item.price * item.qty).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                    <span style={{ color: 'var(--text-primary)' }}>₹{selectedOrder.itemsPrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Shipping:</span>
                    <span style={{ color: 'var(--text-primary)' }}>₹{selectedOrder.shippingPrice?.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discountPrice > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Discount:</span>
                      <span style={{ color: 'var(--text-primary)' }}>-₹{selectedOrder.discountPrice?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    <span>Total:</span>
                    <span>${selectedOrder.totalPrice?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Tracking */}
              {selectedOrder.trackingNumber && (
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Tracking</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{selectedOrder.trackingNumber}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

