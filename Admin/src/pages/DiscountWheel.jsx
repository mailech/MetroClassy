import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiSave, FiPlus, FiTrash2, FiEdit, FiInfo } from 'react-icons/fi';
import { discountWheelApi } from '../api/discountWheel';
import { adminCategoriesApi } from '../api/admin';
import { useState, useEffect } from 'react';

export default function DiscountWheel() {
  const queryClient = useQueryClient();
  const [localSegments, setLocalSegments] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newSegment, setNewSegment] = useState({
    label: '',
    reward: '',
    couponCode: '',
    probability: 0,
    color: '#c0b6ff',
    active: true,
    category: '', // Optional - leave empty for all categories
  });

  // Fetch categories for category selector - refetch on window focus to get latest categories
  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminCategoriesApi.getAll(),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to get latest categories
  });

  const categories = categoriesData?.categories || categoriesData || [];

  // Listen for category updates and refetch immediately
  useEffect(() => {
    const handleCategoriesUpdate = async () => {
      // Force a hard refetch
      await queryClient.refetchQueries({ queryKey: ['admin-categories'], type: 'active' });
      await refetchCategories({ cancelRefetch: false });
    };

    window.addEventListener('categories-updated', handleCategoriesUpdate);
    // Also refetch on mount
    refetchCategories({ cancelRefetch: false });

    return () => {
      window.removeEventListener('categories-updated', handleCategoriesUpdate);
    };
  }, [refetchCategories, queryClient]);

  const { data: wheelConfig, isLoading } = useQuery({
    queryKey: ['discountWheel'],
    queryFn: discountWheelApi.get,
  });

  // Initialize local segments when data loads
  useEffect(() => {
    if (wheelConfig?.segments) {
      setLocalSegments(wheelConfig.segments);
      setHasChanges(false);
    }
  }, [wheelConfig]);

  const mutation = useMutation({
    mutationFn: discountWheelApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountWheel'] });
      setHasChanges(false);
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Discount wheel saved successfully!', type: 'success' },
        })
      );
      setEditingIndex(null);
      setNewSegment({
        label: '',
        reward: '',
        couponCode: '',
        probability: 0,
        color: '#c0b6ff',
        active: true,
        category: '',
      });
    },
    onError: (error) => {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: {
            message: error.response?.data?.message || 'Failed to save discount wheel',
            type: 'error',
          },
        })
      );
    },
  });

  const totalProbability = localSegments
    .filter((seg) => seg.active !== false)
    .reduce((sum, seg) => sum + (parseFloat(seg.probability) || 0), 0);

  const handleSaveAll = () => {
    // Normalize probabilities to sum to 1
    const activeSegments = localSegments.filter((seg) => seg.active !== false);
    const currentSum = activeSegments.reduce(
      (sum, seg) => sum + (parseFloat(seg.probability) || 0),
      0
    );

    if (activeSegments.length === 0) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'At least one active segment is required', type: 'error' },
        })
      );
      return;
    }

    if (currentSum === 0) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'At least one segment must have a probability > 0', type: 'error' },
        })
      );
      return;
    }

    // Normalize probabilities
    const normalizedSegments = localSegments.map((seg) => {
      if (seg.active === false) return seg;
      return {
        ...seg,
        probability: (parseFloat(seg.probability) || 0) / currentSum,
      };
    });

    mutation.mutate({ segments: normalizedSegments });
  };

  const updateLocalSegment = (index, updatedSegment) => {
    const updated = [...localSegments];
    updated[index] = updatedSegment;
    setLocalSegments(updated);
    setHasChanges(true);
  };

  const handleUpdateSegment = (index, updatedSegment) => {
    updateLocalSegment(index, updatedSegment);
    setEditingIndex(null);
  };

  const handleDeleteSegment = (index) => {
    if (localSegments.length <= 1) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'At least one segment is required', type: 'error' },
        })
      );
      return;
    }

    const updated = localSegments.filter((_, i) => i !== index);
    setLocalSegments(updated);
    setHasChanges(true);
    setEditingIndex(null);
  };

  const handleAddSegment = () => {
    if (!newSegment.label || !newSegment.reward || !newSegment.couponCode) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Please fill in all required fields (Label, Reward, Coupon Code)', type: 'error' },
        })
      );
      return;
    }

    const updated = [...localSegments, { ...newSegment, probability: parseFloat(newSegment.probability) || 0 }];
    setLocalSegments(updated);
    setHasChanges(true);
    setNewSegment({
      label: '',
      reward: '',
      couponCode: '',
      probability: 0,
      color: '#c0b6ff',
      active: true,
    });
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
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Discount Wheel Configuration
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Configure the spin-to-win discount wheel that customers can use on your website
        </p>
      </div>

      {/* Info Card */}
      <div className="admin-card bg-blue-50 border-blue-200" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
        <div className="flex items-start space-x-3">
          <FiInfo className="text-blue-600 mt-1 flex-shrink-0" style={{ color: 'var(--primary-600)' }} />
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              How the Discount Wheel Works
            </h3>
            <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>• <strong>Segments:</strong> Each segment represents a prize customers can win (like "10% off", "Free Shipping", etc.)</li>
              <li>• <strong>Probability:</strong> The chance of winning that segment (e.g., 0.25 = 25% chance). Higher number = more likely to win.</li>
              <li>• <strong>Total must equal 100%:</strong> All active segment probabilities must sum to exactly 1.0 (100%). The system will automatically normalize them when you save.</li>
              <li>• <strong>Category:</strong> Optional - Limit discount to a specific category (e.g., only "Electronics"). Leave empty to apply to all categories. <strong>Note:</strong> If you just created a new category, refresh this page to see it in the dropdown.</li>
              <li>• <strong>One-Time Use:</strong> Each customer can only spin the wheel once in their lifetime. The system tracks this automatically using their user account. Once they spin, they cannot spin again.</li>
              <li>• <strong>Visual Preview:</strong> The circle below shows how the wheel will look to customers. Each colored slice represents a segment - bigger slices = higher probability of winning. This helps you see if your probabilities are balanced.</li>
              <li>• <strong>Coupon Code:</strong> The discount code customers will receive if they win this segment. This must match an existing coupon code in your system.</li>
            </ul>
            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                🎰 How the Spin Works:
              </p>
              <ol className="text-xs space-y-1 ml-4 list-decimal" style={{ color: 'var(--text-secondary)' }}>
                <li>Customer clicks the "Spin" button on your website</li>
                <li>System checks if they've already spun before (one-time only)</li>
                <li>If they have a category selected in their cart, only discounts for that category are available</li>
                <li>System randomly selects a segment based on the probabilities you set</li>
                <li>Customer wins the discount/coupon code from that segment</li>
                <li>Customer cannot spin again (one-time use)</li>
              </ol>
            </div>
            <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              💡 Tip: Make sure to click "Save All Changes" when you're done editing!
            </p>
          </div>
        </div>
      </div>

      {/* Save Button - Only show if there are changes */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-4 z-10 flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveAll}
            disabled={mutation.isPending}
            className="admin-button-primary flex items-center shadow-lg"
          >
            <FiSave className="mr-2" />
            {mutation.isPending ? 'Saving...' : 'Save All Changes'}
          </motion.button>
        </motion.div>
      )}

      {/* Probability Warning */}
      {Math.abs(totalProbability - 1) > 0.01 && (
        <div className="admin-card border-yellow-500" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.5)' }}>
          <p style={{ color: 'var(--text-primary)' }}>
            <strong>⚠️ Warning:</strong> Active segment probabilities currently sum to{' '}
            <strong>{(totalProbability * 100).toFixed(1)}%</strong>. They must sum to exactly <strong>100%</strong> before saving.
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't worry - probabilities will be automatically normalized when you save, but make sure your intended distribution is correct.
          </p>
        </div>
      )}

      {/* Segments List */}
      <div className="admin-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Current Segments ({localSegments.length})
          </h2>
        </div>
        {localSegments.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
            <p>No segments yet. Add your first segment below!</p>
          </div>
        ) : (
          localSegments.map((segment, index) => (
            <SegmentEditor
              key={index}
              segment={segment}
              index={index}
              isEditing={editingIndex === index}
              onEdit={() => setEditingIndex(index)}
              onCancel={() => {
                setEditingIndex(null);
                // Reset local segments to server state on cancel
                if (wheelConfig?.segments) {
                  setLocalSegments(wheelConfig.segments);
                  setHasChanges(false);
                }
              }}
              onUpdate={(updated) => handleUpdateSegment(index, updated)}
              onDelete={() => handleDeleteSegment(index)}
            />
          ))
        )}
      </div>

      {/* Add New Segment */}
      <div className="admin-card space-y-4">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Add New Segment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Label *</label>
            <input
              type="text"
              value={newSegment.label}
              onChange={(e) => setNewSegment({ ...newSegment, label: e.target.value })}
              className="admin-input"
              placeholder="e.g., 10% off"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Short label shown on the wheel
            </p>
          </div>
          <div>
            <label className="admin-label">Reward *</label>
            <input
              type="text"
              value={newSegment.reward}
              onChange={(e) => setNewSegment({ ...newSegment, reward: e.target.value })}
              className="admin-input"
              placeholder="e.g., Enjoy 10% off"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Description shown to customers when they win
            </p>
          </div>
          <div>
            <label className="admin-label">Coupon Code *</label>
            <input
              type="text"
              value={newSegment.couponCode}
              onChange={(e) => setNewSegment({ ...newSegment, couponCode: e.target.value.toUpperCase() })}
              className="admin-input"
              placeholder="e.g., METRO10"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Must match an existing coupon in your system
            </p>
          </div>
          <div>
            <label className="admin-label">Probability (0-1) *</label>
            <input
              type="number"
              value={newSegment.probability}
              onChange={(e) =>
                setNewSegment({ ...newSegment, probability: parseFloat(e.target.value) || 0 })
              }
              min="0"
              max="1"
              step="0.01"
              className="admin-input"
              placeholder="0.25"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Chance of winning (0.25 = 25%). Will be normalized with other segments.
            </p>
          </div>
          <div>
            <label className="admin-label">Color</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={newSegment.color}
                onChange={(e) => setNewSegment({ ...newSegment, color: e.target.value })}
                className="admin-input h-10 w-20"
              />
              <div
                className="w-12 h-12 rounded-full border-2"
                style={{ backgroundColor: newSegment.color, borderColor: 'var(--border-color)' }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Color of this segment on the wheel
            </p>
          </div>
          <div>
            <label className="admin-label">Category (Optional)</label>
            <select
              value={newSegment.category || ''}
              onChange={(e) => setNewSegment({ ...newSegment, category: e.target.value })}
              className="admin-input"
            >
              <option value="">All Categories (no restriction)</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.id || cat.slug} value={cat.slug || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Limit this discount to a specific category. Leave empty to apply to all categories.
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddSegment}
          className="admin-button-primary flex items-center"
        >
          <FiPlus className="mr-2" />
          Add Segment to List
        </motion.button>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          💡 Remember: After adding or editing segments, click "Save All Changes" at the top to save to the database.
        </p>
      </div>

      {/* Visual Preview */}
      <div className="admin-card">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Visual Preview
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            📊 What you're seeing:
          </p>
          <ul className="text-sm space-y-1 ml-4 list-disc" style={{ color: 'var(--text-secondary)' }}>
            <li>The circle below shows your discount wheel as customers will see it</li>
            <li>Each colored slice = one discount segment</li>
            <li><strong>Bigger slice = higher chance</strong> of winning that discount</li>
            <li>Smaller slice = lower chance of winning that discount</li>
            <li>The percentages show the exact probability for each segment</li>
            <li>Only <strong>active</strong> segments are shown (inactive segments are hidden)</li>
          </ul>
          <p className="text-sm mt-3 font-medium" style={{ color: 'var(--text-primary)' }}>
            💡 Example: If "10% off" has a bigger slice than "50% off", customers are MORE likely to win the 10% discount (because it has higher probability).
          </p>
        </div>
        <div className="flex justify-center">
          <WheelPreview segments={localSegments} />
        </div>
        <div className="mt-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <p>Total Active Segments: {localSegments.filter((s) => s.active !== false).length}</p>
          <p>Total Probability: {(totalProbability * 100).toFixed(1)}%</p>
        </div>
      </div>
    </motion.div>
  );
}

