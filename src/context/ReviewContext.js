import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import apiClient from '../api/apiClient';

const ReviewContext = createContext();

function reviewReducer(state, action) {
  switch (action.type) {
    case 'SET_PRODUCT_REVIEWS':
      return { 
        ...state, 
        productReviews: { ...state.productReviews, [action.productId]: action.payload } 
      };
    case 'SET_SELLER_REVIEWS':
      return { 
        ...state, 
        sellerReviews: { ...state.sellerReviews, [action.sellerId]: action.payload } 
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function ReviewProvider({ children }) {
  const [state, dispatch] = useReducer(reviewReducer, {
    productReviews: {},
    sellerReviews: {},
    loading: false,
  });

  const fetchProductReviews = useCallback(async (productId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.get(`/reviews/product/${productId}`);
      dispatch({ type: 'SET_PRODUCT_REVIEWS', productId, payload: response.data });
    } catch (error) {
      console.error('Error fetching product reviews:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const fetchSellerReviews = useCallback(async (sellerId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.get(`/reviews/seller/${sellerId}`);
      dispatch({ type: 'SET_SELLER_REVIEWS', sellerId, payload: response.data });
    } catch (error) {
      console.error('Error fetching seller reviews:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const submitProductReview = async (productId, rating, comment) => {
    try {
      const response = await apiClient.post(`/reviews/product/${productId}`, { rating, comment });
      await fetchProductReviews(productId);
      return response.data;
    } catch (error) {
      console.error('Error submitting product review:', error);
      throw error;
    }
  };

  const submitSellerReview = async (sellerId, rating, comment) => {
    try {
      const response = await apiClient.post(`/reviews/seller/${sellerId}`, { rating, comment });
      await fetchSellerReviews(sellerId);
      return response.data;
    } catch (error) {
      console.error('Error submitting seller review:', error);
      throw error;
    }
  };

  const getProductReviews = useCallback((id) => state.productReviews[id] || [], [state.productReviews]);
  const getSellerReviews = useCallback((id) => state.sellerReviews[id] || [], [state.sellerReviews]);
  
  const getReviewCount = useCallback((id, fallback = 0) => {
    const reviews = state.productReviews[id];
    return reviews ? reviews.length : (typeof fallback === 'number' ? fallback : 0);
  }, [state.productReviews]);

  const getAverageRating = useCallback((id, fallback = 4.5) => {
    const reviews = state.productReviews[id];
    if (!reviews || reviews.length === 0) return fallback;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [state.productReviews]);

  const value = useMemo(() => ({
    ...state,
    fetchProductReviews,
    fetchSellerReviews,
    submitProductReview,
    submitSellerReview,
    getProductReviews,
    getSellerReviews,
    getReviewCount,
    getAverageRating,
  }), [
    state,
    fetchProductReviews,
    fetchSellerReviews,
    submitProductReview,
    submitSellerReview,
    getProductReviews,
    getSellerReviews,
    getReviewCount,
    getAverageRating,
  ]);

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
}
