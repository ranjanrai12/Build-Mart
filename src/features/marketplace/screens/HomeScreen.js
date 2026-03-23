import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, RefreshControl, StatusBar, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../api/apiClient';
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES } from '../../../constants/theme';
import SearchBar from '../../../components/shared/SearchBar';
import CategoryCard from '../../../components/shared/CategoryCard';
import ProductCard from '../../../components/shared/ProductCard';
import SellerCard from '../../../components/shared/SellerCard';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useLocation } from '../../../context/LocationContext';
import { useNotifications } from '../../../context/NotificationContext';
import useThemeStyles from '../../../hooks/useThemeStyles';
import { ProductSkeleton } from '../../../components/shared/SkeletonLoader';

const TRENDING_CHIPS = ['🔥 Deals', '🏗️ Bulk Only', '⚡ Express Delivery', '💎 Top Rated'];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const themeStyles = useThemeStyles();
  const { addItem } = useCart();
  const { unreadCount } = useNotifications();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { history } = useWishlist();
  const { location, address: locationName, calculateDistance } = useLocation();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes, sellRes] = await Promise.all([
        apiClient.get('/products/categories'),
        apiClient.get('/products'),
        apiClient.get('/sellers'),
      ]);

      setCategories(catRes.data);
      setProducts(prodRes.data);
      setSellers(sellRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredProducts = products.filter(p => p.tags?.includes('bestseller')).slice(0, 6);

  const topSellers = sellers
    .sort((a, b) => {
      if (!location || !a.coordinates || !b.coordinates) return (b.rating || 0) - (a.rating || 0);
      const distA = calculateDistance(location.latitude, location.longitude, a.coordinates.lat, a.coordinates.lng);
      const distB = calculateDistance(location.latitude, location.longitude, b.coordinates.lat, b.coordinates.lng);
      return distA - distB;
    })
    .slice(0, 3);

  const recentProducts = history
    .map(id => products.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 6);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length > 2) {
      navigation.navigate('ProductList', { search: text });
    }
  };

  const addToCart = (product) => {
    const seller = sellers.find(s => s.id === product.sellerId);
    addItem({
      productId: product.id, name: product.name,
      price: product.price, unit: product.unit,
      sellerId: product.sellerId, sellerName: seller?.name,
    });
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Premium Curved Header */}
      <View style={[themeStyles.curvedHeader, styles.headerExtra]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Builder'} 👋</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={12} color="rgba(255,255,255,0.6)" />
              <Text style={styles.headerSub} numberOfLines={1}>
                Delivering to {locationName ? locationName.split(',')[0] : 'your site'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <MaterialIcons name="notifications-none" size={24} color={COLORS.white} />
            {unreadCount > 0 && (
              <View style={styles.notifDot}>
                <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={handleSearch}
            placeholder="Search for Steel, Cement, Bricks..."
            onClear={() => setSearch('')}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Premium Glassmorphic Hero Banner */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroGlass}>
              <View style={styles.heroTagWrap}>
                <MaterialIcons name="bolt" size={14} color={COLORS.white} />
                <Text style={styles.heroTag}>SEASONAL OFFERS</Text>
              </View>
              <Text style={styles.heroTitle}>Premium Steel{'\n'}& Fast Cement</Text>
              <Text style={styles.heroDescription}>Get 15% instant discount on bulk orders above ₹50,000.</Text>
              
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() => navigation.navigate('ProductList', { tag: 'bestseller' })}
                activeOpacity={0.8}
              >
                <Text style={styles.heroBtnText}>Explore Offers</Text>
                <MaterialIcons name="arrow-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.heroIconDecoration}>
              <MaterialIcons name="engineering" size={120} color="rgba(255,255,255,0.12)" />
            </View>
          </LinearGradient>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductList')}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            keyExtractor={i => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <CategoryCard
                category={item}
                onPress={() => navigation.navigate('ProductList', { categoryId: item.id, categoryName: item.name })}
              />
            )}
            contentContainerStyle={styles.horizontalPadding}
          />
        </View>

        {/* Trending Chips Discovery */}
        <View style={styles.trendingContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingScroll}>
            {TRENDING_CHIPS.map(chip => (
              <TouchableOpacity key={chip} style={styles.trendingChip}>
                <Text style={styles.trendingChipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bestsellers Section */}
        {(loading || featuredProducts.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <MaterialIcons name="local-fire-department" size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Bestsellers</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('ProductList', { tag: 'bestseller' })}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <FlatList
                data={[1, 2, 3]}
                keyExtractor={i => i.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={() => <ProductSkeleton />}
                contentContainerStyle={styles.horizontalPadding}
              />
            ) : (
              <FlatList
                data={featuredProducts}
                keyExtractor={i => i.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                  const seller = sellers.find(s => s.id === item.sellerId);
                  return (
                    <ProductCard
                      product={item}
                      seller={seller}
                      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                      onAddToCart={() => addToCart(item)}
                    />
                  );
                }}
                contentContainerStyle={styles.horizontalPadding}
              />
            )}
          </View>
        )}

        {/* Distance-based Top Sellers */}
        {topSellers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <MaterialIcons name="stars" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Highly Rated Stores</Text>
              </View>
            </View>
            <View style={styles.horizontalPadding}>
              {topSellers.map(s => (
                <SellerCard
                  key={s.id}
                  seller={s}
                  onPress={() => navigation.navigate('SellerProfile', { sellerId: s.id })}
                />
              ))}
            </View>
          </View>
        )}

        {/* Recently Viewed */}
        {recentProducts.length > 0 && (
          <View style={[styles.section, { marginBottom: 60 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <MaterialIcons name="history" size={20} color={COLORS.textMuted} />
                <Text style={styles.sectionTitle}>Recently Viewed</Text>
              </View>
            </View>
            <FlatList
              data={recentProducts}
              keyExtractor={i => `recent-${i.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const seller = sellers.find(s => s.id === item.sellerId);
                return (
                  <ProductCard
                    product={item}
                    seller={seller}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                    onAddToCart={() => addToCart(item)}
                    compact
                    style={{ width: 155, marginRight: 12 }}
                  />
                );
              }}
              contentContainerStyle={styles.horizontalPadding}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  headerExtra: { shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 22, ...FONTS.bold, color: COLORS.white },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', ...FONTS.medium, flex: 1 },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2,
  },
  searchWrap: { backgroundColor: 'transparent' },

  scrollContent: { paddingTop: 20 },

  /* ── Hero Container ────────────────────────── */
  heroContainer: { marginHorizontal: 16, marginBottom: 30, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.lg },
  heroGradient: { padding: 24, minHeight: 180 },
  heroGlass: { zIndex: 2 },
  heroTagWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, alignSelf: 'flex-start', marginBottom: 12
  },
  heroTag: { fontSize: 9, ...FONTS.bold, color: COLORS.white, letterSpacing: 1 },
  heroTitle: { fontSize: 26, ...FONTS.extraBold, color: COLORS.white, lineHeight: 32, marginBottom: 10 },
  heroDescription: { fontSize: 13, color: 'rgba(255,255,255,0.8)', ...FONTS.medium, marginBottom: 20, maxWidth: '80%' },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: RADIUS.lg, alignSelf: 'flex-start', ...SHADOWS.md
  },
  heroBtnText: { fontSize: 14, ...FONTS.bold, color: COLORS.primary },
  heroIconDecoration: { position: 'absolute', right: -20, bottom: -10 },

  /* ── Sections ──────────────────────────────── */
  section: { marginBottom: 35 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 15, paddingHorizontal: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 19, ...FONTS.bold, color: COLORS.textPrimary },
  seeAll: { fontSize: 13, ...FONTS.bold, color: COLORS.accent },
  horizontalPadding: { paddingLeft: 16, paddingRight: 8, paddingVertical: 5 },

  /* ── Trending découverte ───────────────────── */
  trendingContainer: { marginBottom: 30 },
  trendingScroll: { paddingHorizontal: 16, gap: 10 },
  trendingChip: {
    backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#F1F5F9', ...SHADOWS.sm
  },
  trendingChipText: { fontSize: 13, ...FONTS.bold, color: COLORS.textPrimary },
});
