import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiX, FiCalendar, FiPercent, FiDollarSign } from 'react-icons/fi';
import { couponsApi } from '../api/coupons';
import { format } from 'date-fns';

export default function Coupons() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['coupons', page, search],
        queryFn: () => couponsApi.getAll({ page, search, limit: 10 }),
        keepPreviousData: true,
    });

    const deleteMutation = useMutation({
        mutationFn: couponsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['coupons']);
            window.dispatchEvent(
                new CustomEvent('show-notification', {
                    detail: { message: 'Coupon deleted successfully', type: 'success' },
                })
            );
        },
        onError: (error) => {
            window.dispatchEvent(
                new CustomEvent('show-notification', {
                    detail: { message: error.response?.data?.message || 'Failed to delete coupon', type: 'error' },
                })
            );
        },
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingCoupon(null);
        setIsModalOpen(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-theme-primary">Coupons</h1>
                    <p className="mt-1 text-theme-secondary">Manage discount codes and promotions</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="admin-button-primary flex items-center justify-center gap-2"
                >
                    <FiPlus /> Create Coupon
                </button>
            </div>

            <div className="admin-card">
                <div className="flex items-center space-x-2 mb-6 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-200 dark:border-white/5">
                    <FiSearch className="text-theme-tertiary ml-2" />
                    <input
                        type="text"
                        placeholder="Search coupons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-theme-primary w-full placeholder-theme-tertiary"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/10">
                                    <th className="pb-3 text-sm font-medium text-theme-secondary">Code</th>
                                    <th className="pb-3 text-sm font-medium text-theme-secondary">Category</th>
                                    <th className="pb-3 text-sm font-medium text-theme-secondary">Discount</th>
                                    <th className="pb-3 text-sm font-medium text-theme-secondary">Usage</th>
                                    <th className="pb-3 text-sm font-medium text-theme-secondary">Status</th>
                                    <th className="pb-3 text-sm font-medium text-theme-secondary">Valid Until</th>
                                    <th className="pb-3 text-sm font-medium text-theme-secondary text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {data?.coupons.map((coupon) => (
                                    <tr key={coupon._id} className="group">
                                        <td className="py-4">
                                            <div className="font-mono font-medium text-theme-primary bg-gray-100 dark:bg-white/10 px-2 py-1 rounded w-fit">
                                                {coupon.code}
                                            </div>
                                            {coupon.description && (
                                                <div className="text-xs text-theme-tertiary mt-1">{coupon.description}</div>
                                            )}
                                            {coupon.isSpinReward && (
                                                <div className="text-[10px] font-bold text-purple-500 mt-1 uppercase tracking-wider">🌟 Spin Reward</div>
                                            )}
                                        </td>
                                        <td className="py-4 text-theme-secondary">
                                            {coupon.category || 'All'}
                                        </td>
                                        <td className="py-4 text-theme-primary">
                                            {coupon.discountType === 'percentage' ? (
                                                <span className="flex items-center text-blue-500">
                                                    <FiPercent className="mr-1" size={12} /> {coupon.discountValue}%
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-green-500">
                                                    ₹{coupon.discountValue}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 text-theme-secondary">
                                            {coupon.usedCount} / {coupon.usageLimit || '∞'}
                                        </td>
                                        <td className="py-4">
                                            <StatusBadge isActive={coupon.isActive} expiryDate={coupon.validUntil} />
                                        </td>
                                        <td className="py-4 text-theme-secondary">
                                            <div>{format(new Date(coupon.validUntil), 'MMM d, yyyy')}</div>
                                            <div className="text-xs text-theme-tertiary">
                                                {Math.ceil((new Date(coupon.validUntil) - new Date()) / (1000 * 60 * 60 * 24))} days left
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(coupon)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data?.coupons.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-theme-tertiary">
                                            No coupons found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination would go here */}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <CouponModal
                        coupon={editingCoupon}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={() => {
                            setIsModalOpen(false);
                            queryClient.invalidateQueries(['coupons']);
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function StatusBadge({ isActive, expiryDate }) {
    const isExpired = new Date(expiryDate) < new Date();

    if (!isActive) {
        return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                Inactive
            </span>
        );
    }

    if (isExpired) {
        return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                Expired
            </span>
        );
    }

    return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Active
        </span>
    );
}

function CouponModal({ coupon, onClose, onSuccess }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        code: coupon?.code || '',
        description: coupon?.description || '',
        category: coupon?.category || 'all',
        discountType: coupon?.discountType || 'percentage',
        discountValue: coupon?.discountValue || '',
        minPurchase: coupon?.minPurchase || 0,
        maxDiscount: coupon?.maxDiscount || '',
        validFrom: coupon?.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        validUntil: coupon?.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
        usageLimit: coupon?.usageLimit || '',
        isActive: coupon?.isActive ?? true,
        isSpinReward: coupon?.isSpinReward ?? false,
    });

    const mutation = useMutation({
        mutationFn: (data) =>
            coupon
                ? couponsApi.update(coupon._id, data)
                : couponsApi.create(data),
        onSuccess: () => {
            window.dispatchEvent(
                new CustomEvent('show-notification', {
                    detail: {
                        message: `Coupon ${coupon ? 'updated' : 'created'} successfully`,
                        type: 'success'
                    },
                })
            );
            onSuccess();
        },
        onError: (error) => {
            window.dispatchEvent(
                new CustomEvent('show-notification', {
                    detail: {
                        message: error.response?.data?.message || `Failed to ${coupon ? 'update' : 'create'} coupon`,
                        type: 'error'
                    },
                })
            );
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-[var(--bg-secondary)] rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-theme-primary">
                        {coupon ? 'Edit Coupon' : 'Create New Coupon'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-theme-secondary">
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="admin-label">Coupon Code *</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="Ex: SUMMER2024"
                                className="admin-input uppercase font-mono"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="admin-label">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Internal note about this coupon"
                                className="admin-input"
                            />
                        </div>

                        <div>
                            <label className="admin-label">Discount Type</label>
                            <select
                                value={formData.discountType}
                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                className="admin-input"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>

                        <div>
                            <label className="admin-label">Value *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                className="admin-input"
                            />
                        </div>

                        <div>
                            <label className="admin-label">Min Purchase (₹)</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.minPurchase}
                                onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                                className="admin-input"
                            />
                        </div>

                        <div>
                            <label className="admin-label">Max Discount (₹)</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="Optional"
                                value={formData.maxDiscount}
                                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value ? Number(e.target.value) : '' })}
                                className="admin-input"
                                disabled={formData.discountType === 'fixed'}
                            />
                        </div>

                        <div>
                            <label className="admin-label">Valid From *</label>
                            <input
                                type="date"
                                required
                                value={formData.validFrom}
                                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                className="admin-input"
                            />
                        </div>

                        <div>
                            <label className="admin-label">Valid Until *</label>
                            <input
                                type="date"
                                required
                                value={formData.validUntil}
                                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                className="admin-input"
                            />
                        </div>

                        <div>
                            <label className="admin-label">Usage Limit</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="Unlimited"
                                value={formData.usageLimit}
                                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : '' })}
                                className="admin-input"
                            />
                        </div>

                        <div className="flex items-center pt-6 space-x-6">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-theme-primary">Active</span>
                            </label>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isSpinReward}
                                    onChange={(e) => setFormData({ ...formData, isSpinReward: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-theme-primary">Is Spin Reward? (Win Cycle)</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-theme-secondary hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="admin-button-primary"
                        >
                            {mutation.isPending ? 'Saving...' : (coupon ? 'Update Coupon' : 'Create Coupon')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
