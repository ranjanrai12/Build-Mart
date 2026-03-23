import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from './AuthContext';

const QuoteContext = createContext();

export const QuoteProvider = ({ children }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchQuotes = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const endpoint = user.role === 'seller' ? '/quotes/seller' : '/quotes/buyer';
      const response = await apiClient.get(endpoint);
      setQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const submitQuoteRequest = async (data) => {
    try {
      const response = await apiClient.post('/quotes', {
        productId: data.productId,
        quantity: data.quantity,
        notes: data.notes || '',
      });
      const newQuote = response.data;
      setQuotes(prev => [newQuote, ...prev]);
      return newQuote;
    } catch (error) {
      console.error('Error submitting quote request:', error);
      throw error;
    }
  };

  const updateQuoteStatus = async (quoteId, status, extraData = {}) => {
    try {
      const response = await apiClient.put(`/quotes/${quoteId}/status`, { 
        status,
        ...extraData 
      });
      const updatedQuote = response.data;
      setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
      return updatedQuote;
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw error;
    }
  };

  const respondToQuote = async (quoteId, data) => {
    try {
      const response = await apiClient.post(`/quotes/${quoteId}/respond`, data);
      const updatedQuote = response.data;
      setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
      return updatedQuote;
    } catch (error) {
      console.error('Error responding to quote:', error);
      throw error;
    }
  };

  const acceptQuote = async (quoteId) => {
    try {
      const response = await apiClient.post(`/quotes/${quoteId}/accept`);
      const updatedQuote = response.data;
      setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
      return updatedQuote;
    } catch (error) {
      console.error('Error accepting quote:', error);
      throw error;
    }
  };

  const acceptQuoteBySeller = async (quoteId) => {
    try {
      const response = await apiClient.post(`/quotes/${quoteId}/accept-seller`);
      const updatedQuote = response.data;
      setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
      return updatedQuote;
    } catch (error) {
      console.error('Error accepting quote by seller:', error);
      throw error;
    }
  };

  const rejectQuoteByBuyer = async (quoteId) => {
    try {
      const response = await apiClient.post(`/quotes/${quoteId}/reject-buyer`);
      const updatedQuote = response.data;
      setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
      return updatedQuote;
    } catch (error) {
      console.error('Error rejecting quote by buyer:', error);
      throw error;
    }
  };

  const getQuotesByBuyer = (buyerId) => quotes.filter(q => q.buyerId === buyerId);
  const getQuotesBySeller = (sellerId) => quotes.filter(q => q.product?.sellerId === sellerId);

  return (
    <QuoteContext.Provider value={{ 
      quotes, 
      loading,
      submitQuoteRequest, 
      updateQuoteStatus,
      respondToQuote,
      acceptQuote,
      acceptQuoteBySeller,
      rejectQuoteByBuyer,
      getQuotesByBuyer,
      getQuotesBySeller,
      refreshQuotes: fetchQuotes
    }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuotes = () => {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuoteProvider');
  }
  return context;
};
