import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axios'; // Use configured instance
import { FiFilter, FiX, FiSearch, FiChevronDown, FiStar, FiHeart, FiGrid } from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import ProductModal from '../components/ProductModal';
import TiltCard from '../components/TiltCard';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [gridCols, setGridCols] = useState(4); // Grid column control
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    rating: 0,
  });
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();

  const categories = ['all', 'Wordmark', 'Infinity Sigil', 'Outline Seal'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get('/products');
        const list = Array.isArray(data) ? data : data?.products || [];
        setProducts(list);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch products');
        setLoading(false);
        console.error('Error fetching products:', err);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      const normalized = categoryParam
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      const match = categories.find(
        (cat) => cat.toLowerCase() === normalized.toLowerCase()
      );
      if (match) {
        setFilters((prev) => ({ ...prev, category: match }));
      }
    }
    const searchParam = searchParams.get('q');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filters.category === 'all' ||
      product.category === filters.category;

    const matchesPrice = (!filters.minPrice || product.price >= Number(filters.minPrice)) &&
      (!filters.maxPrice || product.price <= Number(filters.maxPrice));

    const matchesRating = product.rating >= filters.rating;

    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0; // Default sorting (featured)
    }
  });

  const resetFilters = () => {
    setFilters({
      category: 'all',
      minPrice: '',
      maxPrice: '',
      rating: 0,
    });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen surface">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10 surface min-h-screen">{error}</div>;
  }

  return (
    <div className="surface min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Our Products</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} found
            </p>
          </div>

          <div className="mt-4 md:mt-0 w-full md:w-auto flex items-center space-x-2 sm:space-x-4">
            <div className="relative flex-1 md:min-w-[300px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="block w-full pl-9 sm:pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <FiChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg">
              {[2, 3, 4].map((cols) => (
                <button
                  key={cols}
                  onClick={() => setGridCols(cols)}
                  className={`p-1.5 rounded transition-colors ${gridCols === cols
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  title={`${cols} columns`}
                >
                  <FiGrid size={16} />
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
            >
              <FiFilter className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile Filter Sidebar */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween' }}
                className="fixed inset-0 z-50 md:hidden"
              >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute top-0 left-0 h-full w-[85%] max-w-sm bg-white dark:bg-[#0b0d1a] shadow-2xl overflow-y-auto">
                  <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="p-2 -mr-2 text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="p-4">
                    <FilterSection
                      filters={filters}
                      setFilters={setFilters}
                      categories={categories}
                      resetFilters={resetFilters}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Filter Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="card-surface dark:bg-slate-900/50 dark:border dark:border-white/10 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h2>
                <button
                  onClick={resetFilters}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  Reset all
                </button>
              </div>
              <FilterSection
                filters={filters}
                setFilters={setFilters}
                categories={categories}
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {sortedProducts.length > 0 ? (
              <div className={`grid gap-3 sm:gap-6 ${gridCols === 2 ? 'grid-cols-2' :
                gridCols === 3 ? 'grid-cols-2 lg:grid-cols-3' :
                  'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}>
                <AnimatePresence>
                  {sortedProducts.map((product) => {
                    const pid = product._id || product.id;
                    const wished = isInWishlist(pid);
                    return (
                      <TiltCard key={pid}>
                        <motion.div
                          layoutId={`card-${pid}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.25 }}
                          onClick={() => setSelectedProduct(product)}
                          className="group relative h-full cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                          {/* Image container */}
                          <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden bg-gray-100 dark:bg-slate-800">
                            <motion.img
                              layoutId={`image-${pid}`}
                              src={product.image || 'https://via.placeholder.com/300x300'}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Quick View Button (Desktop only on hover, maybe icon on mobile?) */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                              }}
                              className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 px-4 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-gray-900 dark:text-white text-xs font-bold rounded-full shadow-lg transition-all hidden sm:block"
                            >
                              Quick View
                            </motion.button>
                          </div>

                          {/* Wishlist Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            className={`absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-md backdrop-blur-md transition-all z-20 ${wished
                              ? 'bg-pink-500 text-white'
                              : 'bg-white/80 dark:bg-slate-900/80 text-gray-600 dark:text-gray-300'
                              }`}
                            aria-label="Toggle wishlist"
                          >
                            <FiHeart className={`h-4 w-4 sm:h-5 sm:w-5 ${wished ? 'fill-current' : ''}`} />
                          </button>

                          <div className="p-3 sm:p-4 space-y-1 sm:space-y-2">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                              {product.name}
                            </h3>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                {product.category}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <FiStar className="h-3 w-3 text-yellow-400 fill-current" />
                                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">{product.rating || 0}</span>
                              </div>
                            </div>

                            <div className="pt-1 flex items-baseline gap-2">
                              <p className="text-sm sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                ₹{product.price.toFixed(0)}
                              </p>
                              {product.originalPrice && (
                                <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                                  ₹{product.originalPrice.toFixed(0)}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </TiltCard>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <h3 className="text-lg font-medium">No products found</h3>
                <p className="mt-2 text-gray-500">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterSection = ({ filters, setFilters, categories, resetFilters }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center">
              <input
                id={`category-${category}`}
                name="category"
                type="radio"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={filters.category === category}
                onChange={() => setFilters({ ...filters, category })}
              />
              <label
                htmlFor={`category-${category}`}
                className="ml-3 text-sm text-gray-600 dark:text-gray-400 capitalize"
              >
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Price Range</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Min
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="minPrice"
                className="block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-slate-800 dark:text-white"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters({ ...filters, minPrice: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Max
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="maxPrice"
                className="block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-slate-800 dark:text-white"
                placeholder="1000"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center">
              <input
                id={`rating-${rating}`}
                name="rating"
                type="radio"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                checked={filters.rating === rating}
                onChange={() => setFilters({ ...filters, rating })}
              />
              <label
                htmlFor={`rating-${rating}`}
                className="ml-3 text-sm text-gray-600 dark:text-gray-400 flex items-center"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                  />
                ))}
                <span className="ml-1">&amp; Up</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {resetFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full mt-4 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
};

export default Products;
