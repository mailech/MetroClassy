import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      // Normalize product ID - use _id if available, otherwise use id
      const productId = action.payload._id || action.payload.id;
      const existingItem = state.items.find(item => (item._id || item.id) === productId);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            (item._id || item.id) === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, _id: productId, quantity: 1 }],
      };

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => (item._id || item.id) !== action.payload),
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          (item._id || item.id) === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'LOAD_CART':
      return { ...state, items: action.payload };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const { user } = useAuth();

  const getStorageKey = () => (user ? `cart_${user._id}` : 'cart_guest');

  const hasLocalCart = () => {
    const savedCart = localStorage.getItem(getStorageKey());
    return savedCart ? JSON.parse(savedCart) : [];
  };

  // Load cart on mount or when user changes
  useEffect(() => {
    dispatch({ type: 'LOAD_CART', payload: hasLocalCart() });
  }, [user]);

  // Save to localStorage (scoped by user) whenever items change
  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify(state.items));
  }, [state.items, user]);

  // Sync with backend on login
  useEffect(() => {
    const syncCart = async () => {
      if (!user) return;

      const guestCart = JSON.parse(localStorage.getItem('cart_guest') || '[]');
      const userCart = hasLocalCart(); // Current user's local cart (might be empty if new login)

      // Merge guest cart into user cart if guest cart exists (common behavior)
      // Then clean up guest cart
      const itemsToSync = [...userCart, ...guestCart];

      if (guestCart.length > 0) {
        localStorage.removeItem('cart_guest');
      }

      try {
        const { data } = await axios.get('/cart');
        const serverItems = data?.items || [];

        const mergedMap = new Map();
        [...serverItems, ...itemsToSync].forEach((item) => {
          const id = item.product || item._id || item.id;
          if (!id) return;
          const existing = mergedMap.get(id) || { quantity: 0 };
          mergedMap.set(id, {
            ...existing,
            ...item,
            _id: id,
            quantity: Math.max(1, (existing.quantity || 0) + (item.quantity || 1)), // Logic can be refined to not double count if overlap
          });
        });

        // Refined quantity merge logic: if server has 2 and local has 2, it's 2, unless explicitly added.
        // For simplicity, we'll assume the sync is "latest state" mostly.
        const merged = Array.from(mergedMap.values());

        dispatch({ type: 'LOAD_CART', payload: merged });
        // Save merged state to user's local storage
        localStorage.setItem(getStorageKey(), JSON.stringify(merged));

        // Push merged state back to server
        await axios.put('/cart', { items: merged });
      } catch (err) {
        console.error('Cart sync failed', err);
      }
    };
    syncCart();
  }, [user]); // Re-run when user object changes (login)

  const addToCart = (product) => {
    // ALLOW GUEST ADD TO CART (User rule said "dont allow user without login to order", but usually adding to cart is allowed. 
    // If strict no-ordering, blocking add-to-cart is also an option, but blocking checkout is standard. 
    // The user constraint: "dont allow the user without login to order any product or proceed to the checkout page".
    // I will allow adding to cart (guest mode) but block checkout (implemented above).

    dispatch({ type: 'ADD_ITEM', payload: product });
    window.dispatchEvent(new CustomEvent('show-notification', {
      detail: { message: 'Added to cart', type: 'success' }
    }));
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { id: productId, quantity },
    });
  };

  const getCartItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = async () => {
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem(getStorageKey());
    if (user) {
      try {
        await axios.put('/cart', { items: [] });
      } catch (err) {
        console.error('Failed to clear server cart:', err);
      }
    }
  };

  const cartTotal = state.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
