import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, 
  ActivityIndicator, RefreshControl, TextInput, FlatList, KeyboardAvoidingView, Platform,
  StatusBar
} from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import apiClient from '../../../api/apiClient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../../constants/theme';

const SellerInventoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modifiedStocks, setModifiedStocks] = useState({}); // { productId: newStock }
  const [saving, setSaving] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      const response = await apiClient.get('/products/seller/inventory');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Could not fetch your inventory at this time.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleStockChange = (id, change) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const currentStock = modifiedStocks[id] !== undefined ? modifiedStocks[id] : product.stock;
    const newStock = Math.max(0, currentStock + change);
    
    if (newStock === product.stock) {
      const newModified = { ...modifiedStocks };
      delete newModified[id];
      setModifiedStocks(newModified);
    } else {
      setModifiedStocks({ ...modifiedStocks, [id]: newStock });
    }
  };

  const saveChanges = async () => {
    if (Object.keys(modifiedStocks).length === 0) return;
    
    setSaving(true);
    try {
      const updates = Object.entries(modifiedStocks).map(([id, stock]) => ({ id, stock }));
      await apiClient.patch('/products/seller/inventory/bulk', { updates });
      
      Toast.show({
        type: 'success',
        text1: 'Inventory Updated',
        text2: `${updates.length} products updated successfully.`
      });
      
      setModifiedStocks({});
      await fetchInventory();
    } catch (error) {
      console.error('Error saving inventory:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Please check your connection and try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: products.length,
    low: products.filter(p => p.stock > 0 && p.stock < 10).length,
    out: products.filter(p => p.stock <= 0).length
  };

  const renderProductItem = ({ item }) => {
    const currentStock = modifiedStocks[item.id] !== undefined ? modifiedStocks[item.id] : item.stock;
    const isModified = modifiedStocks[item.id] !== undefined;
    
    let statusColor = COLORS.success;
    let statusText = 'Health: Optimal';
    if (currentStock <= 0) {
      statusColor = COLORS.error;
      statusText = 'Out of Stock';
    } else if (currentStock < 10) {
      statusColor = COLORS.accent;
      statusText = 'Critical Level';
    }

    return (
      <View style={[styles.productCard, isModified && styles.modifiedCard]}>
        <View style={styles.productMain}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.unit}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.stockControlRow}>
          <View style={styles.stockProgressContainer}>
            <View style={styles.stockHeader}>
              <Text style={styles.stockValue}>{currentStock}</Text>
              <Text style={styles.stockLabel}>Units Available</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.min(100, (currentStock / 50) * 100)}%`, backgroundColor: statusColor }
                ]} 
              />
            </View>
          </View>

          <View style={styles.adjuster}>
            <TouchableOpacity 
              onPress={() => handleStockChange(item.id, -1)}
              style={styles.adjustBtn}
            >
              <Feather name="minus" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.adjustValueBox}>
              <Text style={[styles.adjustValue, isModified && { color: COLORS.primary }]}>
                {currentStock}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleStockChange(item.id, 1)}
              style={[styles.adjustBtn, styles.plusBtn]}
            >
              <Feather name="plus" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading warehouse status...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Warehouse Manager</Text>
        <TouchableOpacity 
          onPress={saveChanges}
          disabled={Object.keys(modifiedStocks).length === 0 || saving}
          style={[
            styles.saveBtn, 
            (Object.keys(modifiedStocks).length === 0 || saving) && styles.saveBtnDisabled
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {[
            { label: 'Total SKUs', value: stats.total, color: COLORS.primary, icon: 'inventory' },
            { label: 'Low Stock', value: stats.low, color: COLORS.accent, icon: 'warning' },
            { label: 'Out of Stock', value: stats.out, color: COLORS.error, icon: 'block' }
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <MaterialIcons name={stat.icon} size={16} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search catalog by name..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchInventory();
            }} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory-2" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No products found matching your search.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 16, color: COLORS.textMuted, fontSize: 14, ...FONTS.medium },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  saveBtn: { 
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, 
    borderRadius: 12, minWidth: 80, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm
  },
  saveBtnDisabled: { backgroundColor: '#E2E8F0', elevation: 0, shadowOpacity: 0 },
  saveBtnText: { color: COLORS.white, fontSize: 14, ...FONTS.bold },

  content: { flex: 1, paddingHorizontal: 20 },
  
  statsContainer: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 },
  statCard: { 
    flex: 1, backgroundColor: COLORS.white, padding: 12, borderRadius: 20, 
    borderWidth: 1, borderColor: '#F1F5F9', ...SHADOWS.sm 
  },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, ...FONTS.medium },

  searchContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
    marginBottom: 20
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, height: 48, fontSize: 14, ...FONTS.medium, color: COLORS.textPrimary },

  listContent: { paddingBottom: 40 },
  productCard: { 
    backgroundColor: COLORS.white, borderRadius: 24, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9', ...SHADOWS.sm
  },
  modifiedCard: { borderColor: COLORS.primary, borderWidth: 1.5 },
  productMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  productCategory: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, ...FONTS.bold },

  stockControlRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stockProgressContainer: { flex: 1 },
  stockHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 },
  stockValue: { fontSize: 20, ...FONTS.extraBold, color: COLORS.textPrimary },
  stockLabel: { fontSize: 11, color: COLORS.textMuted, ...FONTS.medium },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  adjuster: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 4 },
  adjustBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  plusBtn: { backgroundColor: COLORS.primary },
  adjustValueBox: { width: 44, alignItems: 'center' },
  adjustValue: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginHorizontal: 40 },
});

export default SellerInventoryScreen;
