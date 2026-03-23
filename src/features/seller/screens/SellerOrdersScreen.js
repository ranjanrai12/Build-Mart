import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import { useOrders } from '../../../context/OrderContext';
import { useAuth } from '../../../context/AuthContext';
import { COLORS, FONTS, SHADOWS } from '../../../constants/theme';
import OrderStatusBadge from '../../../components/shared/OrderStatusBadge';
import EmptyState from '../../../components/shared/EmptyState';
import useCurrency from '../../../hooks/useCurrency';

const TABS = ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Delivered', 'Rejected'];

export default function SellerOrdersScreen({ navigation, route }) {
  const { user } = useAuth();
  const { sellerOrders, advanceStatus, rejectOrder } = useOrders();
  const { formatINR } = useCurrency();
  const [activeTab, setActiveTab] = useState('Placed');

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  const [confirmStatus, setConfirmStatus] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);

  const sellerId = user?.id || 's1';
  const myOrders = sellerOrders(sellerId);
  const filteredOrders = myOrders.filter(o => o.status === activeTab);

  const getCount = (status) => myOrders.filter(o => o.status === status).length;

  const handleAdvance = (order) => {
    const nextStatus = {
      Placed: 'Confirmed',
      Confirmed: 'Packed',
      Packed: 'Dispatched',
      Dispatched: 'Delivered'
    }[order.status];
    if (!nextStatus) return;
    setConfirmStatus({ order, nextStatus });
  };

  const onConfirmUpdate = () => {
    const { order, nextStatus } = confirmStatus;
    advanceStatus(order.id);
    setConfirmStatus(null);
    Toast.show({
      type: 'success',
      text1: 'Status Updated! ✓',
      text2: `Order is now ${nextStatus}.`,
    });
  };

  const renderItem = ({ item }) => {
    const orderId = item.id.split('-')[0].toUpperCase();
    const rawDate = item.placedAt || item.createdAt;
    const d = new Date(rawDate);
    const orderDate = (rawDate && !isNaN(d.getTime())) 
      ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
      : 'Recently';

    return (
      <View style={styles.card}>
        {/* Card Header: ID & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.idBadge}>
              <Text style={styles.idLabel}>ORDER ID</Text>
              <Text style={styles.idValue}>#{orderId}</Text>
            </View>
            <TouchableOpacity 
              style={styles.detailsBtn}
              onPress={() => navigation.navigate('SellerOrderDetail', { orderId: item.id })}
            >
              <Text style={styles.detailsBtnText}>View Details</Text>
              <MaterialIcons name="chevron-right" size={14} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
          <OrderStatusBadge status={item.status} />
        </View>

        {/* Card Content: Details */}
        <View style={styles.cardContent}>
          {/* Info Row: Date & Location */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons name="event" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{orderDate}</Text>
            </View>
            <View style={[styles.metaItem, { flex: 1 }]}>
              <MaterialIcons name="location-on" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>{item.address || 'Site Delivery'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Customer & Items */}
          <View style={styles.mainInfo}>
            <View style={styles.customerBox}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="person" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>CUSTOMER</Text>
                <Text style={styles.infoValue}>{item.buyerName || 'Guest Customer'}</Text>
              </View>
            </View>

            <View style={styles.financials}>
              <Text style={styles.totalLabel}>GRAND TOTAL</Text>
              <Text style={styles.totalValue}>{formatINR(item.total || 0)}</Text>
              <Text style={styles.itemCount}>{item.items?.length || 0} Products</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          {item.status !== 'Delivered' && item.status !== 'Rejected' && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: item.status === 'Placed' ? '#1E293B' : COLORS.success }]}
              onPress={() => handleAdvance(item)}
              activeOpacity={0.8}
            >
              <MaterialIcons 
                name={item.status === 'Placed' ? 'check-circle' : 'local-shipping'} 
                size={20} 
                color={COLORS.white} 
              />
              <Text style={styles.primaryBtnText}>
                Move to {{ Placed: 'Confirmed', Confirmed: 'Packed', Packed: 'Dispatched', Dispatched: 'Delivered' }[item.status]}
              </Text>
            </TouchableOpacity>
          )}

          {(item.status === 'Placed' || item.status === 'Confirmed') && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setConfirmReject(item)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="cancel" size={16} color={COLORS.error} />
              <Text style={styles.secondaryBtnText}>Reject this Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient colors={[COLORS.primary, '#1A2C3F']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerSubtitle}>Merchant Dashboard</Text>
          <Text style={styles.headerTitle}>Customer Orders</Text>
        </View>

        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {TABS.map(tab => {
              const count = getCount(tab);
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                  {count > 0 && (
                    <View style={[styles.badge, activeTab === tab ? styles.badgeActive : styles.badgeInactive]}>
                      <Text style={[styles.badgeText, activeTab === tab && styles.badgeTextActive]}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredOrders}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-long"
            title={`No ${activeTab.toLowerCase()} orders`}
            message="When customers order your materials, they will appear here."
          />
        }
        renderItem={renderItem}
      />

      <ConfirmModal
        visible={!!confirmStatus}
        title="Update Status?"
        message={confirmStatus ? `Are you sure you want to mark this order as "${confirmStatus.nextStatus}"?` : ''}
        onConfirm={onConfirmUpdate}
        onCancel={() => setConfirmStatus(null)}
        confirmText="Confirm"
        icon="check-circle"
      />

      <ConfirmModal
        visible={!!confirmReject}
        title="Reject Order?"
        message="This action cannot be undone. Are you sure you want to reject this order?"
        onConfirm={() => {
          rejectOrder(confirmReject.id);
          setConfirmReject(null);
          Toast.show({ type: 'error', text1: 'Order Rejected', text2: 'The buyer will be notified.' });
        }}
        onCancel={() => setConfirmReject(null)}
        confirmText="Reject"
        icon="cancel"
        danger
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 60, paddingBottom: 16,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    ...SHADOWS.lg,
  },
  headerContent: { paddingHorizontal: 20, marginBottom: 20 },
  headerSubtitle: { fontSize: 11, ...FONTS.bold, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5 },
  headerTitle: { fontSize: 26, ...FONTS.extraBold, color: COLORS.white, marginTop: 4 },
  tabsWrapper: { backgroundColor: 'transparent' },
  tabsScroll: { paddingHorizontal: 16 },
  tab: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 3, borderBottomColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  tabActive: { borderBottomColor: COLORS.white },
  tabText: { fontSize: 13, ...FONTS.semiBold, color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: COLORS.white, ...FONTS.bold },
  badge: { 
    position: 'absolute', top: 4, right: 0,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 18, alignItems: 'center' 
  },
  badgeActive: { backgroundColor: COLORS.accent },
  badgeInactive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  badgeText: { fontSize: 9, ...FONTS.bold, color: 'rgba(255,255,255,0.8)' },
  badgeTextActive: { color: COLORS.white },

  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: 16,
    ...SHADOWS.md,
    borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  idBadge: { gap: 2 },
  idLabel: { fontSize: 9, ...FONTS.bold, color: COLORS.textMuted, letterSpacing: 0.5 },
  idValue: { fontSize: 14, ...FONTS.extraBold, color: COLORS.textPrimary },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#E2E8F0' },
  detailsBtnText: { fontSize: 12, ...FONTS.bold, color: COLORS.accent },

  cardContent: { padding: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, ...FONTS.semiBold, color: COLORS.textSecondary },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  
  mainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerBox: { flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 9, ...FONTS.bold, color: COLORS.textMuted, letterSpacing: 0.5 },
  infoValue: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary, marginTop: 1 },
  
  financials: { alignItems: 'flex-end' },
  totalLabel: { fontSize: 9, ...FONTS.bold, color: COLORS.textMuted },
  totalValue: { fontSize: 18, ...FONTS.extraBold, color: COLORS.primary },
  itemCount: { fontSize: 10, ...FONTS.medium, color: COLORS.textMuted, marginTop: 2 },

  cardActions: { padding: 16, paddingTop: 4, gap: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    ...SHADOWS.sm,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, ...FONTS.bold },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  secondaryBtnText: { color: COLORS.error, fontSize: 13, ...FONTS.bold },
});
