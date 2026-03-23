import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useOrders } from '../../../context/OrderContext';
import { useQuotes } from '../../../context/QuoteContext';
import apiClient from '../../../api/apiClient';
import { COLORS } from '../../../constants/theme';

export function useSellerDashboard() {
  const { user, updateUser } = useAuth();
  const { sellerOrders, revenueMetrics, fetchRevenueMetrics } = useOrders();
  const { getQuotesBySeller } = useQuotes();
  const [myProducts, setMyProducts] = useState([]);

  const sellerId = user?.id || 's1';

  const fetchSellerData = async () => {
    try {
      if (user?.role === 'seller') {
        const productRes = await apiClient.get('/products/seller/inventory');
        setMyProducts(productRes.data);
        fetchRevenueMetrics();
      }
    } catch (error) {
      console.error('Error fetching seller dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, [user?.role]);

  const orders = useMemo(() =>
    sellerOrders(sellerId).filter(o => o.status !== 'Rejected')
    , [sellerOrders, sellerId]);

  const sellerQuotes = useMemo(() => getQuotesBySeller(sellerId), [getQuotesBySeller, sellerId]);

  // Basic Stats
  const totalRevenue = useMemo(() =>
    orders.filter(o => o.status === 'Delivered').reduce((sum, order) => sum + order.total, 0)
    , [orders]);

  const outOfStock = useMemo(() =>
    myProducts.filter(p => p.stock <= 0).length
    , [myProducts]);

  const lowStockItems = useMemo(() =>
    myProducts.filter(p => p.stock > 0 && p.stock < 10)
    , [myProducts]);

  // Performance & Analytics
  const monthlyTarget = 500000;
  const targetProgress = Math.min((totalRevenue / monthlyTarget) * 100, 100);

  const fulfillmentRate = useMemo(() =>
    orders.length > 0 ?
      Math.round((orders.filter(o => o.status === 'Delivered').length / orders.length) * 100) : 100
    , [orders]);

  const performanceStats = [
    { label: 'Fulfillment', value: `${fulfillmentRate}%`, icon: 'speed' },
    { label: 'Avg Rating', value: user?.rating || '4.8', icon: 'star' },
    { label: 'Response', value: '< 2h', icon: 'schedule' },
    { label: 'Accuracy', value: '96%', icon: 'verified' },
  ];

  // Retention
  const returningCustomers = Math.round(orders.length * 0.4);
  const newCustomers = orders.length - returningCustomers;

  // B2B Quotes
  const pendingQuotes = useMemo(() =>
    sellerQuotes.filter(q => q.status === 'Pending')
    , [sellerQuotes]);

  // Store Management
  const isStoreOpen = user?.isStoreOpen !== false;
  const toggleStoreStatus = () => {
    updateUser({ isStoreOpen: !isStoreOpen });
  };

  // Recent Orders
  const activeOrder = orders.find(o => o.status !== 'Delivered' && o.status !== 'Rejected');
  const recentOrders = useMemo(() => [...orders].reverse().slice(0, 5), [orders]);

  // Category Insights: Revenue by Category
  const revByCat = useMemo(() => {
    const categoryRevenue = {};
    orders.forEach(o => {
      o.items?.forEach(item => {
        const categoryName = item.product?.category?.name || 'Others';
        categoryRevenue[categoryName] = (categoryRevenue[categoryName] || 0) + (item.price * item.quantity);
      });
    });

    const maxRev = Math.max(...Object.values(categoryRevenue), 1);
    return Object.entries(categoryRevenue).map(([name, rev]) => ({
      name, rev,
      percent: (rev / maxRev) * 100,
    })).sort((a, b) => b.rev - a.rev).slice(0, 3);
  }, [orders]);

  // Analytics: Top Selling Products
  const topSellers = useMemo(() => {
    const productSales = {};
    orders.forEach(o => {
      o.items?.forEach(item => {
        const name = item.product?.name || item.name || 'Unknown Product';
        productSales[name] = (productSales[name] || 0) + item.quantity;
      });
    });
    return Object.entries(productSales)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);
  }, [orders]);

  // Main stats display array
  const dashboardStats = [
    {
      icon: 'receipt-long', label: 'Total Orders', value: orders.length,
      color: '#3498DB', bg: '#EBF5FB', screen: 'SellerOrders', params: { initialTab: 'Placed' }
    },
    {
      icon: 'attach-money', label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`,
      color: '#27AE60', bg: '#EAF7F0', screen: 'SellerOrders', params: { initialTab: 'Delivered' }
    },
    {
      icon: 'local-shipping', label: 'Logistics', value: orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered').length,
      color: COLORS.accent, bg: '#F0F9FF', screen: 'LogisticsHub'
    },
    {
      icon: 'inventory', label: 'Products', value: myProducts.length,
      color: '#8E44AD', bg: '#F5EEF8', screen: 'Products'
    },
    {
      icon: 'warning', label: 'Out of Stock', value: outOfStock,
      color: COLORS.error, bg: '#FDEDEC', screen: 'Products'
    },
  ];

  return {
    user,
    isStoreOpen,
    toggleStoreStatus,
    dashboardStats,
    totalRevenue,
    monthlyTarget,
    targetProgress,
    activeOrder,
    performanceStats,
    sellerQuotes,
    pendingQuotes,
    newCustomers,
    returningCustomers,
    lowStockItems,
    recentOrders,
    revByCat,
    topSellers,
    revenueMetrics,
  };
}
