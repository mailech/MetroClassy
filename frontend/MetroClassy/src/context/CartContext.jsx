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

  // Save to localStorage (scoped by user) AND Sync with Backend whenever items change
  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify(state.items));

    // Auto-sync with backend if user is logged in (Debounced)
    if (user && state.items.length >= 0) {
      const timeoutId = setTimeout(() => {
        axios.put('/cart', { items: state.items })
          .catch(err => console.error('Background cart sync failed', err));
      }, 1000); // Debounce for 1 second
      return () => clearTimeout(timeoutId);
    }
  }, [state.items, user]);

  // Initial Cart Load & Merge on Login
  useEffect(() => {
    let mounted = true;

    const initializeCart = async () => {
      // 1. Get Guest Cart
      const guestCart = JSON.parse(localStorage.getItem('cart_guest') || '[]');

      // 2. If no user, just load guest cart
      if (!user) {
        if (mounted) dispatch({ type: 'LOAD_CART', payload: guestCart });
        return;
      }

      // 3. If User Logged In: Fetch Server Cart and Merge with Guest Cart
      try {
        const { data } = await axios.get('/cart');
        const serverItems = data?.items || [];

        let mergedItems = [...serverItems];

        // Merge guest items into server items if any
        if (guestCart.length > 0) {
          const mergedMap = new Map();
          // Add server items first
          serverItems.forEach(item => {
            const key = item.product || item._id; // product ID is the unique key
            mergedMap.set(key, item);
          });

          // Merge guest items
          guestCart.forEach(gItem => {
            const key = gItem.product || gItem._id || gItem.id;
            if (mergedMap.has(key)) {
              // If exists, prefer server or max logic? Usually just keep server or add quantities.
              // Here we will just keep existing server item to avoid duplicates, 
              // OR add quantities if you want. Let's strictly deduplicate by ID.
            } else {
              mergedMap.set(key, gItem);
            }
          });

          mergedItems = Array.from(mergedMap.values());
          // Clear guest cart after merge
          localStorage.removeItem('cart_guest');

          // Immediately sync merged state to server
          await axios.put('/cart', { items: mergedItems });
        }

        if (mounted) {
          dispatch({ type: 'LOAD_CART', payload: mergedItems });
        }
      } catch (err) {
        console.error('Failed to load/merge cart', err);
      }
    };

    initializeCart();

    return () => { mounted = false; };
  }, [user]); // Only run on mount or login/logout switch

  const addToCart = (product) => {
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

  const clearCart = async () => {
    dispatch({ type: 'CLEAR_CART' });
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
