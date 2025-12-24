import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import { adminCategoriesApi } from '../api/admin';
import { useState } from 'react';

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  });
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminCategoriesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: adminCategoriesApi.create,
    onSuccess: () => {
      // Invalidate and refetch all category queries immediately
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.refetchQueries({ queryKey: ['admin-categories'] });
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('categories-updated'));
      setShowForm(false);
      setFormData({ name: '', slug: '', description: '', isActive: true });
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Category created successfully', type: 'success' },
        })
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminCategoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.refetchQueries({ queryKey: ['admin-categories'] });
      window.dispatchEvent(new CustomEvent('categories-updated'));
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', isActive: true });
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Category updated successfully', type: 'success' },
        })
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminCategoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.refetchQueries({ queryKey: ['admin-categories'] });
      window.dispatchEvent(new CustomEvent('categories-updated'));
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Category deleted successfully', type: 'success' },
        })
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      isActive: category.isActive !== false,
    });
    setShowForm(true);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete category "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Categories</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Manage product categories</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowForm(true);
            setEditingCategory(null);
            setFormData({ name: '', slug: '', description: '', isActive: true });
          }}
          className="admin-button-primary flex items-center"
        >
          <FiPlus className="mr-2" />
          Add Category
        </motion.button>
      </div>

      {/* Search */}
      <div className="admin-card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="admin-card">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {editingCategory ? 'Edit Category' : 'Create Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-label">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: formData.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  });
                }}
                required
                className="admin-input"
              />
            </div>
            <div>
              <label className="admin-label">Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="admin-input"
              />
            </div>
            <div>
              <label className="admin-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="admin-input"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label className="admin-label mb-0 ml-2">Active</label>
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="admin-button-primary">
                {editingCategory ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                }}
                className="admin-button-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="admin-card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
              No categories found
            </div>
          ) : (
            filteredCategories.map((category) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{category.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {category.slug}
                </p>
                {category.description && (
                  <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    {category.description}
                  </p>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="admin-button-secondary text-sm py-1 px-3"
                  >
                    <FiEdit className="inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category._id, category.name)}
                    className="admin-button-danger text-sm py-1 px-3"
                  >
                    <FiTrash2 className="inline mr-1" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

