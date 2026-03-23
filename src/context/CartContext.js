import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from './AuthContext';

const CartContext = createContext();

function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD_CART':
      return { ...state, items: action.payload };
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.productId === action.payload.productId);
      if (existing) {
        const newQty = existing.quantity + (action.payload.quantity || 1);
        let newPrice = existing.price;
        
        // GUEST MODE FIX: recalculate price based on tiers if present
        if (existing.pricingTiers?.length > 0) {
          const sorted = [...existing.pricingTiers].sort((a, b) => Number(b.minQty) - Number(a.minQty));
          const tier = sorted.find(t => newQty >= Number(t.minQty));
          newPrice = tier ? Number(tier.price) : Number(existing.basePrice || existing.price);
        }

        return {
          ...state,
          items: state.items.map(i =>
            i.productId === action.payload.productId
              ? { 
                  ...i, 
                  quantity: newQty, 
                  price: newPrice,
                  originalPrice: Number(i.basePrice || i.price)
                }
              : i
          ),
        };
      }
      return { 
        ...state, 
        items: [...state.items, { 
          ...action.payload, 
          quantity: action.payload.quantity || 1,
          originalPrice: Number(action.payload.basePrice || action.payload.price)
        }] 
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.productId !== action.payload) };
    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items.map(i => {
          if (i.productId === action.payload.productId) {
            const newQty = Math.max(1, action.payload.quantity);
            let newPrice = i.price;
            
            // GUEST MODE FIX: recalculate price based on tiers
            if (i.pricingTiers?.length > 0) {
              const sorted = [...i.pricingTiers].sort((a, b) => Number(b.minQty) - Number(a.minQty));
              const tier = sorted.find(t => newQty >= Number(t.minQty));
              newPrice = tier ? Number(tier.price) : Number(i.basePrice || i.price);
            }
            
            return { 
              ...i, 
              quantity: newQty, 
              price: newPrice,
              originalPrice: Number(i.basePrice || i.price)
            };
          }
          return i;
        }),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const { user } = useAuth();

  // Sync with backend on mount or login
  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const response = await apiClient.get('/cart');
      dispatch({ type: 'LOAD_CART', payload: response.data });
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addItem = async (item) => {
    if (user) {
      try {
        await apiClient.post('/cart', item);
        fetchCart(); // Re-sync to get IDs and updated state
      } catch (error) { console.error('Error adding to cart:', error); }
    } else {
      dispatch({ type: 'ADD_ITEM', payload: item });
    }
  };

  const removeItem = async (productId) => {
    if (user) {
      const existing = state.items.find(i => i.productId === productId);
      if (existing?.id) {
        try {
          await apiClient.delete(`/cart/${existing.id}`);
          fetchCart();
        } catch (error) { console.error('Error removing from cart:', error); }
      }
    } else {
      dispatch({ type: 'REMOVE_ITEM', payload: productId });
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (user) {
      const existing = state.items.find(i => i.productId === productId);
      if (existing?.id) {
        try {
          await apiClient.patch(`/cart/${existing.id}`, { quantity });
          fetchCart();
        } catch (error) { console.error('Error updating quantity:', error); }
      }
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await apiClient.delete('/cart');
        dispatch({ type: 'CLEAR_CART' });
      } catch (error) { console.error('Error clearing cart:', error); }
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  };

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
