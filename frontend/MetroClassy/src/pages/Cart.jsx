import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiArrowLeft, FiCreditCard } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUtils';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-1 text-gray-500">Start shopping to add items to your cart.</p>
            <div className="mt-6">
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Shopping Cart
          </h1>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your entire cart?')) {
                clearCart();
              }
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <FiTrash2 className="mr-2 h-4 w-4 text-red-500" />
            Clear Cart
          </button>
        </div>

        <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          {/* Cart items */}
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">
              Items in your shopping cart
            </h2>

            <motion.ul
              layout
              className="border-t border-b border-gray-200 dark:border-white/10 divide-y divide-gray-200 dark:divide-white/10"
            >
              {cartItems.map((item) => {
                const itemId = item._id || item.id;
                return (
                  <motion.li
                    key={`${itemId}-${item.selectedSize}-${item.selectedColor}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                    className="flex py-6 sm:py-10"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-24 h-24 rounded-md object-cover object-center sm:w-32 sm:h-32"
                      />
                    </div>

                    <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                      <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm">
                              <Link
                                to={`/product/${itemId}`}
                                className="font-medium text-gray-700 hover:text-gray-800 dark:text-gray-200 dark:hover:text-white"
                              >
                                {item.name}
                              </Link>
                            </h3>
                          </div>
                          <div className="mt-1 flex text-sm">
                            {item.selectedColor && (
                              <p className="text-gray-500 dark:text-gray-400">Color: {item.selectedColor}</p>
                            )}
                            {item.selectedSize && (
                              <p className="ml-4 pl-4 text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-white/10">
                                Size: {item.selectedSize}
                              </p>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            ₹{item.price.toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:pr-9">
                          <div className="flex items-center">
                            <label htmlFor={`quantity-${itemId}`} className="sr-only">
                              Quantity, {item.name}
                            </label>
                            <select
                              id={`quantity-${itemId}`}
                              name={`quantity-${itemId}`}
                              className="max-w-full rounded-md border border-gray-300 dark:border-slate-600 py-1.5 text-left text-base font-medium leading-5 text-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-slate-800"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(itemId, parseInt(e.target.value))
                              }
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 sm:ml-6"
                              onClick={() => removeFromCart(itemId)}
                            >
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          </section>

          {/* Order summary */}
          <section
            aria-labelledby="summary-heading"
            className="mt-16 card-surface rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900 dark:text-white">
              Order summary
            </h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-400">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  ₹{cartTotal.toFixed(2)}
                </dd>
              </div>
              <div className="border-t border-gray-200 dark:border-white/10 pt-4 flex items-center justify-between">
                <dt className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>Shipping estimate</span>
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {cartTotal > 0 ? '₹149.00' : '₹0.00'}
                </dd>
              </div>
              <div className="border-t border-gray-200 dark:border-white/10 pt-4 flex items-center justify-between">
                <dt className="text-base font-medium text-gray-900 dark:text-white">
                  Order total
                </dt>
                <dd className="text-base font-medium text-gray-900 dark:text-white">
                  ₹{(cartTotal + (cartTotal > 0 ? 149 : 0)).toFixed(2)}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${isCheckingOut
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isCheckingOut ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiCreditCard className="mr-2 h-5 w-5" />
                    Checkout
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center text-sm">
              <p>
                or{' '}
                <Link
                  to="/products"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Continue Shopping<span aria-hidden="true"> &rarr;</span>
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Cart;
