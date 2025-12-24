import { createContext, useContext, useEffect, useReducer } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD':
      return action.payload || [];
    case 'TOGGLE': {
      const id = action.payload._id || action.payload.id;
      if (!id) return state;
      const exists = state.some((item) => (item._id || item.id) === id);
      return exists
        ? state.filter((item) => (item._id || item.id) !== id)
        : [...state, { ...action.payload, _id: id }];
    }
    case 'REMOVE':
      return state.filter((item) => (item._id || item.id) !== action.payload);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
};

export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, []);
  const { user } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      dispatch({ type: 'LOAD', payload: JSON.parse(saved) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(state));
  }, [state]);

  const toggleWishlist = (product) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('show-notification', {
        detail: { message: 'Please login to use wishlist', type: 'error' }
      }));
      return;
    }
    if (!product) return;
    dispatch({ type: 'TOGGLE', payload: product });
  };

  const removeFromWishlist = (productId) => {
    dispatch({ type: 'REMOVE', payload: productId });
  };

  const clearWishlist = () => dispatch({ type: 'CLEAR' });

  const isInWishlist = (productId) =>
    state.some((item) => (item._id || item.id) === productId);

  return (
    <WishlistContext.Provider
      value={{ wishlist: state, toggleWishlist, removeFromWishlist, clearWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};

export default WishlistContext;

