import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [history, setHistory] = useState([]);

  // Load from storage on init
  useEffect(() => {
    (async () => {
      try {
        const storedWish = await AsyncStorage.getItem('@buildmart_wishlist');
        if (storedWish) setWishlist(JSON.parse(storedWish));
        
        const storedHist = await AsyncStorage.getItem('@buildmart_history');
        if (storedHist) setHistory(JSON.parse(storedHist));
      } catch (e) { console.error('Storage init error:', e); }
    })();
  }, []);

  const toggleWishlist = useCallback(async (productId) => {
    try {
      setWishlist(prev => {
        const next = prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId];
        AsyncStorage.setItem('@buildmart_wishlist', JSON.stringify(next));
        return next;
      });
    } catch (e) { console.error('Toggle wishlist error:', e); }
  }, []);

  const addToHistory = useCallback(async (productId) => {
    try {
      setHistory(prev => {
        const next = [productId, ...prev.filter(id => id !== productId)].slice(0, 10);
        AsyncStorage.setItem('@buildmart_history', JSON.stringify(next));
        return next;
      });
    } catch (e) { console.error('Add history error:', e); }
  }, []);

  const isInWishlist = useCallback((productId) => wishlist.includes(productId), [wishlist]);

  const value = useMemo(() => ({ 
    wishlist, history, toggleWishlist, isInWishlist, addToHistory 
  }), [wishlist, history, toggleWishlist, isInWishlist, addToHistory]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
