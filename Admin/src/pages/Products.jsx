import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiSettings } from 'react-icons/fi';
import { adminProductsApi, adminCategoriesApi } from '../api/admin';
import { useState } from 'react';

export default function Products() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, searchTerm, categoryFilter, activeFilter],
    queryFn: () =>
      adminProductsApi.getAll({
        page,
        limit: 20,
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        isActive: activeFilter || 'all', // Fetch all by default for admin
      }),
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminCategoriesApi.getAll(),
  });
  const categories = categoriesData?.categories || categoriesData || [];

  const deleteMutation = useMutation({
    mutationFn: adminProductsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: 'Product deleted successfully', type: 'success' },
        })
      );
    },
    onError: (error) => {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: { message: error.response?.data?.message || 'Failed to delete product', type: 'error' },
        })
      );
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all variants and images.`)) {
      deleteMutation.mutate(id);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Products</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your product inventory</p>
        </div>
        <Link to="/admin/products/new">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="admin-button-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Add Product
          </motion.button>
        </Link>
      </div>

      {/* Filters */}
      <div className="admin-card space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Filters</h3>
          <Link to="/admin/categories">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm admin-button-secondary flex items-center"
            >
              <FiSettings className="mr-1" />
              Manage Categories
            </motion.button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="admin-input pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="home">Home</option>
            <option value="other">Other</option>
            {/* Dynamic categories from database */}
            {categories.map((cat) => {
              const catSlug = cat.slug || cat.name?.toLowerCase();
              // Only show if not in the hardcoded list above
              if (!['electronics', 'clothing', 'books', 'home', 'other'].includes(catSlug)) {
                return (
                  <option key={cat._id || cat.id || cat.slug} value={cat.slug || cat.name}>
                    {cat.name}
                  </option>
                );
              }
              return null;
            })}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    No products found. Add your first product!
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-12 w-12 rounded-md object-cover mr-4"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</div>
                          <div className="text-sm truncate max-w-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {product.description?.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800 capitalize">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium align-middle" style={{ color: 'var(--text-primary)' }}>
                      ₹ {product.price?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${product.countInStock < 10
                          ? 'text-red-600'
                          : product.countInStock < 25
                            ? 'text-orange-600'
                            : 'text-green-600'
                          }`}
                      >
                        {product.countInStock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          to={`/admin/products/edit/${product._id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <FiEdit className="text-lg" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteMutation.isPending}
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
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
    </motion.div>
  );
}
