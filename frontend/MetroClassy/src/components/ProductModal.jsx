import { motion } from "framer-motion";
import { getImageUrl } from "../utils/imageUtils";
import { FiX, FiShoppingCart, FiHeart, FiStar } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useNavigate } from "react-router-dom";

const ProductModal = ({ product, onClose }) => {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const navigate = useNavigate();

    if (!product) return null;

    const pid = product._id || product.id;
    const wished = isInWishlist(pid);

    return (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
                layoutId={`card-${pid}`}
                className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row max-h-[90vh]"
                initial={{ borderRadius: 12 }} // Match grid card
                animate={{ borderRadius: 24 }} // Modal radius
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full text-white/80 transition-colors"
                >
                    <FiX size={24} />
                </button>

                {/* Left: Image (Hero) */}
                <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-100 dark:bg-slate-800">
                    <motion.img
                        layoutId={`image-${pid}`}
                        src={getImageUrl(product.images?.[0] || product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/600x600?text=No+Image';
                        }}
                    />

                    {/* Floating Actions on Image */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white"
                        >
                            {product.category}
                        </motion.div>
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(product);
                            }}
                            className={`p-2 rounded-full backdrop-blur-md transition-colors ${wished ? 'bg-pink-500/80 text-white' : 'bg-black/30 text-white hover:bg-black/50'
                                }`}
                        >
                            <FiHeart className={wished ? 'fill-current' : ''} />
                        </motion.button>
                    </div>
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                                {product.name}
                            </h2>
                            <div className="flex items-center gap-1 text-yellow-400">
                                <FiStar className="fill-current" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-1">
                                    {product.rating || 4.5}
                                </span>
                            </div>
                        </div>

                        <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-6">
                            ₹{product.price}
                        </p>

                        <div className="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-300 mb-8 max-h-40 overflow-y-auto custom-scrollbar">
                            <p>{product.description || "Experience premium quality and timeless design. This product is crafted with attention to detail and designed to elevate your lifestyle."}</p>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto space-y-3">
                            <button
                                onClick={() => {
                                    addToCart(product);
                                    onClose();
                                }}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FiShoppingCart />
                                Add to Cart
                            </button>

                            <button
                                onClick={() => navigate(`/product/${pid}`)}
                                className="w-full py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                            >
                                View Full Details
                            </button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProductModal;
