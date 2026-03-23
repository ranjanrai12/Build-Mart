import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform, ScrollView, Animated, Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../../api/apiClient';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import SearchBar from '../../../components/shared/SearchBar';
import ProductCard from '../../../components/shared/ProductCard';
import { useCart } from '../../../context/CartContext';
import useDebounce from '../../../hooks/useDebounce';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import { ProductSkeleton } from '../../../components/shared/SkeletonLoader';
import { TextInput } from 'react-native';

export default function ProductListScreen({ navigation, route }) {
  const { categoryId, categoryName, tag, search: initialSearch = '' } = route.params || {};
  const { addItem } = useCart();
  
  const [allProducts, setAllProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 500);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('popular');
  const [isListening, setIsListening] = useState(false);
  const [detectedText, setDetectedText] = useState('');

  // Voice Animation
  const rippleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
  }, [categoryId, debouncedSearch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, sellRes] = await Promise.all([
        apiClient.get('/products', { params: { categoryId } }),
        apiClient.get('/sellers'),
      ]);
      setAllProducts(prodRes.data);
      setSellers(sellRes.data);
    } catch (error) {
      console.error('Error fetching list data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [selectedSellerId, setSelectedSellerId] = useState(null);

  const filtered = useMemo(() => {
    let list = [...allProducts];
    if (tag) list = list.filter(p => p.tags?.includes(tag));
    if (debouncedSearch) list = list.filter(p => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()));

    // Advanced Filters
    if (minPrice) list = list.filter(p => p.price >= parseInt(minPrice));
    if (maxPrice) list = list.filter(p => p.price <= parseInt(maxPrice));
    if (minRating > 0) list = list.filter(p => p.rating >= minRating);
    if (selectedSellerId) list = list.filter(p => p.sellerId === selectedSellerId);

    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [allProducts, tag, debouncedSearch, sort, minPrice, maxPrice, minRating, selectedSellerId]);

  const addToCart = (product) => {
    const seller = sellers.find(s => s.id === product.sellerId);
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      sellerId: product.sellerId,
      sellerName: seller?.name,
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Curved Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BuyerMain')} 
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.headerTitle}>{categoryName || 'All Products'}</Text>
            <Text style={styles.headerCount}>{filtered.length} products found</Text>
          </View>
        </View>

        {/* Search integrated in header */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch('')}
            onVoicePress={() => setIsListening(true)}
          />
        </View>
      </View>

      {/* Filter / Sort Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(true)}>
          <MaterialIcons name="tune" size={20} color={COLORS.accent} />
          {(minPrice || maxPrice || minRating > 0 || selectedSellerId) && <View style={styles.filterDot} />}
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          {[
            ['popular', 'Popular', 'trending-up'],
            ['price_asc', 'Price ↑', 'arrow-upward'],
            ['price_desc', 'Price ↓', 'arrow-downward'],
            ['rating', 'Top Rated', 'star-outline']
          ].map(([val, label, icon]) => (
            <TouchableOpacity
              key={val}
              style={[styles.chip, sort === val && styles.chipActive]}
              onPress={() => setSort(val)}
            >
              <MaterialIcons
                name={icon}
                size={14}
                color={sort === val ? COLORS.white : COLORS.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.chipText, sort === val && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={i => i.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={() => <ProductSkeleton />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <MaterialIcons name="search-off" size={64} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySub}>Try searching for something else or changing filters</Text>
            </View>
          }
          renderItem={({ item }) => {
            const seller = sellers.find(s => s.id === item.sellerId);
            return (
              <ProductCard
                product={item}
                seller={seller}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                onAddToCart={() => addToCart(item)}
                compact
              />
            );
          }}
        />
      )}

      {/* Filter Modal */}
      <ConfirmModal
        visible={showFilters}
        title="Advanced Filters"
        onConfirm={() => setShowFilters(false)}
        onCancel={() => {
          setMinPrice('');
          setMaxPrice('');
          setMinRating(0);
          setSelectedSellerId(null);
          setShowFilters(false);
        }}
        confirmText="Apply Filters"
        cancelText="Clear All"
        icon="tune"
      >
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalLabel}>Price Range (₹)</Text>
          <View style={styles.priceInputRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
            />
            <View style={styles.priceDash} />
            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.modalLabel}>Minimum Rating</Text>
          <View style={styles.ratingFilterRow}>
            {[3, 4, 5].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.ratingChip, minRating === r && styles.ratingChipActive]}
                onPress={() => setMinRating(minRating === r ? 0 : r)}
              >
                <MaterialIcons name="star" size={14} color={minRating === r ? COLORS.white : '#F39C12'} />
                <Text style={[styles.ratingChipText, minRating === r && styles.ratingChipTextActive]}>{r}+ Stars</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalLabel}>Select Seller</Text>
          <View style={styles.sellerFilterGrid}>
            {sellers.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sellerChip, selectedSellerId === s.id && styles.sellerChipActive]}
                onPress={() => setSelectedSellerId(selectedSellerId === s.id ? null : s.id)}
              >
                <Text style={[styles.sellerChipText, selectedSellerId === s.id && styles.sellerChipTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </ConfirmModal>

      {/* Voice Listening Overlay */}
      {isListening && (
        <TouchableOpacity
          style={styles.voiceOverlay}
          activeOpacity={1}
          onPress={() => setIsListening(false)}
        >
          <View style={styles.voiceContent}>
            <View style={styles.rippleContainer}>
              <Animated.View
                style={[
                  styles.ripple,
                  {
                    transform: [{ scale: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
                    opacity: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })
                  }
                ]}
              />
              <View style={styles.micCircle}>
                <MaterialIcons name="mic" size={40} color={COLORS.white} />
              </View>
            </View>
            <Text style={styles.voiceTitle}>{detectedText || 'Listening...'}</Text>
            <Text style={styles.voiceSub}>
              {detectedText ? 'Recognition complete!' : 'Searching for materials...'}
            </Text>

            <View style={styles.voiceIndicator}>
              <Text style={styles.voiceIndicatorText}>Try saying "Steel Pipe" or "Cement"</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  /* Curved Header */
  header: {
    backgroundColor: COLORS.header,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: SIZES.base,
    paddingBottom: SIZES.base + 4,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOWS.lg,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base + 4,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, ...FONTS.bold, color: COLORS.white },
  headerCount: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  searchWrap: {
    backgroundColor: 'transparent',
  },

  /* Filter Bar */
  filterBar: {
    backgroundColor: COLORS.background,
    paddingVertical: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.base,
  },
  filterToggle: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, ...SHADOWS.sm,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterDot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5, borderColor: COLORS.white,
  },
  filterList: {
    gap: SIZES.sm,
    paddingRight: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  chipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 13,
    ...FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
    ...FONTS.bold,
  },

  /* Modal */
  modalScroll: { maxHeight: 400 },
  modalLabel: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary, marginTop: 16, marginBottom: 12 },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceInput: {
    flex: 1, height: 44, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, fontSize: 14, color: COLORS.textPrimary, backgroundColor: '#F8FAFC',
  },
  priceDash: { width: 10, height: 2, backgroundColor: COLORS.border },
  ratingFilterRow: { flexDirection: 'row', gap: 10 },
  ratingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  ratingChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  ratingChipText: { fontSize: 12, ...FONTS.medium, color: COLORS.textSecondary },
  ratingChipTextActive: { color: COLORS.white, ...FONTS.bold },
  sellerFilterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sellerChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  sellerChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sellerChipText: { fontSize: 12, ...FONTS.medium, color: COLORS.textSecondary },
  sellerChipTextActive: { color: COLORS.white, ...FONTS.bold },

  /* Grid */
  grid: {
    padding: SIZES.base,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SIZES.base,
  },

  /* Empty State */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: '#F2F4F7',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },

  /* Voice Overlay */
  voiceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 40, 56, 0.95)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceContent: { alignItems: 'center', gap: 20 },
  rippleContainer: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  micCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
    ...SHADOWS.lg,
  },
  ripple: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.accent,
  },
  voiceTitle: { fontSize: 24, ...FONTS.bold, color: COLORS.white },
  voiceSub: { fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  voiceIndicator: { marginTop: 40, paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.1)' },
  voiceIndicatorText: { color: COLORS.white, fontSize: 14, ...FONTS.semiBold },
});
