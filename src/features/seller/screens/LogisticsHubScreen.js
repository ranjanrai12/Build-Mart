import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, LayoutAnimation, UIManager
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useOrders } from '../../../context/OrderContext';
import { useLogistics } from '../../../context/LogisticsContext';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import SearchBar from '../../../components/shared/SearchBar';

const StatusBadge = ({ status, isMissing }) => {
  const getColors = () => {
    if (status === 'Delivered') return { bg: '#F0FDF4', text: '#15803D', icon: 'check-circle' };
    
    // For other statuses, if tracking is missing, it's a pending action
    if (isMissing && status === 'Dispatched') return { bg: '#FFF7ED', text: '#EA580C', icon: 'pending' };
    
    switch (status) {
      case 'In Transit': return { bg: '#EFF6FF', text: '#1D4ED8', icon: 'local-shipping' };
      case 'Out for Delivery': return { bg: '#FAF5FF', text: '#7E22CE', icon: 'directions-bike' };
      case 'Picked Up': return { bg: '#F5F3FF', text: '#5B21B6', icon: 'hail' };
      case 'Dispatched': return { bg: '#EFF6FF', text: '#1D4ED8', icon: 'local-shipping' };
      default: return { bg: '#F8FAFC', text: '#64748B', icon: 'inventory' };
    }
  };
  const config = getColors();
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <MaterialIcons name={config.icon} size={12} color={config.text} />
      <Text style={[styles.badgeText, { color: config.text }]}>{status}</Text>
    </View>
  );
};

