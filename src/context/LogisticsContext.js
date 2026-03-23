import React, { createContext, useContext, useState, useCallback } from 'react';
import apiClient from '../api/apiClient';

const LogisticsContext = createContext();

export function LogisticsProvider({ children }) {
  const [providers, setProviders] = useState([]);
  const [shipments, setShipments] = useState({}); // orderId -> shipment
  const [history, setHistory] = useState({}); // shipmentId -> updates[]
  const [loading, setLoading] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const response = await apiClient.get('/logistics/providers');
      setProviders(response.data);
    } catch (error) {
      console.error('Fetch providers failed:', error);
    }
  }, []);

  const getShipmentByOrder = useCallback(async (orderId) => {
    try {
      const response = await apiClient.get(`/logistics/track/order/${orderId}`);
      setShipments(prev => ({ ...prev, [orderId]: response.data }));
      return response.data;
    } catch (error) {
      console.error('Fetch shipment failed:', error);
      return null;
    }
  }, []);

  const fetchShipmentHistory = useCallback(async (shipmentId) => {
    try {
      const response = await apiClient.get(`/logistics/${shipmentId}/history`);
      setHistory(prev => ({ ...prev, [shipmentId]: response.data }));
      return response.data;
    } catch (error) {
      console.error('Fetch history failed:', error);
      return [];
    }
  }, []);

  const assignShipment = async (orderId, providerId) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/logistics/ship', { orderId, providerId });
      setShipments(prev => ({ ...prev, [orderId]: response.data }));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Assignment failed' };
    } finally {
      setLoading(false);
    }
  };

  const simulateTracking = async (trackingNumber) => {
    try {
      await apiClient.post(`/logistics/${trackingNumber}/simulate`);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  };

  return (
    <LogisticsContext.Provider value={{
      providers,
      shipments,
      history,
      loading,
      fetchProviders,
      getShipmentByOrder,
      fetchShipmentHistory,
      assignShipment,
      simulateTracking,
    }}>
      {children}
    </LogisticsContext.Provider>
  );
}

export function useLogistics() {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
}
