import { useCallback } from 'react';

/**
 * Hook for formatting numbers as Indian Rupees (INR).
 * Usage: 
 *   const { formatINR } = useCurrency();
 *   <Text>{formatINR(65000)}</Text> // Output: ₹65,000
 */
export default function useCurrency() {
  const formatINR = useCallback((amount) => {
    if (amount === undefined || amount === null) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  }, []);

  return { formatINR };
}
