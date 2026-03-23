import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Animated, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import { useCart } from '../../../context/CartContext';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import QuantitySelector from '../../../components/shared/QuantitySelector';
import useCurrency from '../../../hooks/useCurrency';

function CartItem({ item, onRemove, onDecrease, onIncrease, removeItemActual }) {
  const anim = useRef(new Animated.Value(1)).current;
  const { formatINR } = useCurrency();

  const handleRemove = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => removeItemActual(item.productId));
  };

  return (
    <Animated.View style={[styles.itemCard, { opacity: anim, transform: [{ scale: anim }] }]}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.priceRowSmall}>
              <Text style={styles.itemPriceSmall}>{formatINR(item.price)} / {item.unit}</Text>
              {item.originalPrice > item.price && (
                <View style={styles.bulkBadge}>
                  <Text style={styles.bulkBadgeText}>BULK SAVING</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => onRemove(item.productId, handleRemove)} style={styles.deleteIcon}>
            <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.itemFooter}>
          <QuantitySelector value={item.quantity} onDecrease={onDecrease} onIncrease={onIncrease} />
          <View style={{ alignItems: 'flex-end' }}>
            {item.originalPrice > item.price && (
              <Text style={styles.originalTotal}>{formatINR(item.originalPrice * item.quantity)}</Text>
            )}
            <Text style={styles.itemTotal}>{formatINR(item.price * item.quantity)}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQuantity, subtotal, itemCount, clearCart } = useCart();
  const { formatINR } = useCurrency();
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Group items by seller
  const groupedItems = items.reduce((acc, item) => {
    const seller = item.sellerName || 'Direct Marketplace';
    if (!acc[seller]) acc[seller] = [];
    acc[seller].push(item);
    return acc;
  }, {});

  const sellerGroups = Object.keys(groupedItems).map(seller => ({
    seller,
    items: groupedItems[seller]
  }));

  const uniqueSellers = sellerGroups.length;
  const deliveryFee = uniqueSellers * 150;
  const total = subtotal + deliveryFee;
  const totalSavings = items.reduce((sum, i) => sum + (i.originalPrice > i.price ? (i.originalPrice - i.price) * i.quantity : 0), 0);

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.emptyContainer}>
          <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.emptyIllustration}>
            <MaterialIcons name="shopping-bag" size={60} color={COLORS.primary} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Your cart is waiting</Text>
          <Text style={styles.emptySub}>Start adding building materials for your project</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('BuyerMain', { screen: 'Home' })}
          >
            <Text style={styles.browseText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Premium Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.headerCount}>{itemCount} Materials Selected</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={() => setClearConfirm(true)}>
          <MaterialIcons name="delete-sweep" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sellerGroups}
        keyExtractor={item => item.seller}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: group }) => (
          <View style={styles.sellerSection}>
            <View style={styles.sellerHeader}>
              <MaterialIcons name="storefront" size={18} color={COLORS.primary} />
              <Text style={styles.sellerName}>{group.seller}</Text>
            </View>
            {group.items.map(item => (
              <CartItem
                key={item.productId}
                item={item}
                onRemove={(id, act) => setRemoveConfirm({ id, action: act })}
                removeItemActual={removeItem}
                onDecrease={() => updateQuantity(item.productId, item.quantity - 1)}
                onIncrease={() => updateQuantity(item.productId, item.quantity + 1)}
              />
            ))}
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Package Subtotal</Text>
                <Text style={styles.summaryValue}>{formatINR(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Logistics ({uniqueSellers} Sellers)</Text>
                <Text style={styles.summaryValue}>{formatINR(deliveryFee)}</Text>
              </View>
              {totalSavings > 0 && (
                <View style={[styles.summaryRow, { marginTop: 4 }]}>
                  <Text style={[styles.summaryLabel, { color: COLORS.success, ...FONTS.bold }]}>Bulk In-Cart Savings</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.success }]}>-{formatINR(totalSavings)}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>{formatINR(total)}</Text>
              </View>
            </View>

            <View style={styles.trustBanner}>
              <MaterialIcons name="verified-user" size={16} color={COLORS.success} />
              <Text style={styles.trustText}>Buyer Protection Active · Safe Logistics Guaranteed</Text>
            </View>
          </View>
        }
      />

      {/* Floating Action CTA */}
      <View style={styles.checkoutBar}>
        <View style={styles.checkoutInfo}>
          <Text style={styles.checkoutLabel}>Total Payable</Text>
          <Text style={styles.checkoutTotal}>{formatINR(total)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout', { subtotal, deliveryFee, total })}
        >
          <LinearGradient
            colors={[COLORS.primary, '#0F172A']}
            style={styles.checkoutGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.checkoutBtnText}>Checkout</Text>
            <MaterialIcons name="arrow-forward" size={18} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={!!removeConfirm}
        title="Remove Item"
        message="Remove this material from your cart?"
        onConfirm={() => { removeConfirm.action(); setRemoveConfirm(null); }}
        onCancel={() => setRemoveConfirm(null)}
        confirmText="Remove"
        isDestructive
      />

      <ConfirmModal
        visible={clearConfirm}
        title="Clear Everything"
        message="Are you sure you want to empty your cart?"
        onConfirm={() => { clearCart(); setClearConfirm(false); }}
        onCancel={() => setClearConfirm(false)}
        confirmText="Clear All"
        isDestructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: COLORS.white,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  headerTitle: { fontSize: 24, ...FONTS.bold, color: COLORS.textPrimary },
  headerCount: { fontSize: 13, color: COLORS.textMuted, marginTop: 2, ...FONTS.medium },
  clearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: 12 },

  listContent: { padding: 20, paddingBottom: 150 },

  /* Seller Section */
  sellerSection: { marginBottom: 24 },
  sellerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sellerName: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },

  /* Item Card */
  itemCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  itemName: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary, flex: 1 },
  itemPriceSmall: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  deleteIcon: { padding: 4 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTotal: { fontSize: 18, ...FONTS.bold, color: COLORS.primary },

  /* Empty State */
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIllustration: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  browseBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, ...SHADOWS.md },
  browseText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },

  /* Footer & Summary */
  footer: { marginTop: 10 },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, ...SHADOWS.sm,    borderWidth: 1, borderColor: '#F1F5F9'
 },
  summaryTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: COLORS.textSecondary },
  summaryValue: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  totalLabel: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  totalValue: { fontSize: 22, ...FONTS.extraBold, color: COLORS.primary },
  trustBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  trustText: { fontSize: 12, color: COLORS.success, ...FONTS.medium },

  /* Sticky Bar */
  checkoutBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    ...SHADOWS.lg, borderTopWidth: 1, borderTopColor: '#F1F5F9'
  },
  checkoutInfo: { flex: 1 },
  checkoutLabel: { fontSize: 12, color: COLORS.textMuted },
  checkoutTotal: { fontSize: 20, ...FONTS.extraBold, color: COLORS.primary },
  checkoutBtn: { flex: 1.2, height: 54, borderRadius: 14, overflow: 'hidden' },
  checkoutGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  checkoutBtnText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },

  /* Bulk Styles */
  priceRowSmall: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  bulkBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bulkBadgeText: { color: '#15803D', fontSize: 9, ...FONTS.extraBold },
  originalTotal: { fontSize: 13, color: COLORS.textMuted, textDecorationLine: 'line-through', marginBottom: 2 },
});