function SegmentEditor({ segment, index, isEditing, onEdit, onCancel, onUpdate, onDelete }) {
  const [editData, setEditData] = useState(segment);

  // Fetch categories for category selector - refetch on window focus
  const { data: categoriesData, refetch: refetchSegmentCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminCategoriesApi.getAll(),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to get latest categories
  });
  const categories = categoriesData?.categories || categoriesData || [];

  // Listen for category updates
  useEffect(() => {
    const handleCategoriesUpdate = async () => {
      await refetchSegmentCategories({ cancelRefetch: false });
    };

    window.addEventListener('categories-updated', handleCategoriesUpdate);

    return () => {
      window.removeEventListener('categories-updated', handleCategoriesUpdate);
    };
  }, [refetchSegmentCategories]);

  useEffect(() => {
    setEditData(segment);
  }, [segment]);

  const handleSave = () => {
    if (!editData.label || !editData.reward || !editData.couponCode) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Please fill in all required fields', type: 'error' },
        })
      );
      return;
    }
    onUpdate(editData);
  };

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-slate-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Label</label>
            <input
              type="text"
              value={editData.label}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Reward</label>
            <input
              type="text"
              value={editData.reward}
              onChange={(e) => setEditData({ ...editData, reward: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Coupon Code</label>
            <input
              type="text"
              value={editData.couponCode}
              onChange={(e) => setEditData({ ...editData, couponCode: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Probability (0-1)</label>
            <input
              type="number"
              value={editData.probability}
              onChange={(e) =>
                setEditData({ ...editData, probability: parseFloat(e.target.value) || 0 })
              }
              min="0"
              max="1"
              step="0.01"
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Color</label>
            <input
              type="color"
              value={editData.color}
              onChange={(e) => setEditData({ ...editData, color: e.target.value })}
              className="admin-input h-10"
            />
          </div>
          <div>
            <label className="admin-label">Category (Optional)</label>
            <select
              value={editData.category || ''}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              className="admin-input"
            >
              <option value="">All Categories (no restriction)</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.id || cat.slug} value={cat.slug || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editData.active !== false}
                onChange={(e) => setEditData({ ...editData, active: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="admin-label mb-0">Active</span>
            </label>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleSave} className="admin-button-primary flex items-center">
            <FiSave className="mr-2" />
            Save
          </button>
          <button onClick={onCancel} className="admin-button-secondary">
            Cancel
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg border transition-colors"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: segment.active === false ? 'rgba(0,0,0,0.02)' : 'var(--bg-secondary)'
      }}
    >
      <div className="flex items-center space-x-4 flex-1">
        <div
          className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: segment.color }}
        />
        <div className="flex-1">
          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {segment.label}
            {segment.active === false && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                Inactive
              </span>
            )}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {segment.reward}
          </div>
          <div className="text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
            Coupon: {segment.couponCode}
          </div>
          {segment.category && (
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Category: {segment.category}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {(parseFloat(segment.probability) * 100).toFixed(1)}%
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Probability
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 ml-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEdit}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--primary-600)', backgroundColor: 'transparent' }}
        >
          <FiEdit />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDelete}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--red-600)', backgroundColor: 'transparent' }}
        >
          <FiTrash2 />
        </motion.button>
      </div>
    </div>
  );
}

