import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from './AuthContext';
import Toast from 'react-native-toast-message';

const AddressContext = createContext();

export function AddressProvider({ children }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setAddresses([]);
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/addresses');
      setAddresses(response.data);
    } catch (error) {
      console.error('Fetch addresses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async (addressData) => {
    try {
      const response = await apiClient.post('/addresses', addressData);
      setAddresses(prev => [response.data, ...prev.filter(a => !response.data.isDefault || !a.isDefault)]);
      Toast.show({ type: 'success', text1: 'Address Added ✓' });
      return { success: true, address: response.data };
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add address' });
      return { success: false };
    }
  };

  const deleteAddress = async (id) => {
    try {
      await apiClient.delete(`/addresses/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
      Toast.show({ type: 'success', text1: 'Address Deleted' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete address' });
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      const response = await apiClient.patch(`/addresses/${id}/default`);
      setAddresses(prev => prev.map(a => ({
        ...a,
        isDefault: a.id === id
      })));
      Toast.show({ type: 'success', text1: 'Default Address Updated' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to set default' });
    }
  };

  const updateAddress = async (id, addressData) => {
    try {
      const response = await apiClient.patch(`/addresses/${id}`, addressData);
      setAddresses(prev => prev.map(a => a.id === id ? response.data : a));
      Toast.show({ type: 'success', text1: 'Address Updated ✓' });
      return { success: true, address: response.data };
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update address' });
      return { success: false };
    }
  };

  return (
    <AddressContext.Provider value={{ 
      addresses, 
      loading, 
      fetchAddresses, 
      addAddress, 
      updateAddress,
      deleteAddress, 
      setDefaultAddress 
    }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddresses() {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddresses must be used within an AddressProvider');
  }
  return context;
}
