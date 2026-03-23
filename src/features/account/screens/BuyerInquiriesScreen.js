import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
  ActivityIndicator, RefreshControl, Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import { useQuotes } from '../../../context/QuoteContext';
import { useAuth } from '../../../context/AuthContext';
import EmptyState from '../../../components/shared/EmptyState';
import Toast from 'react-native-toast-message';
import useCurrency from '../../../hooks/useCurrency';
import ConfirmModal from '../../../components/shared/ConfirmModal';

export default function BuyerInquiriesScreen({ navigation }) {
  const { user } = useAuth();
  const { quotes, loading, acceptQuote, rejectQuoteByBuyer, refreshQuotes } = useQuotes();
  const { formatINR } = useCurrency();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const buyerQuotes = quotes.filter(q => q.buyerId === user?.id || q.buyer?.id === user?.id);

  useFocusEffect(
    useCallback(() => {
      refreshQuotes();
    }, [refreshQuotes])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshQuotes();
    setRefreshing(false);
  };

  const handleAccept = (quote) => {
    setSelectedQuote(quote);
    setModalType('accept');
    setModalVisible(true);
  };

  const handleReject = (quote) => {
    setSelectedQuote(quote);
    setModalType('reject');
    setModalVisible(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedQuote) return;
    setIsProcessing(true);
    
    try {
      if (modalType === 'accept') {
        await acceptQuote(selectedQuote.id);
        Toast.show({ type: 'success', text1: 'Order Placed! ✓', text2: 'Your quote has been converted to an order.' });
        setModalVisible(false);
        navigation.navigate('Orders');
      } else if (modalType === 'reject') {
        await rejectQuoteByBuyer(selectedQuote.id);
        Toast.show({ type: 'info', text1: 'Offer Rejected', text2: 'The inquiry has been closed.' });
        setModalVisible(false);
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: modalType === 'accept' ? 'Accept Failed' : 'Reject Failed', text2: 'Please try again later.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return { bg: '#FEF3C7', text: '#92400E' };
      case 'Responded': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'Accepted': return { bg: '#D1FAE5', text: '#065F46' };
      case 'Declined':
      case 'Rejected':
      case 'Rejected by Buyer': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusColor(item.status);
    const d = new Date(item.createdAt);
    const formattedDate = (item.createdAt && !isNaN(d.getTime())) 
      ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
      : 'Recently';

    return (
      <View style={styles.premiumCard}>
        <View style={styles.cardTop}>
          <View style={styles.productInfo}>
            <View style={styles.iconBox}>
              <MaterialIcons name="inventory" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.premiumProductName} numberOfLines={1}>{item.product?.name || item.productName}</Text>
              <Text style={styles.premiumDateText}>Requested on {formattedDate}</Text>
            </View>
          </View>
          <View style={[styles.premiumStatusBadge, { backgroundColor: statusStyle.bg + '40' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
            <Text style={[styles.premiumStatusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.premiumStatsGrid}>
          <View style={styles.premiumStatItem}>
            <Text style={styles.premiumStatLabel}>QUANTITY</Text>
            <Text style={styles.premiumStatVal}>{item.quantity} <Text style={styles.premiumUnit}>Units</Text></Text>
          </View>
          <View style={[styles.premiumStatItem, styles.premiumStatBorder]}>
            <Text style={styles.premiumStatLabel}>TARGET PRICE</Text>
            <Text style={styles.premiumStatVal}>₹{item.targetPrice || item.product?.price}</Text>
          </View>
        </View>

        {item.status === 'Responded' && (
          <View style={styles.premiumOfferSection}>
            <View style={styles.premiumOfferHeader}>
              <View style={styles.offerIconBox}>
                <MaterialIcons name="local-offer" size={14} color={COLORS.white} />
              </View>
              <Text style={styles.premiumOfferLabel}>SELLER'S COUNTER OFFER</Text>
            </View>
            
            <View style={styles.offerPriceRow}>
              <Text style={styles.premiumOfferPrice}>{formatINR(item.offeredPrice)}</Text>
              <Text style={styles.premiumPerUnit}>per unit</Text>
            </View>

            {item.sellerNotes ? (
              <View style={styles.premiumNotesBox}>
                <Text style={styles.premiumNotesText} numberOfLines={2}>"{item.sellerNotes}"</Text>
              </View>
            ) : null}

            <View style={styles.premiumActionRow}>
              <TouchableOpacity 
                style={styles.premiumAcceptBtn} 
                onPress={() => handleAccept(item)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="shopping-cart" size={18} color={COLORS.white} />
                <Text style={styles.premiumAcceptBtnText}>Accept & Order</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.premiumRejectBtn} 
                onPress={() => handleReject(item)}
                activeOpacity={0.6}
              >
                <Text style={styles.premiumRejectBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {item.status === 'Accepted' && (
          <View style={styles.premiumAcceptedBadge}>
            <MaterialIcons name="verified" size={16} color={COLORS.success} />
            <Text style={styles.premiumAcceptedText}>Confirmed Order Created</Text>
          </View>
        )}

        {item.status === 'Rejected by Buyer' && (
          <View style={[styles.premiumAcceptedBadge, { backgroundColor: '#FEE2E2' }]}>
            <MaterialIcons name="cancel" size={16} color="#991B1B" />
            <Text style={[styles.premiumAcceptedText, { color: '#991B1B' }]}>Offer Declined</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Premium Dark Header */}
      <View style={styles.premiumHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.premiumHeaderTitle}>My Inquiries</Text>
          <Text style={styles.headerCount}>{buyerQuotes.length} active requests</Text>
        </View>
      </View>

      <FlatList
        data={buyerQuotes}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="inventory"
            title="No inquiries found"
            message="Your procurement requests will appear here once you start asking for quotes."
          />
        }
      />
      
      <ConfirmModal
        visible={modalVisible}
        title={modalType === 'accept' ? 'Accept Quote?' : 'Reject Offer?'}
        message={
          modalType === 'accept' && selectedQuote
            ? `This will create a firm order for ₹${formatINR(selectedQuote.offeredPrice)} per unit. Total: ₹${formatINR(selectedQuote.offeredPrice * selectedQuote.quantity)}.`
            : 'Are you sure you want to reject this seller\'s offer? This will close the inquiry.'
        }
        confirmText={modalType === 'accept' ? 'Accept & Order' : 'Reject'}
        confirmColor={modalType === 'accept' ? COLORS.primary : COLORS.error}
        onCancel={() => {
          if (!isProcessing) setModalVisible(false);
        }}
        onConfirm={handleConfirmAction}
        isProcessing={isProcessing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F5F9' },
  premiumHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 25,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOWS.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 12 },
  headerTitleWrap: { flex: 1 },
  premiumHeaderTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.white },
  headerCount: { fontSize: 12, color: 'rgba(255,255,255,0.6)', ...FONTS.medium, marginTop: 2 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },

  premiumCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  productInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center' },
  premiumProductName: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  premiumDateText: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  
  premiumStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  premiumStatusText: { fontSize: 11, ...FONTS.bold },

  premiumStatsGrid: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: RADIUS.lg, padding: 14, marginBottom: 16 },
  premiumStatItem: { flex: 1, gap: 2 },
  premiumStatBorder: { borderLeftWidth: 1, borderLeftColor: '#E2E8F0', paddingLeft: 16 },
  premiumStatLabel: { fontSize: 9, ...FONTS.bold, color: COLORS.textMuted, letterSpacing: 1 },
  premiumStatVal: { fontSize: 16, ...FONTS.extraBold, color: COLORS.primary },
  premiumUnit: { fontSize: 11, ...FONTS.medium, color: COLORS.textMuted },

  premiumOfferSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  premiumOfferHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  offerIconBox: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  premiumOfferLabel: { fontSize: 10, ...FONTS.extraBold, color: COLORS.accent, letterSpacing: 0.5 },
  
  offerPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  premiumOfferPrice: { fontSize: 24, ...FONTS.extraBold, color: COLORS.primary },
  premiumPerUnit: { fontSize: 12, ...FONTS.medium, color: COLORS.textMuted },

  premiumNotesBox: { backgroundColor: 'rgba(255,255,255,0.6)', padding: 10, borderRadius: RADIUS.md, marginBottom: 15 },
  premiumNotesText: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 18 },

  premiumActionRow: { flexDirection: 'row', gap: 10 },
  premiumAcceptBtn: {
    flex: 2, backgroundColor: COLORS.primary, height: 48, borderRadius: RADIUS.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...SHADOWS.md,
  },
  premiumAcceptBtnText: { color: COLORS.white, fontSize: 15, ...FONTS.bold },
  premiumRejectBtn: {
    flex: 1, backgroundColor: 'transparent', height: 48, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FED7AA',
  },
  premiumRejectBtnText: { color: '#C2410C', fontSize: 14, ...FONTS.bold },

  premiumAcceptedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4,
    padding: 12, backgroundColor: '#F0FDF4', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#DCFCE7',
  },
  premiumAcceptedText: { fontSize: 14, ...FONTS.bold, color: COLORS.success },
});
