import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

/**
 * Hook for interacting with AsyncStorage with automatic JSON serialization.
 */
export default function useStorage() {
  const getItem = useCallback(async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value != null ? JSON.parse(value) : null;
    } catch (e) {
      console.error('Error reading from storage:', e);
      return null;
    }
  }, []);

  const setItem = useCallback(async (key, value) => {
    try {
      const stringValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return true;
    } catch (e) {
      console.error('Error writing to storage:', e);
      return false;
    }
  }, []);

  const removeItem = useCallback(async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from storage:', e);
      return false;
    }
  }, []);

  return { getItem, setItem, removeItem };
}
