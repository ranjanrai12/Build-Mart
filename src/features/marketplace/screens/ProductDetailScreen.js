import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, StatusBar,
  Platform, Modal, TextInput, Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import apiClient from '../../../api/apiClient';
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES } from '../../../constants/theme';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useAuth } from '../../../context/AuthContext';
import { useOrders } from '../../../context/OrderContext';
import { useReviews } from '../../../context/ReviewContext';
import { useQuotes } from '../../../context/QuoteContext';
import useCurrency from '../../../hooks/useCurrency';
import QuantitySelector from '../../../components/shared/QuantitySelector';
import QuoteRequestModal from '../../../components/shared/QuoteRequestModal';

export default function ProductDetailScreen({ navigation, route }) {
  const { productId } = route.params;
  const scrollY = useRef(new Animated.Value(0)).current;

  const { addItem, items, updateQuantity, removeItem } = useCart();
  const { addToHistory, isInWishlist, toggleWishlist } = useWishlist();
  const { getAverageRating, getReviewCount, getProductReviews, fetchProductReviews } = useReviews();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { formatINR } = useCurrency();
  const { submitQuoteRequest } = useQuotes();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [statusBarStyle, setStatusBarStyle] = React.useState('light-content');

  useEffect(() => {
    if (productId) {
      fetchProductReviews(productId);
      addToHistory(productId);
    }
  }, [productId, fetchProductReviews, addToHistory]);

  React.useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const newStyle = value > 180 ? 'dark-content' : 'light-content';
      if (newStyle !== statusBarStyle) {
        setStatusBarStyle(newStyle);
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [statusBarStyle, scrollY]);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get(`/products/${productId}`);
        let p = res.data;
        
        // Safety parse for pricingTiers if it comes as a string
        if (p.pricingTiers && typeof p.pricingTiers === 'string') {
          try {
            p.pricingTiers = JSON.parse(p.pricingTiers);
          } catch (e) {
            console.error('Failed to parse pricingTiers:', e);
          }
        }
        
        console.log(`Product loaded: ${p.name}, Tiers:`, p.pricingTiers?.length || 0);
        setProduct(p);
      } catch (e) {
        Toast.show({ type: 'error', text1: 'Product loading failed.' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  if (loading) return (
    <View style={styles.loadingScreen}>
      <Text style={styles.loadingText}>Fetching specifications...</Text>
    </View>
  );

  if (!product) return (
    <View style={styles.loadingScreen}>
      <Text style={styles.loadingText}>Product not found</Text>
    </View>
  );

  const seller = product?.seller;
  const inCart = items.find(i => i.productId === productId);
  const wishlisted = isInWishlist(productId);
  const avgRating = getAverageRating(productId, product?.rating);
  const totalReviews = getReviewCount(productId, product?.reviewsCount);
  const hasPurchased = orders?.some(o => o.items?.some(i => i.productId === productId)) || false;

  const headerOpacity = scrollY.interpolate({ inputRange: [140, 220], outputRange: [0, 1], extrapolate: 'clamp' });
  const imageScale = scrollY.interpolate({ inputRange: [-100, 0, 100], outputRange: [1.2, 1, 1], extrapolate: 'clamp' });
  const imageTranslate = scrollY.interpolate({ inputRange: [0, 300], outputRange: [0, 80], extrapolate: 'clamp' });
  
  // High-Contrast Header Navigation (Sync with Suppliers View)
  const navBtnBg = scrollY.interpolate({ 
    inputRange: [140, 220], 
    outputRange: ['rgba(0,0,0,0.35)', 'rgba(15, 23, 42, 0.5)'], 
    extrapolate: 'clamp' 
  });
  const navIconColor = COLORS.white; // Always white for bold 'Suppliers' look

  const calculateCurrentUnitPrice = (quantity) => {
    if (!product?.pricingTiers || product.pricingTiers.length === 0) {
      return product.price;
    }
    const sortedTiers = [...product.pricingTiers].sort((a, b) => b.minQty - a.minQty);
    const applicableTier = sortedTiers.find(tier => quantity >= tier.minQty);
    return applicableTier ? applicableTier.price : product.price;
  };

  const currentUnitPrice = calculateCurrentUnitPrice(inCart ? inCart.quantity : qty);

  const handleAddToCart = (navigateToCheckout = false) => {
    addItem({
      productId: product.id, name: product.name, price: currentUnitPrice,
      basePrice: product.price, pricingTiers: product.pricingTiers,
      unit: product.unit, sellerId: product.sellerId, sellerName: seller?.name, quantity: qty
    });
    if (navigateToCheckout) {
      navigation.navigate('BuyerMain', { screen: 'Cart' });
    } else {
      Toast.show({ type: 'success', text1: 'Added to Cart ✓', text2: `${qty} × ${product.name} added.` });
      setQty(1);
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product.name} on BuildMart! Only ${formatINR(product.price)}/${product.unit}.`,
        title: product.name,
      });
    } catch (error) { console.log('Share Error:', error.message); }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={statusBarStyle} backgroundColor="transparent" translucent />

      {/* Premium Parallax Header */}
      <Animated.View style={[styles.imageArea, { transform: [{ translateY: imageTranslate }, { scale: imageScale }] }]}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={StyleSheet.absoluteFill} />
        <MaterialIcons name="construction" size={140} color="rgba(255,255,255,0.08)" style={styles.iconDecor} />
        <View style={styles.imageContent}>
          <MaterialIcons name="inventory-2" size={90} color="rgba(255,255,255,0.4)" />
        </View>
        <View style={styles.imageOverlay}>
          {product.tags?.includes('bestseller') && (
            <View style={styles.badge}><Text style={styles.badgeText}>BESTSELLER</Text></View>
          )}
        </View>
      </Animated.View>

      {/* Floating Toolbar - Bold Circle Aesthetic */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity 
          style={styles.navBtn} 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BuyerMain')}
        >
          <Animated.View style={[styles.navCircle, { backgroundColor: navBtnBg }]}>
            <MaterialIcons name="arrow-back" size={24} color={navIconColor} />
          </Animated.View>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.navBtn} onPress={onShare}>
            <Animated.View style={[styles.navCircle, { backgroundColor: navBtnBg }]}>
              <MaterialIcons name="share" size={22} color={navIconColor} />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => toggleWishlist(product.id)}>
            <Animated.View style={[
              styles.navCircle, 
              { backgroundColor: wishlisted ? COLORS.accent : navBtnBg }
            ]}>
              <MaterialIcons name={wishlisted ? "favorite" : "favorite-border"} size={22} color={navIconColor} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.scrollFlex}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
      >
        <View style={{ height: 320 }} />

        <View style={styles.content}>

          <View style={styles.mainInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.ratingBadge}>
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingValue}>{avgRating}</Text>
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>{formatINR(product.price)}</Text>
              <Text style={styles.unitText}>/{product.unit}</Text>
              {!product.inStock && <View style={styles.soldBadge}><Text style={styles.soldText}>SOLD OUT</Text></View>}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Overview</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Bulk Pricing Tiers */}
          {product.pricingTiers && product.pricingTiers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.tierHeader}>
                <MaterialIcons name="local-offer" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Wholesale Pricing</Text>
              </View>
              <View style={styles.tiersContainer}>
                {/* Base price */}
                <View style={[styles.tierCard, (inCart ? inCart.quantity : qty) < product.pricingTiers[0].minQty && styles.activeTierCard]}>
                  <Text style={styles.tierQty}>1 - {product.pricingTiers[0].minQty - 1} {product.unit}</Text>
                  <Text style={styles.tierPrice}>{formatINR(product.price)}</Text>
                  <Text style={styles.tierLabel}>Retail</Text>
                </View>
                
                {product.pricingTiers.map((tier, idx) => {
                  const nextMin = product.pricingTiers[idx + 1]?.minQty;
                  const currentQty = inCart ? inCart.quantity : qty;
                  const isActive = currentQty >= tier.minQty && (!nextMin || currentQty < nextMin);
                  const savings = ((product.price - tier.price) / product.price * 100).toFixed(0);
                  
                  return (
                    <View key={idx} style={[styles.tierCard, isActive && styles.activeTierCard]}>
                      <Text style={styles.tierQty}>{tier.minQty}{nextMin ? ` - ${nextMin - 1}` : '+'} {product.unit}</Text>
                      <Text style={styles.tierPrice}>{formatINR(tier.price)}</Text>
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>SAVE ₹{(product.price - tier.price).toFixed(0)} ({savings}%)</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Store Card - Premium Redesign */}
          {seller && (
            <TouchableOpacity
              style={styles.storeCard}
              onPress={() => navigation.navigate('SellerProfile', { sellerId: seller.id })}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.storeGradient}>
                <View style={styles.storeAvatar}>
                  <MaterialIcons name="storefront" size={24} color={COLORS.white} />
                </View>
                <View style={styles.storeMain}>
                  <Text style={styles.storeSub}>VERIFIED MERCHANT</Text>
                  <Text style={styles.storeName}>{seller.name}</Text>
                  <View style={styles.storeMeta}>
                    <MaterialIcons name="location-on" size={12} color={COLORS.textMuted} />
                    <Text style={styles.storeLoc}>{seller.location || 'Building Mart Partner'}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={COLORS.primary} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* B2B Procurement Section */}
          <View style={styles.b2bSection}>
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.b2bGradient}
            >
              <View style={styles.b2bInfo}>
                <Text style={styles.b2bTitle}>Procurement Inquiry</Text>
                <Text style={styles.b2bSub}>Best rates for orders above 100 units</Text>
              </View>
              <TouchableOpacity style={styles.b2bBtn} onPress={() => setShowQuoteModal(true)}>
                <Text style={styles.b2bBtnText}>Get Quote</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Customer Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              <View style={styles.ratingSummary}>
                <MaterialIcons name="star" size={16} color="#F59E0B" />
                <Text style={styles.avgText}>{avgRating}</Text>
                <Text style={styles.countText}>({totalReviews})</Text>
              </View>
            </View>

            {getProductReviews(productId).length === 0 ? (
              <View style={styles.emptyReviews}>
                <MaterialIcons name="rate-review" size={40} color={COLORS.divider} />
                <Text style={styles.emptyText}>No reviews yet. Be the first to share your experience!</Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {getProductReviews(productId).slice(0, 3).map((review, index) => (
                  <View key={review.id || index} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.avatarText}>{(review.buyer?.name || 'U').charAt(0)}</Text>
                        </View>
                        <View>
                          <Text style={styles.reviewerName}>{review.buyer?.name || 'Verified Buyer'}</Text>
                          <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <MaterialIcons 
                                key={s} 
                                name={s <= review.rating ? "star" : "star-outline"} 
                                size={14} 
                                color={s <= review.rating ? "#F59E0B" : COLORS.divider} 
                              />
                            ))}
                            {review.verifiedPurchase && (
                              <View style={styles.verifiedTag}>
                                <MaterialIcons name="verified" size={12} color={COLORS.success} />
                                <Text style={styles.verifiedText}>Verified Purchase</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))}
                
                {totalReviews > 3 && (
                  <TouchableOpacity style={styles.viewAllBtn}>
                    <Text style={styles.viewAllText}>View all {totalReviews} reviews</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Select Quantity */}
          {product.inStock && (
            <View style={styles.purchaseControls}>
              <View style={styles.qtyBox}>
                <Text style={styles.controlLabel}>Select Quantity</Text>
                {inCart ? (
                  <QuantitySelector
                    value={inCart.quantity}
                    onDecrease={() => inCart.quantity <= 1 ? removeItem(product.id) : updateQuantity(product.id, inCart.quantity - 1)}
                    onIncrease={() => updateQuantity(product.id, inCart.quantity + 1)}
                  />
                ) : (
                  <QuantitySelector value={qty} onDecrease={() => setQty(q => Math.max(1, q - 1))} onIncrease={() => setQty(q => q + 1)} />
                )}
              </View>
              <View style={styles.totalBox}>
                <Text style={[styles.controlLabel, { textAlign: 'right' }]}>Subtotal</Text>
                <Text style={styles.totalPrice}>{formatINR(currentUnitPrice * (inCart ? inCart.quantity : qty))}</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Persistent Action Bar */}
      {product.inStock && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.cartAction} onPress={() => handleAddToCart(false)}>
            <MaterialIcons name="add-shopping-cart" size={20} color={COLORS.primary} />
            <Text style={styles.cartActionText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyAction} onPress={() => handleAddToCart(true)}>
            <LinearGradient colors={[COLORS.accent, COLORS.accentDark]} style={styles.buyGradient}>
              <Text style={styles.buyActionText}>Buy Now</Text>
              <MaterialIcons name="flash-on" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <QuoteRequestModal
        visible={showQuoteModal}
        product={product}
        seller={seller}
        onClose={() => setShowQuoteModal(false)}
        onSubmit={(data) => {
          submitQuoteRequest({ ...data, buyerId: user?.id || 'buyer1', buyerName: user?.name || 'Pro Buyer' });
          setShowQuoteModal(false);
          Toast.show({ type: 'success', text1: 'Quotation Request Sent' });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  loadingScreen: { flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: COLORS.textMuted, ...FONTS.medium },

  /* Parallax Styles */
  imageArea: { position: 'absolute', top: 0, left: 0, right: 0, height: 380, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  iconDecor: { position: 'absolute', bottom: 20, right: 20, opacity: 0.1 },
  imageContent: { zIndex: 2 },
  imageOverlay: { position: 'absolute', bottom: 60, left: 20 },
  badge: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, ...SHADOWS.md },
  badgeText: { color: COLORS.white, fontSize: 10, ...FONTS.bold, letterSpacing: 1 },

  floatingHeader: {
    position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12,
    zIndex: 1000,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm,
  },

  scrollFlex: { flex: 1 },
  content: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, padding: 24, minHeight: SIZES.height * 0.7 },

  mainInfo: { marginBottom: 20 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  productName: { fontSize: 26, ...FONTS.bold, color: COLORS.textPrimary, flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  ratingValue: { fontSize: 14, ...FONTS.bold, color: '#D97706' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  priceText: { fontSize: 32, ...FONTS.extraBold, color: COLORS.primary },
  unitText: { fontSize: 16, color: COLORS.textMuted, ...FONTS.medium },
  soldBadge: { marginLeft: 12, backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  soldText: { color: COLORS.error, fontSize: 10, ...FONTS.bold },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 12 },
  descriptionText: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24 },

  /* Store Card */
  storeCard: { marginBottom: 24, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.sm },
  storeGradient: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  storeAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  storeMain: { flex: 1 },
  storeSub: { fontSize: 10, ...FONTS.bold, color: COLORS.primary, letterSpacing: 0.8, marginBottom: 2 },
  storeName: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  storeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  storeLoc: { fontSize: 12, color: COLORS.textMuted },

  /* B2B Procurement */
  b2bSection: { marginBottom: 30 },
  b2bGradient: { padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  b2bInfo: { flex: 1 },
  b2bTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.white },
  b2bSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  b2bBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  b2bBtnText: { color: COLORS.white, fontSize: 14, ...FONTS.bold },

  /* Purchase Controls */
  purchaseControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  controlLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8, ...FONTS.medium },
  totalPrice: { fontSize: 24, ...FONTS.extraBold, color: COLORS.textPrimary },

  /* Action Bar */
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, flexDirection: 'row', gap: 12, ...SHADOWS.lg
  },
  cartAction: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  cartActionText: { fontSize: 16, ...FONTS.bold, color: COLORS.primary },
  buyAction: { flex: 1.4, height: 56, borderRadius: 16, overflow: 'hidden' },
  buyGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buyActionText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },

  /* Reviews Styles */
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  ratingSummary: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avgText: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  countText: { fontSize: 14, color: COLORS.textMuted },
  emptyReviews: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#F8FAFC', borderRadius: 20 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 },
  reviewsList: { gap: 16 },
  reviewCard: { padding: 16, backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  reviewerInfo: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, ...FONTS.bold, color: COLORS.primary },
  reviewerName: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedText: { fontSize: 10, ...FONTS.bold, color: COLORS.success },
  reviewDate: { fontSize: 11, color: COLORS.textMuted },
  reviewComment: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  viewAllBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  viewAllText: { fontSize: 14, ...FONTS.bold, color: COLORS.primary },

  /* Tier Styling */
  tierHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tiersContainer: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  tierCard: {
    flex: 1, minWidth: 100, padding: 12, backgroundColor: '#F8FAFC',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#EDF2F7',
    alignItems: 'center', gap: 4
  },
  activeTierCard: {
    borderColor: COLORS.primary, backgroundColor: '#F0F9FF',
    ...SHADOWS.sm
  },
  tierQty: { fontSize: 11, color: COLORS.textMuted, ...FONTS.bold },
  tierPrice: { fontSize: 16, ...FONTS.extraBold, color: COLORS.textPrimary },
  tierLabel: { fontSize: 10, color: COLORS.textMuted, ...FONTS.medium },
  savingsBadge: { backgroundColor: COLORS.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  savingsText: { color: COLORS.white, fontSize: 9, ...FONTS.extraBold },
});
