import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, StatusBar, Platform,
  Linking, Share, Modal, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import ProductCard from '../../../components/shared/ProductCard';
import { useCart } from '../../../context/CartContext';
import { useReviews } from '../../../context/ReviewContext';
import apiClient from '../../../api/apiClient';
import Toast from 'react-native-toast-message';

export default function SellerProfileScreen({ navigation, route }) {
  const { sellerId } = route.params;
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const { addItem } = useCart();
  const { fetchSellerReviews, getSellerReviews } = useReviews();
  const [seller, setSeller] = React.useState(null);
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [claiming, setClaiming] = React.useState(false);
  const [showOtpModal, setShowOtpModal] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);

  React.useEffect(() => {
    fetchSellerData();
    fetchSellerReviews(sellerId);
  }, [sellerId]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const [sellRes, prodRes] = await Promise.all([
        apiClient.get(`/sellers/${sellerId}`),
        apiClient.get('/products', { params: { sellerId } }),
      ]);
      setSeller(sellRes.data);
      setProducts(prodRes.data);
    } catch (error) {
      console.error('Error fetching seller data:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not load seller profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      setClaiming(true);
      await apiClient.post(`/sellers/${sellerId}/claim`);
      
      // Simulate real-time claim started event
      setTimeout(() => {
        setClaiming(false);
        setShowOtpModal(true);
      }, 1500);
    } catch (error) {
      console.error('Claim Error:', error);
      Toast.show({ type: 'error', text1: 'Claim Failed', text2: error.response?.data?.message || 'Someone may have already started a claim for this business.' });
      setClaiming(false);
      fetchSellerData(); // Refresh status
    }
  };

  const verifyClaim = async () => {
    if (otp !== '123456') {
      Toast.show({ type: 'error', text1: 'Invalid Code', text2: 'The verification code you entered is incorrect.' });
      return;
    }

    try {
      setVerifying(true);
      // In a real app, we would send this to the server
      // Simulation success
      setTimeout(() => {
        setVerifying(false);
        setShowOtpModal(false);
        Toast.show({ type: 'success', text1: 'Success! 🎉', text2: 'You have successfully claimed this business. Our team will perform a final review within 24 hours.' });
        fetchSellerData();
      }, 2000);
    } catch (error) {
      setVerifying(false);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Verification failed. Please try again.' });
    }
  };

  if (loading) return (
    <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.actionLabel}>Loading profile...</Text>
    </View>
  );

  if (!seller) return (
    <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.actionLabel}>Seller not found</Text>
    </View>
  );

  const addToCart = (product) => {
    addItem({ productId: product.id, name: product.name, price: product.price, unit: product.unit, sellerId: product.sellerId, sellerName: seller?.name });
  };
  
  const handleAction = (type) => {
    switch (type) {
      case 'Call':
        if (seller.phone) {
          Linking.openURL(`tel:${seller.phone.replace(/\\s/g, '')}`);
        } else {
          Toast.show({ type: 'info', text1: 'Not Available', text2: 'This seller has not provided a contact number.' });
        }
        break;
      case 'Chat':
        Toast.show({ type: 'info', text1: 'Chat Feature', text2: 'Real-time chat with sellers is coming soon in the next update! 💬' });
        break;
      case 'Visit':
        const query = encodeURIComponent(`${seller.name} ${seller.location}`);
        const mapsUrl = Platform.select({
          ios: `http://maps.apple.com/?q=${query}`,
          android: `https://www.google.com/maps/search/?api=1&query=${query}`,
          default: `https://www.google.com/maps/search/?api=1&query=${query}`,
        });
        Linking.openURL(mapsUrl);
        break;
      default:
        break;
    }
  };

  const onShare = async () => {
    try {
      const shareUrl = `https://buildmart.com/seller/${seller.id}`;
      const message = `Check out ${seller.name} on BuildMart!\n\n📍 Location: ${seller.location}\n⭐ Rating: ${seller.rating}/5\n\nView more and order here: ${shareUrl}`;
      await Share.share({ message, title: seller.name });
    } catch (error) {
      console.log('Share Error:', error.message);
    }
  };

  // Header Animations
  const headerOpacity = scrollY.interpolate({
    inputRange: [100, 160],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 10],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });

  const navIconColor = scrollY.interpolate({
    inputRange: [120, 160],
    outputRange: [COLORS.white, COLORS.textPrimary],
    extrapolate: 'clamp',
  });

  const navBtnBg = scrollY.interpolate({
    inputRange: [120, 160],
    outputRange: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.05)'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Branded Parallax Header Background */}
      <Animated.View style={[styles.headerBg, { transform: [{ scale: headerScale }] }]}>
        {seller.bannerImage ? (
          <Image source={{ uri: seller.bannerImage }} style={styles.bannerImage} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.primary }]} />
        )}
        <View style={styles.bannerOverlay} />
      </Animated.View>

      {/* Sticky Top Header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <View style={styles.stickyHeaderContent}>
          <Text style={styles.stickyName}>{seller.name}</Text>
          <View style={styles.stickyMeta}>
            <MaterialIcons name="star" size={12} color="#F39C12" />
            <Text style={styles.stickyRating}>{seller.rating}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Floating Header Buttons */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={styles.navBtn} 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BuyerMain')}
        >
          <Animated.View style={[styles.navBtnCircle, { backgroundColor: navBtnBg }]}>
            <Animated.Text style={{ color: navIconColor }}>
              <MaterialIcons name="arrow-back" size={24} />
            </Animated.Text>
          </Animated.View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navBtn} onPress={onShare}>
          <Animated.View style={[styles.navBtnCircle, { backgroundColor: navBtnBg }]}>
            <Animated.Text style={{ color: navIconColor }}>
              <MaterialIcons name="share" size={22} />
            </Animated.Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Profile Info Section */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.avatar, { transform: [{ scale: avatarScale }, { translateY: avatarTranslateY }] }]}>
            <Text style={styles.avatarText}>{seller.name.charAt(0)}</Text>
          </Animated.View>
          
          <Text style={styles.name}>{seller.name}</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <MaterialIcons key={i} name="star" size={16}
                color={i <= Math.round(seller.rating) ? '#F39C12' : 'rgba(255,255,255,0.2)'} />
            ))}
            <Text style={styles.ratingVal}>{seller.rating}</Text>
            <Text style={styles.reviewCount}>({seller.totalReviews} reviews)</Text>
          </View>
          
          <View style={styles.locationChip}>
            <MaterialIcons name="location-on" size={14} color={COLORS.accent} />
            <Text style={styles.locationText}>{seller.location}</Text>
            {seller.isVerified && (
              <>
                <View style={styles.dot} />
                <MaterialIcons name="verified" size={14} color="#5DADE2" />
                <Text style={styles.verifiedText}>Verified Seller</Text>
              </>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { icon: 'inventory-2', value: products.length, label: 'Products' },
            { icon: 'schedule', value: seller.operatingHours ? `${seller.operatingHours.open}-${seller.operatingHours.close}` : '09:00-18:00', label: 'Hours' },
            { icon: 'local-shipping', value: seller.deliveryRange || '15 km', label: 'Range' },
          ].map((s, idx) => (
            <View key={s.label} style={[styles.statItem, idx > 0 && styles.statBorder]}>
              <MaterialIcons name={s.icon} size={22} color={COLORS.accent} />
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsBox}>
          {[
            { icon: 'call', label: 'Call', color: '#27AE60' },
            { icon: 'chat', label: 'Chat', color: '#3498DB' },
            { icon: 'place', label: 'Visit', color: COLORS.accent },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => handleAction(a.label)}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '15' }]}>
                <MaterialIcons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* About */}
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          <Text style={styles.aboutText}>{seller.businessDescription || seller.description || 'Verified BuildMart partner specializing in high-quality construction materials and industrial supplies.'}</Text>
          
          {seller.operatingHours && (
            <View style={styles.hoursContainer}>
              <MaterialIcons name="access-time" size={16} color={COLORS.textMuted} />
              <Text style={styles.hoursText}>Mon-Fri: {seller.operatingHours.open} - {seller.operatingHours.close}</Text>
            </View>
          )}

          {(!seller.isVerified && (seller.claimStatus === 'Unclaimed' || !seller.claimStatus)) && (
            <TouchableOpacity 
              style={styles.claimBtn}
              onPress={handleClaim}
              disabled={claiming}
            >
              {claiming ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <MaterialIcons name="verified-user" size={20} color={COLORS.white} />
                  <Text style={styles.claimBtnText}>Claim this Business</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {seller.claimStatus === 'Pending' && (
            <View style={styles.pendingClaimBox}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.pendingClaimText}>Verification in Progress...</Text>
            </View>
          )}
        </View>

        {/* Reviews Section */}
        <View style={styles.contentCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Testimonials</Text>
            <View style={styles.ratingRowAlt}>
              <MaterialIcons name="star" size={18} color="#F39C12" />
              <Text style={styles.ratingValAlt}>{seller.rating}</Text>
            </View>
          </View>
          
          {getSellerReviews(sellerId).length === 0 ? (
            <Text style={styles.emptyReviews}>No reviews yet for this merchant.</Text>
          ) : (
            <View style={styles.reviewsList}>
              {getSellerReviews(sellerId).slice(0, 2).map((review, index) => (
                <View key={review.id || index} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.buyer?.name || 'Verified Buyer'}</Text>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <MaterialIcons 
                          key={s} 
                          name={s <= review.rating ? "star" : "star-outline"} 
                          size={12} 
                          color={s <= review.rating ? "#F39C12" : "#CBD5E0"} 
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  {review.verifiedPurchase && (
                    <View style={styles.verifiedRowSmall}>
                      <MaterialIcons name="check-circle" size={12} color={COLORS.success} />
                      <Text style={styles.verifiedTextSmall}>Verified Order</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Claim Verification Modal */}
        <Modal visible={showOtpModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.verificationCard}>
              <View style={styles.verificationHeader}>
                <View style={styles.verificationIcon}>
                  <MaterialIcons name="security" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.verificationTitle}>Business Verification</Text>
                <Text style={styles.verificationSub}>We've sent a 6-digit code to the registered number for {seller.name}</Text>
              </View>

              <View style={styles.otpWrapper}>
                <TextInput
                  style={styles.hiddenInput}
                  value={otp}
                  onChangeText={(v) => { if (v.length <= 6) setOtp(v); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <View style={styles.otpContainer}>
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <View 
                      key={idx} 
                      style={[
                        styles.otpBox, 
                        otp.length === idx && styles.activeOtpBox
                      ]}
                    >
                      <Text style={styles.otpText}>{otp[idx] || ''}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.verifyBtn, otp.length !== 6 && styles.disabledBtn]}
                onPress={verifyClaim}
                disabled={otp.length !== 6 || verifying}
              >
                {verifying ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify Ownership</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setShowOtpModal(false)} style={styles.cancelLink}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* performance */}
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Trust & Reliability</Text>
          <View style={styles.performanceGrid}>
            {[
              { label: 'Fulfillment', value: '98%', color: COLORS.success },
              { label: 'Response', value: '< 2h', color: COLORS.accent },
              { label: 'Order Accuracy', value: '96%', color: '#3498DB' },
            ].map(p => (
              <View key={p.label} style={styles.perfBox}>
                <Text style={[styles.perfVal, { color: p.color }]}>{p.value}</Text>
                <Text style={styles.perfLabel}>{p.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Products */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products ({products.length})</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>
          <View style={styles.productGrid}>
            {products.map(item => (
              <ProductCard
                key={item.id}
                product={item}
                compact
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                onAddToCart={() => addToCart(item)}
              />
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBg: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 300, backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: Platform.OS === 'ios' ? 100 : 80,
    backgroundColor: COLORS.white, zIndex: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 60, justifyContent: 'center',
    ...SHADOWS.md,
  },
  stickyHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stickyName: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  stickyMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stickyRating: { fontSize: 13, ...FONTS.bold, color: COLORS.textPrimary },
  navBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SIZES.base,
    zIndex: 20,
  },
  navBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 40,
  },
  avatar: {
    width: 90, height: 90, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)',
    ...SHADOWS.lg,
  },
  avatarText: { fontSize: 36, ...FONTS.bold, color: COLORS.white },
  name: { fontSize: 24, ...FONTS.bold, color: COLORS.white, marginBottom: 8, textAlign: 'center', paddingHorizontal: 20 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  ratingVal: { fontSize: 15, ...FONTS.bold, color: COLORS.white, marginLeft: 4 },
  reviewCount: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  locationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full,
  },
  locationText: { fontSize: 13, color: COLORS.white, ...FONTS.medium },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  verifiedText: { fontSize: 13, color: '#5DADE2', ...FONTS.bold },
  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    marginHorizontal: SIZES.base, borderRadius: RADIUS.xl,
    paddingVertical: 20, marginTop: -30, ...SHADOWS.md,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: '#EDF2F7' },
  statVal: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textMuted },
  actionsBox: {
    flexDirection: 'row', marginHorizontal: SIZES.base, marginTop: SIZES.base,
    gap: SIZES.base,
  },
  actionBtn: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    paddingVertical: 16, alignItems: 'center', ...SHADOWS.sm,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 13, ...FONTS.semiBold, color: COLORS.textPrimary },
  contentCard: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.base,
    marginTop: SIZES.base, borderRadius: RADIUS.xl, padding: 20,
    ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 16 },
  aboutText: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24 },
  performanceGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  perfBox: { flex: 1, alignItems: 'center' },
  perfVal: { fontSize: 20, ...FONTS.extraBold, marginBottom: 4 },
  perfLabel: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  productsSection: { padding: SIZES.base },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAll: { fontSize: 14, ...FONTS.bold, color: COLORS.accent },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  /* Feature Styles */
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  hoursContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  hoursText: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.medium },
  ratingRowAlt: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValAlt: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  emptyReviews: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
  reviewsList: { gap: 15, marginTop: 10 },
  reviewItem: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 15 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  starRow: { flexDirection: 'row', gap: 2 },
  reviewerName: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  reviewComment: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  verifiedRowSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  verifiedTextSmall: { fontSize: 11, ...FONTS.bold, color: COLORS.success },

  /* Claim Feature Styles */
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 14, marginTop: 24, ...SHADOWS.md,
  },
  claimBtnText: { color: COLORS.white, fontSize: 15, ...FONTS.bold },
  pendingClaimBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF9E6', padding: 16, borderRadius: RADIUS.lg,
    marginTop: 24, borderWidth: 1, borderColor: '#FFE58F',
  },
  pendingClaimText: { color: '#856404', fontSize: 14, ...FONTS.medium },
  
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', padding: 24,
  },
  verificationCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 30, alignItems: 'center', ...SHADOWS.lg,
  },
  verificationHeader: { alignItems: 'center', marginBottom: 30 },
  verificationIcon: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#EBF5FB', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  verificationTitle: { fontSize: 22, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 12 },
  verificationSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  otpWrapper: { width: '100%', alignItems: 'center', marginBottom: 30, height: 60 },
  hiddenInput: { 
    position: 'absolute', width: '100%', height: '100%', 
    opacity: 0, zIndex: 10 
  },
  otpContainer: { 
    flexDirection: 'row', justifyContent: 'space-between', width: '100%', zIndex: 1 
  },
  otpBox: { 
    width: 44, height: 54, borderRadius: 12, borderWidth: 2, 
    borderColor: '#EDF2F7', backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm,
  },
  activeOtpBox: { borderColor: COLORS.accent, backgroundColor: COLORS.white },
  otpText: { fontSize: 24, ...FONTS.bold, color: COLORS.textPrimary },
  verifyBtn: {
    backgroundColor: COLORS.primary, width: '100%', height: 56,
    borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.md,
  },
  verifyBtnText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },
  disabledBtn: { backgroundColor: '#CBD5E0' },
  cancelLink: { marginTop: 20 },
  cancelText: { color: COLORS.textMuted, fontSize: 14, ...FONTS.medium },
});
