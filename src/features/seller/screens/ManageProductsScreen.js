import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Switch,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import useCurrency from '../../../hooks/useCurrency';
import EmptyState from '../../../components/shared/EmptyState';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import Toast from 'react-native-toast-message';
import SearchBar from '../../../components/shared/SearchBar';
import apiClient from '../../../api/apiClient';

export default function ManageProductsScreen({ navigation, route }) {
  const { user } = useAuth();
  const { formatINR } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(route.params?.initialFilter === 'lowStock');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await apiClient.get('/products/seller/inventory');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching seller products:', error);
      Toast.show({ type: 'error', text1: 'Fetch Failed', text2: 'Could not load your products.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  useEffect(() => {
    if (route.params?.initialFilter === 'lowStock') {
      setLowStockOnly(true);
    }
  }, [route.params]);

  const toggleStock = async (product) => {
    try {
      const newStock = product.stock === 0 ? 10 : 0; // Simple toggle for 'Available' vs 'Out of Stock'
      await apiClient.patch(`/products/${product.id}`, { stock: newStock });
      fetchProducts();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update Failed' });
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/products/${confirmDelete.id}`);
      setProducts(prev => prev.filter(p => p.id !== confirmDelete.id));
      setConfirmDelete(null);
      Toast.show({ type: 'info', text1: 'Product Removed' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Delete Failed' });
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = lowStockOnly ? (p.stock > 0 && p.stock < 10) : true;
    return matchesSearch && matchesLowStock;
  });

  const activeCount = products.filter(p => p.stock > 0).length;
  const outOfStockCount = products.length - activeCount;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length;

  if (loading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <LinearGradient colors={[COLORS.primary, '#1A2C3F']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>Merchant Inventory</Text>
            <Text style={styles.headerTitle}>My Products</Text>
          </View>
        </View>

        <View style={styles.headerBadgeRow}>
          <View style={[styles.miniBadge, { backgroundColor: COLORS.success + '25' }]}>
            <Text style={[styles.miniBadgeText, { color: COLORS.success }]}>{activeCount} Active</Text>
          </View>
          <View style={[styles.miniBadge, { backgroundColor: COLORS.error + '25' }]}>
            <Text style={[styles.miniBadgeText, { color: COLORS.error }]}>{outOfStockCount} Out</Text>
          </View>
          {lowStockCount > 0 && (
            <TouchableOpacity
              style={[styles.miniBadge, { backgroundColor: lowStockOnly ? COLORS.error : '#F39C1225' }]}
              onPress={() => setLowStockOnly(!lowStockOnly)}
            >
              <Text style={[styles.miniBadgeText, { color: lowStockOnly ? COLORS.white : '#F39C12' }]}>
                {lowStockCount} Low Stock
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search your listings..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
          />
        </View>
      </LinearGradient>

      <FlatList
        data={filteredProducts}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <EmptyState
            icon="inventory"
            title={lowStockOnly ? "No low stock items" : (searchQuery ? "No matches found" : "No products yet")}
            message={lowStockOnly ? "All your inventory is currently healthy." : (searchQuery ? "Try a different search term." : "Start listing your construction materials to reach local buyers.")}
            btnLabel={lowStockOnly ? "Clear Filter" : (searchQuery ? null : "List First Product")}
            onBtnPress={() => lowStockOnly ? setLowStockOnly(false) : navigation.navigate('AddProduct')}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardMain}>
              <View style={styles.iconBox}>
                <MaterialIcons name="inventory-2" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity onPress={() => setConfirmDelete(item)}>
                    <MaterialIcons name="delete-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.price}>{formatINR(item.price)} <Text style={styles.unit}>/ {item.unit}</Text></Text>

                <View style={styles.metaRow}>
                  <View style={styles.ratingBox}>
                    <MaterialIcons name="star" size={14} color="#F39C12" />
                    <Text style={styles.ratingVal}>{item.rating}</Text>
                  </View>
                  <Text style={styles.reviewCount}>{item.reviewsCount} reviews</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <View style={[
                styles.stockStatus,
                { backgroundColor: item.stock <= 0 ? '#FDEDEC' : (item.stock < 10 ? '#FFF9E6' : '#EAF7F0') }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: item.stock <= 0 ? COLORS.error : (item.stock < 10 ? '#F39C12' : COLORS.success) }
                ]} />
                <Text style={[
                  styles.statusLabel,
                  { color: item.stock <= 0 ? COLORS.error : (item.stock < 10 ? '#F39C12' : COLORS.success) }
                ]}>
                  {item.stock <= 0 ? 'Out of Stock' : (item.stock < 10 ? `Low Stock (${item.stock})` : 'Available')}
                </Text>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('AddProduct', { productId: item.id })}>
                  <MaterialIcons name="edit" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <Switch
                  value={item.stock > 0}
                  onValueChange={() => toggleStock(item)}
                  trackColor={{ false: '#ddd', true: 'rgba(39,174,96,0.3)' }}
                  thumbColor={item.stock > 0 ? COLORS.success : '#999'}
                />
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddProduct')} activeOpacity={0.9}>
        <MaterialIcons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>

      <ConfirmModal
        visible={!!confirmDelete}
        title="Delete Listing?"
        message={confirmDelete ? `Are you sure you want to remove "${confirmDelete.name}"? This action cannot be undone.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Remove"
        isDestructive
        icon="delete-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  header: {
    paddingTop: 65, paddingBottom: 24, paddingHorizontal: SIZES.base,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
  },
  headerTop: { marginBottom: 16 },
  headerSubtitle: { fontSize: 12, ...FONTS.medium, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 26, ...FONTS.bold, color: COLORS.white, marginTop: 4 },
  headerBadgeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  miniBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  miniBadgeText: { fontSize: 12, ...FONTS.bold },
  searchContainer: { marginTop: 4 },
  searchBar: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 0, paddingVertical: 12 },
  filterStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E74C3C', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, marginTop: 16, ...SHADOWS.sm,
  },
  filterText: { fontSize: 12, ...FONTS.bold, color: COLORS.white },
  list: { paddingHorizontal: SIZES.base, paddingTop: 20, paddingBottom: 120 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, ...SHADOWS.md,
    marginBottom: SIZES.md, padding: SIZES.md, borderWidth: 1, borderColor: '#F1F5F9',
  },
  cardMain: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  iconBox: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  price: { fontSize: 15, ...FONTS.bold, color: COLORS.primary, marginTop: 4 },
  unit: { fontSize: 12, color: COLORS.textMuted, ...FONTS.medium },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF9E6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingVal: { fontSize: 12, ...FONTS.bold, color: '#F39C12' },
  reviewCount: { fontSize: 12, color: COLORS.textMuted },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  stockStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, ...FONTS.bold },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8FAFC' },
  editBtnText: { fontSize: 12, ...FONTS.semiBold, color: COLORS.textSecondary },
  alertActionBtn: {
    backgroundColor: COLORS.error + '10',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  alertActionText: { fontSize: 12, ...FONTS.bold, color: COLORS.error },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.lg,
  },
});
