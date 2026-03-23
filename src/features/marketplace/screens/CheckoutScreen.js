import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useOrders } from '../../../context/OrderContext';
import { useAddresses } from '../../../context/AddressContext';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import useCurrency from '../../../hooks/useCurrency';

import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import useCurrency from '../../../hooks/useCurrency';
import PaymentSimulationModal from '../../../components/shared/PaymentSimulationModal';

const PAYMENT_METHODS = [
  { id: 'COD', label: 'Cash on Delivery', icon: 'payments', sub: 'Pay when materials arrive' },
  { id: 'UPI', label: 'UPI / Net Banking', icon: 'account-balance', sub: 'Instant & Secure' },
  { id: 'Card', label: 'Credit / Debit Card', icon: 'credit-card', sub: 'All major cards accepted' },
];

export default function CheckoutScreen({ navigation, route }) {
  const { subtotal = 0, deliveryFee = 150, total = 0 } = route.params || {};
  const { items, clearCart } = useCart();
  const { placeOrder, verifyPayment } = useOrders();
  const { user } = useAuth();
  const { addresses, addAddress } = useAddresses();
  const { formatINR } = useCurrency();

  const [addressMode, setAddressMode] = useState('saved');
  const [selectedSavedId, setSelectedSavedId] = useState(null);
  const [manualAddress, setManualAddress] = useState({ street: '', city: '', state: '', pin: '' });
  const [saveAddress, setSaveAddress] = useState(false);
  const [errors, setErrors] = useState({});
  const [payment, setPayment] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Group items by seller for review
  const groupedItems = items.reduce((acc, item) => {
    const seller = item.sellerName || 'Marketplace';
    if (!acc[seller]) acc[seller] = [];
    acc[seller].push(item);
    return acc;
  }, {});

  const sellerGroups = Object.keys(groupedItems);

  React.useEffect(() => {
    if (selectedSavedId === null && addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedSavedId(defaultAddr.id);
    }
  }, [addresses]);

  const handleAutoFill = async () => {
    setIsLocating(true);
    setAddressMode('manual');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied' });
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const results = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (results && results.length > 0) {
        const place = results[0];
        setManualAddress({
          street: [place.name, place.street].filter(Boolean).join(', '),
          city: place.city || '',
          state: place.region || '',
          pin: place.postalCode || '',
        });
        setErrors({});
        Toast.show({ type: 'success', text1: 'Address Detected' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Location Error' });
    } finally {
      setIsLocating(false);
    }
  };

  const handlePlaceOrder = async () => {
    let finalAddress = '';
    if (addressMode === 'saved') {
      const savedAddr = addresses.find(a => a.id === selectedSavedId);
      if (!savedAddr) {
        Toast.show({ type: 'info', text1: 'Select Address' });
        return;
      }
      finalAddress = `${savedAddr.address}, ${savedAddr.city}, ${savedAddr.pin}`;
    } else {
      let newErrors = {};
      if (!manualAddress.street.trim()) newErrors.street = 'Required';
      if (!manualAddress.city.trim()) newErrors.city = 'Required';
      if (!manualAddress.pin.trim()) newErrors.pin = 'Required';
      if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
      finalAddress = `${manualAddress.street}, ${manualAddress.city}, ${manualAddress.pin}`;
      if (saveAddress) {
        addAddress({ ...manualAddress, address: manualAddress.street, type: 'Home' });
      }
    }

    if (payment === 'COD') {
      // Cash on Delivery - Direct Flow
      setLoading(true);
      try {
        const newOrders = await placeOrder(items, {
          buyerId: user?.id,
          address: finalAddress,
          paymentMethod: payment,
          subtotal,
          deliveryFee
        });
        clearCart();
        setLoading(false);
        navigation.navigate('OrderSuccess', { total, order: newOrders[0] });
      } catch (err) {
        setLoading(false);
      }
    } else {
      // Digital Payment - Simulation Flow
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = async (transactionId) => {
    setShowPaymentModal(false);
    setLoading(true);

    try {
      // 1. Resolve Address again for reuse
      let finalAddress = '';
      if (addressMode === 'saved') {
        const addr = addresses.find(a => a.id === selectedSavedId);
        finalAddress = `${addr.address}, ${addr.city}, ${addr.pin}`;
      } else {
        finalAddress = `${manualAddress.street}, ${manualAddress.city}, ${manualAddress.pin}`;
      }

      // 2. Create the orders (Status: PLACED, Payment: PENDING)
      const newOrders = await placeOrder(items, {
        buyerId: user?.id,
        address: finalAddress,
        paymentMethod: payment,
        subtotal,
        deliveryFee
      });

      // 3. Verify Payment for each order created (e.g. multi-seller split)
      await Promise.all(newOrders.map(order => 
        verifyPayment(order.id, { 
          transactionId, 
          details: { method: payment, timestamp: new Date().toISOString() } 
        })
      ));

      clearCart();
      setLoading(false);
      navigation.navigate('OrderSuccess', { total, order: newOrders[0] });
      
      Toast.show({ 
        type: 'success', 
        text1: 'Payment Verified', 
        text2: 'Your procurement has been confirmed.' 
      });
    } catch (err) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Verification Failed', text2: 'Please contact support.' });
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color={COLORS.textPrimary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Order</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Address Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping To</Text>
            {addressMode === 'manual' && (
              <TouchableOpacity onPress={handleAutoFill} disabled={isLocating}>
                <Text style={styles.actionText}>{isLocating ? 'Locating...' : 'Auto-detect'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, addressMode === 'saved' && styles.tabActive]}
              onPress={() => setAddressMode('saved')}
            >
              <Text style={[styles.tabText, addressMode === 'saved' && styles.tabTextActive]}>Saved</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, addressMode === 'manual' && styles.tabActive]}
              onPress={() => setAddressMode('manual')}
            >
              <Text style={[styles.tabText, addressMode === 'manual' && styles.tabTextActive]}>New Address</Text>
            </TouchableOpacity>
          </View>

          {addressMode === 'saved' ? (
            <View style={styles.savedContainer}>
              {addresses.length > 0 ? (
                addresses.map(addr => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[styles.addressItem, selectedSavedId === addr.id && styles.addressItemActive]}
                    onPress={() => setSelectedSavedId(addr.id)}
                  >
                    <MaterialIcons
                      name={selectedSavedId === addr.id ? "radio-button-checked" : "radio-button-unchecked"}
                      size={20} color={selectedSavedId === addr.id ? COLORS.primary : COLORS.textMuted}
                    />
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressLabel}>{addr.type}</Text>
                      <Text style={styles.addressText} numberOfLines={1}>{addr.address}, {addr.city}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No saved addresses found.</Text>
              )}
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                placeholder="Street Address"
                style={[styles.input, errors.street && styles.inputError]}
                value={manualAddress.street}
                onChangeText={t => setManualAddress({ ...manualAddress, street: t })}
              />
              <View style={styles.row}>
                <TextInput
                  placeholder="City"
                  style={[styles.input, { flex: 1 }, errors.city && styles.inputError]}
                  value={manualAddress.city}
                  onChangeText={t => setManualAddress({ ...manualAddress, city: t })}
                />
                <TextInput
                  placeholder="PIN Code"
                  style={[styles.input, { flex: 1 }, errors.pin && styles.inputError]}
                  value={manualAddress.pin}
                  onChangeText={t => setManualAddress({ ...manualAddress, pin: t })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>

        {/* Items Review */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {sellerGroups.map(seller => (
            <View key={seller} style={styles.sellerGroup}>
              <Text style={styles.sellerName}>{seller}</Text>
              {groupedItems[seller].map(item => (
                <View key={item.productId} style={styles.reviewItem}>
                  <View style={styles.itemBullet} />
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>{formatINR(item.price * item.quantity)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.paymentItem, payment === m.id && styles.paymentItemActive]}
              onPress={() => setPayment(m.id)}
            >
              <View style={[styles.paymentIcon, payment === m.id && styles.paymentIconActive]}>
                <MaterialIcons name={m.icon} size={22} color={payment === m.id ? COLORS.white : COLORS.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentName, payment === m.id && styles.paymentNameActive]}>{m.label}</Text>
                <Text style={styles.paymentSub}>{m.sub}</Text>
              </View>
              {payment === m.id && <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatINR(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Logistics Fee</Text>
            <Text style={styles.totalValue}>{formatINR(deliveryFee)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatINR(total)}</Text>
          </View>
        </View>

        <View style={styles.safetyInfo}>
          <MaterialIcons name="security" size={14} color={COLORS.success} />
          <Text style={styles.safetyText}>Your procurement is protected by BuildMart Secure</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <LinearGradient
            colors={[COLORS.primary, '#0F172A']}
            style={styles.payGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <Text style={styles.payBtnText}>Processing...</Text>
            ) : (
              <>
                <Text style={styles.payBtnText}>Place Your Order</Text>
                <MaterialIcons name="arrow-forward" size={18} color={COLORS.white} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <PaymentSimulationModal
        visible={showPaymentModal}
        amount={total}
        method={PAYMENT_METHODS.find(m => m.id === payment)?.label}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowPaymentModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },

  body: { padding: 20 },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, ...SHADOWS.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 12 },
  actionText: { fontSize: 12, ...FONTS.bold, color: COLORS.primary },

  /* Tabs */
  tabBar: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.white, ...SHADOWS.sm },
  tabText: { fontSize: 13, color: COLORS.textMuted, ...FONTS.medium },
  tabTextActive: { color: COLORS.primary, ...FONTS.bold },

  /* Address */
  addressItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 12, color: COLORS.textMuted, textTransform: 'uppercase' },
  addressText: { fontSize: 14, color: COLORS.textPrimary, ...FONTS.medium },

  /* Form */
  form: { gap: 12 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#F1F5F9' },
  inputError: { borderColor: COLORS.error },
  row: { flexDirection: 'row', gap: 12 },

  /* Items Review */
  sellerGroup: { marginBottom: 16 },
  sellerName: { fontSize: 12, color: COLORS.primary, ...FONTS.bold, marginBottom: 8, textTransform: 'uppercase' },
  reviewItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  itemBullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.textMuted },
  itemName: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  itemQty: { fontSize: 13, color: COLORS.textMuted, marginHorizontal: 8 },
  itemPrice: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },

  /* Payment */
  paymentItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  paymentItemActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(30,58,138,0.02)' },
  paymentIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  paymentIconActive: { backgroundColor: COLORS.primary },
  paymentName: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },
  paymentSub: { fontSize: 12, color: COLORS.textMuted },

  /* Totals */
  totalsCard: { padding: 8, marginBottom: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: COLORS.textSecondary },
  totalValue: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  grandTotalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  grandTotalLabel: { fontSize: 18, ...FONTS.extraBold, color: COLORS.textPrimary },
  grandTotalValue: { fontSize: 22, ...FONTS.extraBold, color: COLORS.primary },

  safetyInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.8 },
  safetyText: { fontSize: 11, color: COLORS.success, ...FONTS.medium },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1, borderTopColor: '#F1F5F9', ...SHADOWS.lg
  },
  payBtn: { height: 60, borderRadius: 16, overflow: 'hidden', ...SHADOWS.md },
  payGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  payBtnText: { color: COLORS.white, fontSize: 18, ...FONTS.bold },
});