function WheelPreview({ segments }) {
  const activeSegments = segments.filter((seg) => seg.active !== false);
  const totalAngle = 360;

  // Calculate total probability for normalization in preview
  const totalProb = activeSegments.reduce((sum, seg) => sum + (parseFloat(seg.probability) || 0), 0);
  const normalizedTotal = totalProb > 0 ? totalProb : 1;

  let currentAngle = 0;

  if (activeSegments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-64 h-64 rounded-full border-4 border-dashed flex items-center justify-center" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
            No active segments
            <br />
            Add segments to see preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center">
      <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-lg">
        {activeSegments.map((segment, index) => {
          // Normalize probability for visual representation
          const normalizedProb = (parseFloat(segment.probability) || 0) / normalizedTotal;
          const angle = normalizedProb * totalAngle;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          currentAngle = endAngle;

          const startRad = ((startAngle - 90) * Math.PI) / 180;
          const endRad = ((endAngle - 90) * Math.PI) / 180;

          const x1 = 150 + 120 * Math.cos(startRad);
          const y1 = 150 + 120 * Math.sin(startRad);
          const x2 = 150 + 120 * Math.cos(endRad);
          const y2 = 150 + 120 * Math.sin(endRad);

          const largeArc = angle > 180 ? 1 : 0;

          return (
            <g key={index}>
              <path
                d={`M 150 150 L ${x1} ${y1} A 120 120 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={segment.color}
                stroke="#fff"
                strokeWidth="3"
                opacity="0.9"
              />
              {/* Label in middle of segment */}
              {angle > 15 && (
                <text
                  x={150 + 70 * Math.cos(((startAngle + angle / 2 - 90) * Math.PI) / 180)}
                  y={150 + 70 * Math.sin(((startAngle + angle / 2 - 90) * Math.PI) / 180)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="12"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {segment.label}
                </text>
              )}
            </g>
          );
        })}
        <circle cx="150" cy="150" r="50" fill="white" stroke="#ccc" strokeWidth="3" />
        <text x="150" y="145" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">
          SPIN
        </text>
      </svg>
    </div>
  );
}

