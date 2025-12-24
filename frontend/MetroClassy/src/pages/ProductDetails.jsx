import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiShoppingCart, FiStar, FiChevronLeft, FiChevronRight, FiMinus, FiPlus, FiHeart, FiX } from 'react-icons/fi';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]); // Shared lightbox state
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const wished = isInWishlist(id);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await axios.get(`/products/${id}/reviews`);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Failed to fetch reviews', err);
      }
    };
    if (id) fetchReviews();
  }, [id]);

  // Use backend variants or fallbacks
  const sizes = product?.sizes?.length > 0 ? product.sizes : [];
  const colors = product?.colors?.length > 0 ? product.colors : [];

  // Auto-select first option if available and nothing selected
  useEffect(() => {
    if (product && !loading) {
      if (product.sizes?.length > 0 && !selectedSize) setSelectedSize(product.sizes[0]);
      if (product.colors?.length > 0 && !selectedColor) setSelectedColor(product.colors[0]?.name);
    }
  }, [product, loading, selectedSize, selectedColor]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(data);
        // Default selection logic moved to separate effect or handled below
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch product details');
        setLoading(false);
        console.error('Error fetching product:', err);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }

    setIsAddingToCart(true);

    // Simulate API call
    setTimeout(() => {
      addToCart({
        ...product,
        quantity,
        selectedSize,
        selectedColor,
      });
      setIsAddingToCart(false);

      // Show success message
      const event = new CustomEvent('show-notification', {
        detail: { message: 'Product added to cart!', type: 'success' },
      });
      window.dispatchEvent(event);
    }, 1000);
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === (product.images?.length - 1 || 0) ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? (product.images?.length - 1 || 0) : prevIndex - 1
    );
  };

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 10));
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };



  // Normalize images (useMemo to be efficient and accessible)
  const productImages = product?.images && product.images.length > 0
    ? product.images.map(img => {
      if (!img) return 'https://via.placeholder.com/800x800';
      if (img.startsWith('http')) return img;
      const cleanPath = img.replace(/\\/g, '/');
      return `http://localhost:5000${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
    })
    : [product?.image ? (product.image.startsWith('http') ? product.image : `http://localhost:5000${product.image}`) : 'https://via.placeholder.com/800x800'];

  // Auto-select first option if available and nothing selected
  useEffect(() => {
    if (product && !loading) {
      if (product.sizes?.length > 0 && !selectedSize) setSelectedSize(product.sizes[0]);
      if (product.colors?.length > 0 && !selectedColor) setSelectedColor(product.colors[0]?.name);
    }
  }, [product, loading, selectedSize, selectedColor]);

  // EFFECT: Switch Image when Color Changes
  useEffect(() => {
    if (selectedColor && colors.length > 0) {
      const colorObj = colors.find(c => c.name === selectedColor);

      if (colorObj && colorObj.image) {
        // Normalize the color image URL to match productImages format
        const colorImgUrl = colorObj.image.startsWith('http')
          ? colorObj.image
          : `http://localhost:5000${colorObj.image.startsWith('/') ? '' : '/'}${colorObj.image.replace(/\\/g, '/')}`;

        // Find index
        const index = productImages.findIndex(img => img === colorImgUrl);

        if (index !== -1) {
          setCurrentImageIndex(index);
        } else {
          // Fallback: Try looser matching (e.g. just filename) if exact match fails
          const fallbackIndex = productImages.findIndex(img => img.includes(colorObj.image.split(/[/\\]/).pop()));
          if (fallbackIndex !== -1) setCurrentImageIndex(fallbackIndex);
        }
      }
    }
  }, [selectedColor, colors, productImages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">The product you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Back to shop
          </button>
        </div>
      </div>
    );
  }

  const openProductLightbox = (index) => {
    setLightboxImages(productImages);
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const openReviewLightbox = (images, index) => {
    setLightboxImages(images);
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };


  return (
    <div className="surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
        >
          <FiArrowLeft className="mr-2 h-5 w-5" />
          Back to products
        </button>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Product Image Gallery */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className={`absolute top-4 right-4 z-10 inline-flex items-center justify-center h-11 w-11 rounded-full shadow-lg transition ${wished ? 'bg-pink-100 text-pink-600' : 'bg-white/90 text-gray-700 hover:bg-white dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-800'
                }`}
              aria-label="Toggle wishlist"
            >
              <FiHeart className={`h-6 w-6 ${wished ? 'fill-current' : ''}`} />
            </button>
            <div className="relative h-96 w-full overflow-hidden rounded-lg">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={productImages[currentImageIndex]}
                  alt={product.name}
                  onClick={() => openProductLightbox(currentImageIndex)}
                  className="h-full w-full object-contain object-center cursor-zoom-in"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {productImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110"
                    aria-label="Previous image"
                  >
                    <FiChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110"
                    aria-label="Next image"
                  >
                    <FiChevronRight className="h-6 w-6 text-gray-800" />
                  </button>
                </>
              )}

              {product.discount && (
                <span className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  -{product.discount}% OFF
                </span>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden snap-start border-2 transition-all ${currentImageIndex === index ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-transparent hover:border-gray-300'
                      }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="mt-10 lg:mt-0">
            <div className="border-b border-gray-200 dark:border-white/10 pb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {product.name}
              </h1>
              <div className="mt-2 flex items-center">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(product.rating || 0)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                        }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {product.numReviews || 0} reviews
                  </span>
                </div>
                <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <p className="mt-4 text-gray-500 dark:text-gray-300">{product.description}</p>
            </div>

            <div className="mt-6 border-b border-gray-200 dark:border-white/10 pb-6">
              <div className="flex items-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ₹{product.price.toFixed(2)}
                </p>
                {product.originalPrice && (
                  <p className="ml-2 text-lg text-gray-500 dark:text-gray-400 line-through">
                    ₹{product.originalPrice.toFixed(2)}
                  </p>
                )}
                {product.discount && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Save {product.discount}%
                  </span>
                )}
              </div>

              {product.countInStock <= 10 && product.countInStock > 0 && (
                <p className="mt-2 text-sm text-yellow-600">
                  Only {product.countInStock} left in stock!
                </p>
              )}
            </div>

            {sizes.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Size</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${selectedSize === size
                        ? 'bg-indigo-600 text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700'
                        }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {colors.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Color</h3>
                <div className="mt-2 flex items-center space-x-3">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${selectedColor === color.name ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                        }`}
                      onClick={() => setSelectedColor(color.name)}
                      title={color.name}
                    >
                      {/* Try to handle hex vs class */}
                      {color.class.startsWith('#') || color.class.startsWith('rgb') ? (
                        <span
                          className="h-6 w-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                          style={{ backgroundColor: color.class }}
                        />
                      ) : (
                        // Fallback/Tailwind class support
                        <span className={`h-6 w-6 rounded-full border border-black/10 transition-transform hover:scale-110 ${color.class}`} />
                      )}
                      <span className="sr-only">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Quantity Selector */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Quantity</h3>
              <div className="mt-2 flex items-center">
                <button
                  type="button"
                  className="p-2 border border-gray-300 dark:border-slate-600 rounded-l-md bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <FiMinus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="w-12 text-center border-t border-b border-gray-300 dark:border-slate-600 py-2 text-sm text-gray-900 dark:text-white dark:bg-slate-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="p-2 border border-gray-300 dark:border-slate-600 rounded-r-md bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700"
                  onClick={increaseQuantity}
                  disabled={quantity >= 10}
                >
                  <FiPlus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="mt-8">
              <button
                type="button"
                disabled={product.countInStock === 0 || isAddingToCart}
                onClick={handleAddToCart}
                className={`w-full flex items-center justify-center py-3 px-8 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${product.countInStock === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
              >
                {isAddingToCart ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : product.countInStock > 0 ? (
                  <>
                    <FiShoppingCart className="mr-2 h-5 w-5" />
                    Add to cart
                  </>
                ) : (
                  'Out of Stock'
                )}
              </button>
            </div>

            {/* Product Details */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Details</h3>
              <div className="mt-4 space-y-4">
                {product.details?.map((detail, index) => (
                  <div key={index} className="flex">
                    <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">
                      {detail.name}:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{detail.value}</span>
                  </div>
                )) || (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No additional details available for this product.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs + Reviews */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="border-b border-gray-200 dark:border-white/10">
              <nav className="-mb-px flex space-x-8">
                {['description', 'reviews', 'shipping'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${activeTab === tab
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 text-sm font-medium capitalize border-b-2 transition-colors`}
                  >
                    {tab === 'reviews' ? `Reviews (${reviews.length || product.numReviews || 0})` : tab}
                  </button>
                ))}
              </nav>
            </div>
            <div className="mt-6 prose prose-indigo prose-sm text-gray-500 dark:text-gray-300">
              {activeTab === 'description' && (
                <p>{product.fullDescription || product.description || 'No detailed description available.'}</p>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <p className="italic">No reviews yet. Be the first to review!</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-100 dark:border-white/5 pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                              {(review.user?.name?.[0] || 'U').toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">{review.user?.name || 'Anonymous'}</span>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-yellow-400 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <FiStar key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                          ))}
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{review.title}</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{review.comment}</p>
                        {review.media && review.media.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {review.media.map((img, idx) => {
                              // Ensure image URL is absolute
                              const imgUrl = img.startsWith('http') ? img : `http://localhost:5000${img}`;
                              // Create array of all images for this review for the lightbox
                              const reviewImages = review.media.map(m => m.startsWith('http') ? m : `http://localhost:5000${m}`);

                              return (
                                <img
                                  key={idx}
                                  src={imgUrl}
                                  alt="Review attachment"
                                  className="h-20 w-20 object-contain rounded-lg border border-gray-200 dark:border-gray-700 cursor-zoom-in hover:opacity-90 transition-opacity"
                                  onClick={() => openReviewLightbox(reviewImages, idx)}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
              {activeTab === 'shipping' && (
                <div className="space-y-4">
                  <p>Free shipping on all orders over $200. International shipping available.</p>
                  <p>Returns accepted within 30 days of delivery. Items must be unworn and with original tags.</p>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm bg-white dark:bg-slate-900/50">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add your review</h3>
              {user ? (
                <ReviewForm productId={product._id} onReviewSubmitted={() => {
                  window.location.reload();
                }} />
              ) : (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Please login to write a review.</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Login Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Sticky Mobile Add to Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0b0d1a] border-t border-gray-200 dark:border-white/10 p-4 md:hidden safe-area-bottom shadow-lg transform transition-transform duration-300">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">Total Price</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ₹{(product.price * quantity).toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            disabled={product.countInStock === 0 || isAddingToCart}
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg ${product.countInStock === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 active:scale-95 transition-all'
              }`}
          >
            {isAddingToCart ? (
              'Adding...'
            ) : product.countInStock > 0 ? (
              <>Add to Cart</>
            ) : (
              'Out of Stock'
            )}
          </button>
        </div>
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setIsLightboxOpen(false)}
            >
              <FiX className="w-8 h-8" />
            </button>
            <motion.img
              key={`lightbox-${currentImageIndex}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={lightboxImages[currentImageIndex]}
              alt={product.name}
              className="max-h-[90vh] max-w-[90vw] object-contain select-none shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {lightboxImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => prev === 0 ? lightboxImages.length - 1 : prev - 1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
                >
                  <FiChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => prev === lightboxImages.length - 1 ? 0 : prev + 1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
                >
                  <FiChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReviewForm = ({ productId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const onFilesSelected = (e) => {
    const selected = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const safe = selected.filter((f) => {
      const okType = /^image\//.test(f.type) || /^video\//.test(f.type);
      const okSize = f.size <= maxSize;
      return okType && okSize;
    });
    setFiles((prev) => [...prev, ...safe].slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      form.append('rating', rating);
      form.append('title', title);
      form.append('comment', comment);
      files.forEach((file) => form.append('media', file));

      // Use configured axios instance (auto-attaches token/cookies)
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      await axios.post(`/products/${productId}/reviews`, form, config);

      const event = new CustomEvent('show-notification', {
        detail: { message: 'Review submitted. Thanks for your feedback!', type: 'success' },
      });
      window.dispatchEvent(event);
      setTitle('');
      setComment('');
      setRating(5);
      setFiles([]);
      if (onReviewSubmitted) onReviewSubmitted(); // Trigger parent refresh
    } catch (err) {
      console.error('Review submission error:', err);
      const msg = err.response?.data?.message || err.message || 'Could not submit review right now.';
      setError(msg);
      const event = new CustomEvent('show-notification', {
        detail: { message: msg, type: 'error' },
      });
      window.dispatchEvent(event);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        Rating:
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            >
              <FiStar
                className={`h-6 w-6 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'
                  }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            {rating} Stars
          </span>
        </div>
      </label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Short title"
        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600"
        required
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share details on fit, quality, and style"
        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600"
        rows={4}
        required
      />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Add photos/videos (max 5, 10MB each)</label>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={onFilesSelected}
          className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <div key={idx} className="relative h-20 w-20 rounded-lg overflow-hidden group">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">
                  {file.name.substring(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-indigo-600 text-white py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
};

export default ProductDetails;
