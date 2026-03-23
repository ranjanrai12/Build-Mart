import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

function orderReducer(state, action) {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload, loading: false };
    case 'ADD_ORDERS':
      return { ...state, orders: [...action.payload, ...state.orders] };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.payload.id ? action.payload : o),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_REVENUE_METRICS':
      return { ...state, revenueMetrics: action.payload };
    default:
      return state;
  }
}

const ORDER_STATUSES = ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'];

export function OrderProvider({ children }) {
  const [state, dispatch] = useReducer(orderReducer, { 
    orders: [], 
    loading: true,
    revenueMetrics: { chartData: [], growthText: '0% vs last week', currentTotal: 0 }
  });
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const endpoint = user.role === 'seller' ? '/orders/seller' : '/orders/buyer';
      const response = await apiClient.get(endpoint);
      dispatch({ type: 'SET_ORDERS', payload: response.data });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const placeOrder = async (cartItems, { address, paymentMethod, deliveryFee }) => {
    if (!cartItems || cartItems.length === 0) return [];
    
    try {
      const payload = {
        items: cartItems.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          sellerId: i.sellerId
        })),
        address,
        paymentMethod,
        deliveryFee
      };

      const response = await apiClient.post('/orders', payload);
      dispatch({ type: 'ADD_ORDERS', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      if (error.response?.status === 404) {
        Toast.show({ 
          type: 'error', 
          text1: 'Checkout Error', 
          text2: 'Session expired or user not found. Please re-login.' 
        });
      } else {
        Toast.show({ 
          type: 'error', 
          text1: 'Order Failed', 
          text2: error.response?.data?.message || 'Please try again later.' 
        });
      }
      throw error;
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const response = await apiClient.put(`/orders/${orderId}/status`, { status });
      dispatch({ type: 'UPDATE_ORDER', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const rejectOrder = (orderId) => {
    return updateStatus(orderId, 'Rejected');
  };

  const advanceStatus = async (orderId) => {
    const order = state.orders.find(o => o.id === orderId);
    if (!order || order.status === 'Rejected') return;
    
    const currentIndex = ORDER_STATUSES.indexOf(order.status);
    if (currentIndex !== -1 && currentIndex < ORDER_STATUSES.length - 1) {
      return updateStatus(orderId, ORDER_STATUSES[currentIndex + 1]);
    }
  };

  const fetchRevenueMetrics = useCallback(async () => {
    if (!user || user.role !== 'seller') return;
    try {
      const response = await apiClient.get('/orders/seller/revenue-metrics');
      dispatch({ type: 'SET_REVENUE_METRICS', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
    }
  }, [user]);

  const fetchOrderById = useCallback(async (orderId) => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      dispatch({ type: 'UPDATE_ORDER', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      return null;
    }
  }, []);

  const sellerOrders = (sellerId) => state.orders.filter(o => o.sellerId === sellerId);
  const buyerOrders = (buyerId) => state.orders.filter(o => o.buyerId === buyerId);

  const fetchProviders = async () => {
    try {
      const response = await apiClient.get('/logistics/providers');
      return response.data;
    } catch (error) {
      console.error('Error fetching providers:', error);
      return [];
    }
  };

  const shipOrder = async (orderId, providerId) => {
    try {
      const response = await apiClient.post('/logistics/ship', { orderId, providerId });
      // Reload the order to get the updated status (Dispatched)
      await fetchOrderById(orderId);
      return response.data;
    } catch (error) {
      console.error('Error shipping order:', error);
      throw error;
    }
  };

  const fetchShipment = async (orderId) => {
    try {
      const response = await apiClient.get(`/logistics/track/order/${orderId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching shipment:', error);
      }
      return null;
    }
  };

  return (
    <OrderContext.Provider value={{ 
      ...state, 
      placeOrder, 
      advanceStatus, 
      updateStatus, 
      rejectOrder, 
      sellerOrders, 
      buyerOrders,
      fetchOrderById,
      fetchRevenueMetrics,
      fetchProviders,
      shipOrder,
      fetchShipment,
      refreshOrders: fetchOrders 
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
