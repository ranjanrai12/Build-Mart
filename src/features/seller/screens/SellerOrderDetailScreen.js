import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useOrders } from '../../../context/OrderContext';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../../../constants/theme';
import OrderStatusBadge from '../../../components/shared/OrderStatusBadge';
import OrderStepTracker from '../../../components/shared/OrderStepTracker';
import useCurrency from '../../../hooks/useCurrency';
import Toast from 'react-native-toast-message';
import ConfirmModal from '../../../components/shared/ConfirmModal';

export default function SellerOrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { orders, advanceStatus, rejectOrder, fetchProviders, shipOrder, fetchShipment } = useOrders();
  const { formatINR } = useCurrency();
  const [showReject, setShowReject] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [isShipping, setIsShipping] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false); // New state for rejection loading

  const order = orders.find(o => o.id === orderId);

  useEffect(() => {
    if (!order) return;
    if (order.status === 'Packed') {
      fetchProviders().then(setProviders).catch(e => console.error(e));
    }
    if (order.status === 'Dispatched' || order.status === 'Delivered') {
      fetchShipment(order.id).then(setShipment).catch(e => console.error(e));
    }
  }, [order?.status, orderId]);

  if (!order) return null;

  const handleAdvance = () => {
    advanceStatus(order.id);
    Toast.show({ type: 'success', text1: 'Status Updated', text2: 'Order advanced successfully.' });
  };

  const handleShipOrder = async () => {
    if (!selectedProvider) return;
    try {
      setIsShipping(true);
      await shipOrder(order.id, selectedProvider);
      Toast.show({ type: 'success', text1: 'Order Shipped!', text2: 'Tracking ID generated.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Shipping Failed' });
    } finally {
      setIsShipping(false);
    }
  };

  const StatusMap = { Placed: 'Confirmed', Confirmed: 'Packed', Dispatched: 'Delivered' };
  const nextStatus = StatusMap[order.status] || null;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient colors={[COLORS.primary, '#1A2C3F']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('SellerMain')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerInfo}>
          <View>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderIdValue}>#{order.orderNumber || (order.id ? order.id.slice(0, 8).toUpperCase() : 'N/A')}</Text>
          </View>
          <OrderStatusBadge status={order.status} />
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(order.buyer?.name || 'C').charAt(0)}</Text>
            </View>
            <View style={styles.customerMeta}>
              <Text style={styles.customerName}>{order.buyer?.name || 'Customer'}</Text>
              <Text style={styles.customerPhone}>{order.buyer?.phone || 'No phone'}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => order.buyer?.phone && Linking.openURL(`tel:${order.buyer.phone}`)}>
              <MaterialIcons name="call" size={20} color={COLORS.success} />
            </TouchableOpacity>
          </View>
          <View style={styles.addressBox}>
            <MaterialIcons name="location-on" size={18} color={COLORS.textMuted} />
            <Text style={styles.addressText}>{order.address || 'No address'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fulfillment Progress</Text>
          <View style={{ marginTop: 10 }}><OrderStepTracker currentStatus={order.status} /></View>
        </View>

        {order.status === 'Packed' && (
          <View style={[styles.card, styles.shippingCard]}>
            <Text style={styles.sectionTitle}>Shipping Center</Text>
            <View style={styles.providerList}>
              {providers.map(p => (
                <TouchableOpacity key={p.id} style={[styles.providerItem, selectedProvider === p.id && styles.providerItemSelected]} onPress={() => setSelectedProvider(p.id)}>
                  <Text style={[styles.providerName, selectedProvider === p.id && styles.activeText]}>{p.name}</Text>
                  {selectedProvider === p.id && <MaterialIcons name="check-circle" size={20} color={COLORS.white} />}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.shipBtn, !selectedProvider && styles.disabled]} onPress={handleShipOrder} disabled={isShipping || !selectedProvider}>
              <LinearGradient colors={selectedProvider ? [COLORS.accent, '#EA580C'] : ['#CBD5E0', '#94A3B8']} style={styles.shipBtnGradient}>
                {isShipping ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.shipBtnText}>Dispatch & Generate ID</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {(order.status === 'Dispatched' || order.status === 'Delivered') && shipment && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Logistics Information</Text>
            <View style={styles.trackingRow}>
              <Text style={styles.trackLabel}>Provider</Text>
              <Text style={styles.trackValue}>{shipment.provider?.name || 'N/A'}</Text>
            </View>
            <View style={styles.trackingRow}>
              <Text style={styles.trackLabel}>Tracking ID</Text>
              <Text style={[styles.trackValue, { color: COLORS.accent }]}>{shipment.trackingNumber}</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items?.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSpec}>{item.quantity} x {formatINR(item.price)}</Text>
              </View>
              <Text style={styles.itemSubtotal}>{formatINR(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatINR(order.subtotal || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>{formatINR(order.deliveryFee || 0)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatINR(order.total || 0)}</Text>
          </View>
        </View>

        {nextStatus && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleAdvance}>
            <LinearGradient colors={[COLORS.accent, '#EA580C']} style={styles.gradientBtn}>
              <Text style={styles.btnText}>Mark as {nextStatus}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {(order.status === 'Placed' || order.status === 'Confirmed') && (
          <TouchableOpacity style={styles.rejectBtn} onPress={() => setShowReject(true)}>
            <Text style={styles.rejectText}>Reject Order</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmModal
        visible={showReject}
        title="Reject Order?"
        message="This action cannot be undone. The buyer will be notified."
        onConfirm={async () => { 
          try {
            setIsRejecting(true);
            setShowReject(false);
            await rejectOrder(order.id);
            Toast.show({ type: 'error', text1: 'Order Rejected', text2: 'Inventory has been released.' });
            navigation.goBack();
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Rejection Failed' });
          } finally {
            setIsRejecting(false);
          }
        }}
        onCancel={() => setShowReject(false)}
        confirmText="Reject"
        isDestructive
      />

      {(isRejecting || isShipping) && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingText}>
            {isRejecting ? 'Cancelling order...' : 'Generating tracking ID...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 16, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  headerTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.white },
  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24 },
  orderIdLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  orderIdValue: { fontSize: 24, ...FONTS.bold, color: COLORS.white },
  body: { paddingHorizontal: 16, paddingTop: 20 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 20, ...SHADOWS.sm, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 16 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, ...FONTS.bold, color: COLORS.primary },
  customerMeta: { flex: 1 },
  customerName: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  customerPhone: { fontSize: 13, color: COLORS.textMuted },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' },
  addressBox: { flexDirection: 'row', gap: 10, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  addressText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, ...FONTS.semiBold, color: COLORS.textPrimary },
  itemSpec: { fontSize: 12, color: COLORS.textMuted },
  itemSubtotal: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: COLORS.textMuted },
  totalValue: { fontSize: 20, ...FONTS.bold, color: COLORS.primary },
  actionBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.md },
  gradientBtn: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, ...FONTS.bold, color: COLORS.white },
  rejectBtn: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: COLORS.error, ...FONTS.semiBold },
  shippingCard: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  providerList: { gap: 10, marginBottom: 20 },
  providerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#E2E8F0' },
  providerItemSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  providerName: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  activeText: { color: COLORS.white },
  shipBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  shipBtnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  shipBtnText: { color: COLORS.white, fontSize: 14, ...FONTS.bold },
  disabled: { opacity: 0.6 },
  trackingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  trackLabel: { fontSize: 13, color: COLORS.textMuted },
  trackValue: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  processingText: {
    marginTop: 15,
    fontSize: 14,
    ...FONTS.bold,
    color: COLORS.primary,
  },
});
