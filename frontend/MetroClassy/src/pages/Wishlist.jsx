import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUtils';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (item) => {
    addToCart(item);
  };

  if (!wishlist.length) {
    return (
      <div className="surface min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 card-surface rounded-2xl p-8 shadow-lg max-w-md">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <FiHeart className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Your wishlist is empty</h2>
          <p className="text-gray-600 text-sm">
            Double-tap or heart any product to save it here and grab it later.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/products"
              className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Browse products
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-full border text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Saved for later</p>
            <h1 className="text-3xl font-bold text-gray-900">Wishlist</h1>
            <p className="text-sm text-gray-600 mt-1">Double-click any product to toggle wishlist.</p>
          </div>
          <button
            onClick={clearWishlist}
            className="text-sm font-semibold text-gray-600 hover:text-red-500 inline-flex items-center gap-2"
          >
            <FiTrash2 /> Clear all
          </button>
        </div>

        <AnimatePresence>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
            {wishlist.map((item) => {
              const id = item._id || item.id;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -4 }}
                  className="card-surface rounded-xl overflow-hidden shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] relative"
                >
                  <Link to={`/product/${id}`}>
                    <div className="aspect-[4/3] w-full bg-gray-200 overflow-hidden">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover transition duration-300 hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                  </Link>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{item.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">₹{item.price?.toFixed?.(2) || item.price}</p>
                      </div>
                      <button
                        onClick={() => removeFromWishlist(id)}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Remove from wishlist"
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 text-white text-xs sm:text-sm font-semibold py-2 px-3 hover:bg-indigo-700 whitespace-nowrap"
                      >
                        Add
                      </button>
                      <Link
                        to={`/product/${id}`}
                        className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 text-center sm:text-left"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Wishlist;