const StatCard = ({ label, value, color, icon }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
      <MaterialIcons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const FilterChip = ({ label, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.chip, active && styles.activeChip]} 
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && styles.activeChipText]}>{label}</Text>
  </TouchableOpacity>
);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LogisticsHubScreen({ navigation }) {
  const { orders, refreshOrders } = useOrders();
  const { getShipmentByOrder, simulateTracking, fetchShipmentHistory, history } = useLogistics();
  const [activeShipments, setActiveShipments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    refreshOrders();
  }, []);

  useEffect(() => {
    updateShipments();
  }, [orders]);

  const updateShipments = async () => {
    const dispatched = orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered');
    
    if (dispatched.length === 0) {
      setActiveShipments([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const shipmentPromises = dispatched.map(async (order) => {
      const shipment = await getShipmentByOrder(order.id);
      return { ...order, shipment };
    });

    const results = await Promise.all(shipmentPromises);
    setActiveShipments(results);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
  };

  const handleSimulate = async (trackingNumber) => {
    const res = await simulateTracking(trackingNumber);
    if (res.success) {
      Toast.show({ type: 'success', text1: 'Tracking Updated', text2: 'Simulation advanced to next stage.' });
      refreshOrders();
    }
  };

  const toggleExpand = async (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedId === item.id) {
      setExpandedId(null);
    } else {
      if (item.shipment) {
        await fetchShipmentHistory(item.shipment.id);
      }
      setExpandedId(item.id);
    }
  };

  const filteredShipments = activeShipments.filter(item => {
    const matchesSearch = 
      (item.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.shipment?.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'In Transit' && item.status === 'Dispatched') ||
      (statusFilter === 'Delivered' && item.status === 'Delivered') ||
      (statusFilter === 'Pending Tracking' && !item.shipment && item.status !== 'Delivered');

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: activeShipments.length,
    active: activeShipments.filter(s => s.status === 'Dispatched').length,
    delivered: activeShipments.filter(s => s.status === 'Delivered').length,
    pending: activeShipments.filter(s => !s.shipment && s.status !== 'Delivered').length,
  };

  const renderShipment = ({ item }) => {
    const isMissing = !item.shipment;
    const isExpanded = expandedId === item.id;
    const buyerInitial = (item.buyer?.name || 'C').charAt(0);
    const itemHistory = item.shipment ? history[item.shipment.id] || [] : [];

    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.shipmentCard}
          activeOpacity={0.9}
          onPress={() => toggleExpand(item)}
        >
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={styles.orderLabelBox}>
              <Text style={styles.orderLabel}>Order #{item.orderNumber || item.id.split('-')[0].toUpperCase()}</Text>
              <Text style={[styles.trackingId, isMissing && styles.missingIdText]}>
                {item.shipment?.trackingNumber || (item.status === 'Delivered' ? 'Direct Fulfillment' : 'Tracking ID: Pending')}
              </Text>
            </View>
            <StatusBadge status={item.shipment?.status || item.status} isMissing={isMissing} />
          </View>

          {/* Customer Row */}
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{buyerInitial}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.buyer?.name || 'Merchant Order'}</Text>
              <View style={styles.addressRow}>
                <MaterialIcons name="location-on" size={14} color={COLORS.textMuted} />
                <Text style={styles.addressText} numberOfLines={1}>{item.address || 'Standard Delivery'}</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SellerOrderDetail', { orderId: item.id })}
              style={styles.detailsChevron}
            >
              <MaterialIcons name="chevron-right" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Expanded History */}
          {isExpanded && item.shipment && (
            <View style={styles.expandedContent}>
              <Text style={styles.historyTitle}>Tracking Timeline</Text>
              {itemHistory.length > 0 ? (
                itemHistory.slice(0, 3).map((update, idx) => (
                  <View key={idx} style={styles.historyItem}>
                    <View style={styles.historyDot} />
                    <View style={styles.historyLine} />
                    <View>
                      <Text style={styles.historyStatus}>{update.status}</Text>
                      <Text style={styles.historyLoc}>{update.location}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noHistory}>History log gathering...</Text>
              )}
            </View>
          )}

          {/* Logistic Details */}
          {!isExpanded && (
            <View style={styles.logisticDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Provider</Text>
                <Text style={styles.detailVal}>{item.shipment?.provider?.name || 'Not Assigned'}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailVal} numberOfLines={1}>{item.shipment?.currentLocation || 'Warehouse'}</Text>
              </View>
            </View>
          )}

          {/* Action Footer */}
          <View style={styles.cardActions}>
            {isMissing ? (
              <TouchableOpacity 
                style={styles.primaryAction}
                onPress={() => navigation.navigate('SellerOrderDetail', { orderId: item.id })}
              >
                <LinearGradient colors={item.status === 'Delivered' ? [COLORS.primary, '#101D2D'] : [COLORS.accent, '#EA580C']} style={styles.actionGradient}>
                  <MaterialIcons name={item.status === 'Delivered' ? 'list-alt' : 'local-shipping'} size={18} color={COLORS.white} />
                  <Text style={styles.actionText}>{item.status === 'Delivered' ? 'View Order Detail' : 'Ship Order Now'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : item.shipment.status !== 'Delivered' ? (
              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => handleSimulate(item.shipment.trackingNumber)}
              >
                <MaterialIcons name="fast-forward" size={18} color={COLORS.primary} />
                <Text style={styles.secondaryActionText}>Simulate Movement</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.completedTag}>
                <MaterialIcons name="verified" size={16} color={COLORS.success} />
                <Text style={styles.completedText}>Fulfillment Completed</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={[COLORS.primary, '#101D2D']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="keyboard-arrow-left" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Logistics Command</Text>
            <Text style={styles.headerSubtitle}>Real-time fulfillment hub</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.searchSection}>
          <SearchBar 
            placeholder="Search Order, ID, or Customer..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
          />
        </View>
      </LinearGradient>

      <View style={styles.filterSection}>
        <FlatList 
          horizontal
          data={['All', 'In Transit', 'Pending Tracking', 'Delivered']}
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <FilterChip 
              label={item} 
              active={statusFilter === item} 
              onPress={() => setStatusFilter(item)} 
            />
          )}
        />
      </View>

      <View style={styles.statsStrip}>
        <StatCard label="Active" value={stats.active} color={COLORS.info} icon="local-shipping" />
        <StatCard label="Ready" value={stats.pending} color={COLORS.warning} icon="inventory" />
        <StatCard label="Completed" value={stats.delivered} color={COLORS.success} icon="verified" />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredShipments}
          renderItem={renderShipment}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <MaterialIcons name="local-shipping" size={48} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Shipments Found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your filters or search query to find specific orders.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24, paddingHorizontal: 20,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
    ...SHADOWS.md,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 22, ...FONTS.bold, color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  searchSection: { marginTop: 20 },
  searchBar: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 0, paddingVertical: 12 },
  filterSection: { paddingVertical: 16 },
  filterList: { paddingHorizontal: 20, gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#E2E8F0' },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, ...FONTS.medium, color: COLORS.textSecondary },
  activeChipText: { color: COLORS.white, ...FONTS.bold },
  statsStrip: { flexDirection: 'row', gap: 8, paddingHorizontal: 15, marginBottom: 20 },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.white, padding: 8, borderRadius: 12, ...SHADOWS.sm },
  statIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: -2 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 120 },
  cardContainer: { marginBottom: 20, ...SHADOWS.md },
  shipmentCard: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#EEF2F7',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  orderLabelBox: { flex: 1 },
  orderLabel: { fontSize: 13, ...FONTS.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  trackingId: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary, marginTop: 4 },
  missingIdText: { color: COLORS.warning, fontStyle: 'italic', fontSize: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  badgeText: { fontSize: 12, ...FONTS.bold },
  customerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F8FAFC' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
  avatarText: { fontSize: 18, ...FONTS.bold, color: '#1D4ED8' },
  customerInfo: { flex: 1, marginLeft: 16 },
  customerName: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  addressText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  detailsChevron: { padding: 4 },
  expandedContent: { paddingVertical: 16, backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, marginBottom: 16 },
  historyTitle: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 12 },
  historyItem: { flexDirection: 'row', gap: 12, marginBottom: 12, position: 'relative' },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4 },
  historyLine: { position: 'absolute', left: 3, top: 12, bottom: -12, width: 2, backgroundColor: '#E2E8F0' },
  historyStatus: { fontSize: 13, ...FONTS.semiBold, color: COLORS.textPrimary },
  historyLoc: { fontSize: 12, color: COLORS.textMuted },
  noHistory: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center' },
  logisticDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, ...FONTS.bold, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  detailVal: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  detailDivider: { width: 1, height: '70%', backgroundColor: '#F1F5F9', marginHorizontal: 16, marginTop: 10 },
  cardActions: { marginTop: 8 },
  primaryAction: { borderRadius: 16, overflow: 'hidden', ...SHADOWS.sm },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  actionText: { fontSize: 15, ...FONTS.bold, color: COLORS.white },
  secondaryAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, backgroundColor: '#F0F9FF', borderRadius: 16,
    borderWidth: 1, borderColor: '#BAE6FD',
  },
  secondaryActionText: { fontSize: 14, ...FONTS.bold, color: COLORS.primary },
  completedTag: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#F0FDF4', borderRadius: 16 },
  completedText: { fontSize: 14, ...FONTS.bold, color: COLORS.success },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary },
  emptyDesc: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },
});
