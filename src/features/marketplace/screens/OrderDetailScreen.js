import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  Platform, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS } from '../../../constants/theme';
import useCurrency from '../../../hooks/useCurrency';
import { useReviews } from '../../../context/ReviewContext';
import { useAuth } from '../../../context/AuthContext';
import { useOrders } from '../../../context/OrderContext';
import { useCart } from '../../../context/CartContext';
import { useLogistics } from '../../../context/LogisticsContext';
import Toast from 'react-native-toast-message';

const STATUS_STEPS = ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'];
const STATUS_LABELS = {
  'Placed': 'Order Placed',
  'Confirmed': 'Seller Confirmed',
  'Packed': 'Packed & Ready',
  'Dispatched': 'In Transit',
  'Delivered': 'Delivered Successfully',
  'Rejected': 'Order Rejected'
};

export default function OrderDetailScreen({ navigation, route }) {
  const initialOrder = route.params?.order;
  const orderId = route.params?.orderId || (typeof initialOrder === 'object' ? initialOrder?.id : null);

  const [order, setOrder] = useState(typeof initialOrder === 'object' ? initialOrder : null);
  const [loading, setLoading] = useState(!order || !order.items);

  const { formatINR } = useCurrency();
  const { addSellerReview } = useReviews();
  const { user } = useAuth();
  const { fetchOrderById, fetchShipment } = useOrders();
  const { fetchShipmentHistory, history } = useLogistics();
  const { addItem } = useCart();
  const [shipment, setShipment] = useState(null);

  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (!order || !order.items) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchOrderById(orderId);
    if (data) {
      setOrder(data);
      if (data.status === 'Dispatched' || data.status === 'Delivered') {
        const shipData = await fetchShipment(data.id);
        setShipment(shipData);
        if (shipData?.id) {
          await fetchShipmentHistory(shipData.id);
        }
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.textMuted }}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
        <Text style={{ fontSize: 18, ...FONTS.bold, marginTop: 20 }}>Order Not Found</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.primary, ...FONTS.bold }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleReorder = () => {
    if (!order?.items) return;

    order.items.forEach(item => {
      addItem({
        productId: item.productId,
        name: item.product?.name || 'Item',
        price: item.price,
        unit: item.unit || 'unit',
        sellerId: order.sellerId,
        sellerName: order.sellerName,
        quantity: item.quantity
      });
    });

    setShowOptionsMenu(false);
    Toast.show({
      type: 'success',
      text1: 'Items Reordered!',
      text2: 'Order items have been added to your cart.',
      visibilityTime: 4000
    });

    // Smoothly navigate to Cart
    setTimeout(() => {
      navigation.navigate('BuyerMain', { screen: 'Cart' });
    }, 1200);
  };

  const handleDownloadInvoice = () => {
    setShowOptionsMenu(false);
    setIsDownloading(true);
    setDownloadProgress(0);

    // Simulate PDF generation steps
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25;
      if (progress >= 100) {
        setDownloadProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setIsDownloading(false);
          Toast.show({
            type: 'success',
            text1: 'Invoice Downloaded',
            text2: `Invoice_${order.orderNumber || 'BML'}.pdf is saved.`
          });
        }, 500);
      } else {
        setDownloadProgress(progress);
      }
    }, 400);
  };

  const handleReportProblem = () => {
    setShowOptionsMenu(false);
    navigation.navigate('HelpSupport', {
      orderId: order.orderNumber || order.id,
      subject: 'Order Issue'
    });
  };
  const d = new Date(order.placedAt);
  const date = (order.placedAt && !isNaN(d.getTime()))
    ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Recently';

  const renderTimeline = () => {
    const isRejected = order.status === 'Rejected';
    // Dynamically show steps based on status
    const stepsToShow = isRejected ? ['Placed', 'Rejected'] : STATUS_STEPS;
    const currentStatusIndex = stepsToShow.indexOf(order?.status || 'Ordered');
    const shipmentEvents = shipment ? (history[shipment.id] || []) : [];

    return (
      <View style={styles.timelineContainer}>
        {stepsToShow.map((step, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          const isLast = index === stepsToShow.length - 1;
          const isStepRejected = isRejected && step === 'Rejected';

          return (
            <View key={step} style={styles.timelineStep}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  isCompleted && styles.dotCompleted,
                  isCurrent && styles.dotCurrent,
                  isStepRejected && styles.dotRejected
                ]}>
                  {isStepRejected ? (
                    <MaterialIcons name="close" size={14} color={COLORS.white} />
                  ) : isCompleted ? (
                    <MaterialIcons name="check" size={14} color={COLORS.white} />
                  ) : (
                    <View style={styles.dotInner} />
                  )}
                </View>
                {!isLast && <View style={[styles.timelineLine, isCompleted && styles.lineCompleted]} />}
              </View>
              <View style={styles.timelineRight}>
                <View style={styles.stepHeader}>
                  <Text style={[
                    styles.stepText,
                    isCompleted && styles.stepTextActive,
                    isCurrent && styles.stepTextCurrent,
                    isStepRejected && styles.stepTextRejected
                  ]}>
                    {STATUS_LABELS[step] || step}
                  </Text>
                  {isCurrent && (
                    <View style={[styles.currentBadge, isStepRejected && styles.badgeRejected]}>
                      <Text style={[styles.currentBadgeText, isStepRejected && styles.badgeTextRejected]}>
                        {isStepRejected ? 'Terminal Status' : 'Current Status'}
                      </Text>
                    </View>
                  )}
                </View>
                
                {isCompleted && (
                  <View>
                    <Text style={styles.statusTime}>
                      {isStepRejected ? 'Order could not be processed' : isCurrent ? `Latest update: Today` : `Completed`}
                    </Text>
                    
                    {/* Granular Tracking Events for Dispatched stage */}
                    {step === 'Dispatched' && shipmentEvents.length > 0 && (
                      <View style={styles.granularHistory}>
                        {shipmentEvents.map((evt, eIdx) => (
                          <View key={evt.id || eIdx} style={styles.historyRow}>
                            <View style={styles.historyDot} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.historyText}>{evt.message}</Text>
                              <Text style={styles.historyLoc}>{evt.location} • {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {((step === 'Dispatched' || step === 'Delivered') && shipment) && (
                      <View style={styles.shipmentSmallInfo}>
                        <Text style={styles.shipmentSmallText}>{shipment.provider?.name} • {shipment.trackingNumber}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRejectedBanner = () => {
    if (order.status !== 'Rejected') return null;
    return (
      <View style={styles.rejectedBanner}>
        <View style={styles.rejectedIconBox}>
          <MaterialIcons name="error" size={24} color={COLORS.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rejectedTitle}>Order Rejected by Seller</Text>
          <Text style={styles.rejectedSubTitle}>We apologize, but the merchant is unable to fulfill this order at this time. A full refund has been initiated.</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2838" />

      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BuyerMain', { screen: 'Orders' })}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Order Details</Text>
            <View style={styles.orderIdBadge}>
              <Text style={styles.orderIdText}>#{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => setShowOptionsMenu(true)}
          >
            <MaterialIcons name="more-vert" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 10 }} />

        {renderRejectedBanner()}

        {/* Status Card - Visual Upgrade */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <MaterialIcons name="local-shipping" size={20} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Tracking Status</Text>
              <Text style={styles.cardSubTitle}>Real-time updates for your order</Text>
            </View>
          </View>
          {renderTimeline()}
        </View>

        {/* Items Card - Visual Upgrade */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <MaterialIcons name="inventory-2" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Order Summary</Text>
              <Text style={styles.cardSubTitle}>{(order?.items?.length || 0)} items in this package</Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {order?.items?.map((item, idx) => (
              <View key={item.productId || idx} style={styles.itemRow}>
                <View style={styles.itemImageContainer}>
                  <MaterialIcons name="engineering" size={28} color={COLORS.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.product?.name || 'Item'}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} {item.unit || 'unit'} × {formatINR(item.price)}
                  </Text>
                </View>
                {order.status === 'Delivered' ? (
                  <TouchableOpacity
                    style={styles.rateItemBtn}
                    onPress={() => navigation.navigate('WriteReview', {
                      productId: item.productId,
                      name: item.product?.name || 'this item',
                      type: 'product'
                    })}
                  >
                    <MaterialIcons name="star-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.rateItemText}>Rate</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.itemPrice}>{formatINR(item.price * item.quantity)}</Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Items Subtotal</Text>
              <Text style={styles.priceValue}>{formatINR(order.subtotal || order.total - 150)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Shipping & Handling</Text>
              <Text style={styles.priceValue}>{formatINR(order.deliveryFee || 150)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>{formatINR(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Info Card - Visual Upgrade */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <MaterialIcons name="assignment" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.cardTitle}>Order Info</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconCircle}>
                <MaterialIcons name="location-on" size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTag}>Delivery Address</Text>
                <Text style={styles.infoText}>{order.address}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconCircle}>
                <MaterialIcons name="payments" size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTag}>Payment Status</Text>
                <Text style={styles.infoText}>{order.paymentMethod} • Success</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Merchant Card - Visual Upgrade */}
        <View style={[styles.mainCard, { marginBottom: 30 }]}>
          <Text style={styles.merchantSectionTitle}>Merchant Details</Text>
          <TouchableOpacity
            style={styles.merchantCard}
            onPress={() => navigation.navigate('SellerProfile', { sellerId: order.sellerId })}
          >
            <View style={styles.merchantAvatar}>
              <Text style={styles.merchantInitial}>{(order.seller?.name || order.sellerName || 'M').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.merchantName}>{order.seller?.name || order.sellerName || 'Verified Merchant'}</Text>
              <View style={styles.verifiedRow}>
                <MaterialIcons name="verified" size={14} color={COLORS.success} />
                <Text style={styles.verifiedText}>BuildMart Verified Seller</Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryAction}>
              <MaterialIcons name="headset-mic" size={18} color={COLORS.white} />
              <Text style={styles.primaryActionText}>Help Center</Text>
            </TouchableOpacity>

            {order.status === 'Delivered' && (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => navigation.navigate('WriteReview', {
                  sellerId: order.sellerId,
                  name: order.seller?.name || order.sellerName || 'this merchant',
                  type: 'seller'
                })}
              >
                <MaterialIcons name="rate-review" size={18} color={COLORS.accent} />
                <Text style={styles.secondaryActionText}>Rate Merchant</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* More Options Modal */}
      <Modal visible={showOptionsMenu} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.optionsOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsContent}>
            <Text style={styles.optionsTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleDownloadInvoice}
            >
              <MaterialIcons name="description" size={22} color={COLORS.primary} />
              <Text style={styles.optionText}>Download Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleReorder}
            >
              <MaterialIcons name="replay" size={22} color={COLORS.primary} />
              <Text style={styles.optionText}>Reorder Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleReportProblem}
            >
              <MaterialIcons name="report-problem" size={22} color={COLORS.error} />
              <Text style={styles.optionText}>Report a Problem</Text>
            </TouchableOpacity>

            <View style={styles.optionsDivider} />

            <TouchableOpacity
              style={styles.optionsCloseBtn}
              onPress={() => setShowOptionsMenu(false)}
            >
              <Text style={styles.optionsCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Download Loader Modal */}
      <Modal visible={isDownloading} transparent>
        <View style={styles.downloadOverlay}>
          <View style={styles.downloadContent}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.downloadTitle}>Generating Invoice...</Text>
            <View style={styles.progressBarWrapper}>
              <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
            </View>
            <Text style={styles.downloadProgressText}>{Math.round(downloadProgress)}% complete</Text>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F2F5' },

  /* Header Styles */
  header: {
    backgroundColor: '#1B2838',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    ...SHADOWS.lg,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitleGroup: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 22, ...FONTS.bold, color: COLORS.white },
  orderIdBadge: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, marginTop: 6, borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)'
  },
  orderIdText: { fontSize: 13, ...FONTS.bold, color: COLORS.accent, letterSpacing: 0.5 },
  moreBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  body: { padding: 16, gap: 16 },

  /* Card Base */
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  cardIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center'
  },
  cardTitle: { fontSize: 17, ...FONTS.bold, color: COLORS.textPrimary },
  cardSubTitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  /* Timeline Styles */
  timelineContainer: { marginTop: 5 },
  timelineStep: { flexDirection: 'row', paddingBottom: 20 },
  timelineLeft: { alignItems: 'center', width: 30, marginRight: 15 },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
    zIndex: 2, borderWidth: 4, borderColor: COLORS.white
  },
  dotCompleted: { backgroundColor: COLORS.success },
  dotCurrent: { backgroundColor: COLORS.white, borderColor: COLORS.accent, borderWidth: 6 },
  dotRejected: { backgroundColor: COLORS.error, borderColor: COLORS.white },
  dotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.white },
  timelineLine: {
    position: 'absolute', top: 24, bottom: -10,
    width: 2, backgroundColor: '#E2E8F0', zIndex: 1
  },
  lineCompleted: { backgroundColor: COLORS.success },
  timelineRight: { flex: 1, justifyContent: 'center' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepText: { fontSize: 15, color: '#94A3B8', ...FONTS.semiBold },
  stepTextActive: { color: COLORS.textPrimary, ...FONTS.bold },
  stepTextCurrent: { color: COLORS.accent },
  stepTextRejected: { color: COLORS.error },
  currentBadge: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6
  },
  currentBadgeText: { fontSize: 10, ...FONTS.bold, color: COLORS.accent, textTransform: 'uppercase' },
  badgeRejected: { backgroundColor: 'rgba(231,76,60,0.1)' },
  badgeTextRejected: { color: COLORS.error },
  statusTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  /* Items Section */
  itemsList: { gap: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemImageContainer: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EDF2F7'
  },
  itemName: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },
  itemMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  itemPrice: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },

  priceSummary: { gap: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, color: COLORS.textSecondary },
  priceValue: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#F1F5F9', borderStyle: 'dashed'
  },
  totalLabel: { fontSize: 18, ...FONTS.extraBold, color: COLORS.textPrimary },
  totalValue: { fontSize: 22, ...FONTS.extraBold, color: COLORS.accent },

  /* Info Grid */
  infoGrid: { gap: 18 },
  infoItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center'
  },
  infoTag: { fontSize: 11, ...FONTS.bold, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  infoText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20, ...FONTS.medium },

  /* Merchant Section */
  merchantSectionTitle: { fontSize: 14, ...FONTS.bold, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 15 },
  merchantCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F8FAFC', padding: 15, borderRadius: 20, borderSize: 1, borderColor: '#F1F5F9'
  },
  merchantAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm
  },
  merchantInitial: { fontSize: 20, ...FONTS.bold, color: COLORS.white },
  merchantName: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { fontSize: 12, color: COLORS.success, ...FONTS.medium },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  primaryAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 16, ...SHADOWS.sm
  },
  primaryActionText: { color: COLORS.white, fontSize: 14, ...FONTS.bold },
  secondaryAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: COLORS.accent, paddingVertical: 14, borderRadius: 16
  },
  secondaryActionText: { color: COLORS.accent, fontSize: 14, ...FONTS.bold },

  /* Options Modal Details */
  optionsOverlay: { flex: 1, backgroundColor: 'rgba(27,40,56,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  optionsContent: {
    backgroundColor: COLORS.white, width: '90%', borderRadius: 28,
    padding: 24, ...SHADOWS.lg
  },
  optionsTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 20, textAlign: 'center' },
  optionItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  optionText: { fontSize: 16, color: COLORS.textPrimary, ...FONTS.semiBold },
  optionsDivider: { height: 20 },
  optionsCloseBtn: {
    backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 16,
    alignItems: 'center'
  },
  optionsCloseText: { fontSize: 15, ...FONTS.bold, color: COLORS.textSecondary },

  /* Download Modal Details */
  downloadOverlay: { flex: 1, backgroundColor: 'rgba(27,40,56,0.85)', justifyContent: 'center', alignItems: 'center' },
  downloadContent: {
    backgroundColor: COLORS.white, padding: 32, borderRadius: 24,
    alignItems: 'center', width: '80%', ...SHADOWS.lg
  },
  downloadTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary, marginTop: 16, marginBottom: 24 },
  progressBarWrapper: { width: '100%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: COLORS.success },
  downloadProgressText: { fontSize: 12, color: COLORS.textMuted, marginTop: 12, ...FONTS.medium },

  optionsCloseText: { fontSize: 15, ...FONTS.bold, color: COLORS.textSecondary },

  rejectedBanner: {
    backgroundColor: COLORS.error,
    borderRadius: 20,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    marginBottom: 8,
    alignItems: 'center',
    ...SHADOWS.md
  },
  rejectedIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center'
  },
  rejectedTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.white },
  rejectedSubTitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4, lineHeight: 18 },

  /* Modal Details */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(27,40,56,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    ...SHADOWS.lg
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  modalTitle: { fontSize: 22, ...FONTS.bold, color: COLORS.textPrimary },
  modalSubTitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  starSelector: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 30 },
  reviewInput: {
    backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20,
    height: 150, textAlignVertical: 'top', fontSize: 15, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24
  },
  submitReviewBtn: {
    backgroundColor: COLORS.accent, paddingVertical: 16, borderRadius: 20,
    alignItems: 'center', ...SHADOWS.md
  },
  submitReviewText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },
  disabledBtn: { backgroundColor: '#CBD5E0' },
  
  shipmentSmallInfo: { 
    backgroundColor: '#F0F9FF', paddingHorizontal: 8, paddingVertical: 4, 
    borderRadius: 6, marginTop: 4, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#BAE6FD'
  },
  shipmentSmallText: { fontSize: 11, ...FONTS.bold, color: COLORS.primary },
  
  /* Granular History Styles */
  granularHistory: { marginTop: 12, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: '#E2E8F0', marginLeft: 4, gap: 12 },
  historyRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  historyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginTop: 6 },
  historyText: { fontSize: 13, color: COLORS.textPrimary, ...FONTS.medium },
  historyLoc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  /* Rating Action Styles */
  rateItemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#BAE6FD'
  },
  rateItemText: { fontSize: 13, ...FONTS.bold, color: COLORS.primary },
});
