import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
  Platform, Modal, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useOrders } from '../../../context/OrderContext';
import { useAuth } from '../../../context/AuthContext';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import OrderStatusBadge from '../../../components/shared/OrderStatusBadge';
import useCurrency from '../../../hooks/useCurrency';
import useThemeStyles from '../../../hooks/useThemeStyles';
import { useReviews } from '../../../context/ReviewContext';
import Toast from 'react-native-toast-message';

export default function OrderHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const { orders } = useOrders();
  const { formatINR } = useCurrency();
  const themeStyles = useThemeStyles();
  const myOrders = orders.filter(o => o.buyerId === (user?.id || 'buyer1'));
  const { addSellerReview } = useReviews();

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');


  const openReviewModal = (sellerId, sellerName) => {
    setSelectedSeller({ id: sellerId, name: sellerName });
    setShowReviewModal(true);
  };

  const renderOrder = ({ item }) => {
    const rawDate = item.placedAt || item.createdAt;
    const d = new Date(rawDate);
    const date = (rawDate && !isNaN(d.getTime())) 
      ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
      : 'Recently';

    return (
      <TouchableOpacity 
        style={styles.orderCard} 
        onPress={() => navigation.navigate('OrderDetail', { 
          order: item,
          orderId: item.id 
        })} 
        activeOpacity={0.85}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.orderNumber || item.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <OrderStatusBadge status={item.status} />
            <Text style={styles.orderTotal}>{formatINR(item.total)}</Text>
          </View>
        </View>

        <Text style={styles.itemSummary} numberOfLines={1}>
          {item.items?.map(i => `${i.product?.name || 'Item'} ×${i.quantity}`).join(', ')}
        </Text>

        <View style={styles.expandRow}>
          <Text style={styles.expandText}>Manage Order</Text>
          <MaterialIcons name="chevron-right" size={18} color={COLORS.accent} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.header} />
      <View style={themeStyles.curvedHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <View>
            <Text style={styles.headerTitle}>My Orders</Text>
            <Text style={styles.headerSub}>Manage your purchases</Text>
          </View>
          <Text style={styles.headerCount}>{myOrders.length} orders</Text>
        </View>
      </View>
      <FlatList
        data={myOrders}
        keyExtractor={i => i.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="receipt-long" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubTitle}>Your orders will appear here</Text>
          </View>
        }
      />

      {/* Seller Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Rate Merchant</Text>
                <Text style={styles.modalSubTitle}>{selectedSeller?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.starSelector}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setUserRating(i)}>
                  <MaterialIcons 
                    name={i <= userRating ? "star" : "star-border"} 
                    size={40} 
                    color={i <= userRating ? '#F39C12' : COLORS.border} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="How was your experience with this merchant?"
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <TouchableOpacity 
              style={[styles.submitReviewBtn, !reviewComment && styles.disabledBtn]}
              disabled={!reviewComment}
              onPress={() => {
                addSellerReview(selectedSeller.id, userRating, reviewComment, user?.name);
                setShowReviewModal(false);
                setReviewComment('');
                Toast.show({ 
                  type: 'success', 
                  text1: 'Rating Submitted!', 
                  text2: 'Thank you for your feedback.' 
                });
              }}
            >
              <Text style={styles.submitReviewText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  /* Header */
  header: {
    backgroundColor: COLORS.header,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: SIZES.base,
    paddingBottom: SIZES.base + 4,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...SHADOWS.lg,
    zIndex: 10,
  },
  headerTitle: { fontSize: 22, ...FONTS.bold, color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  headerCount: { fontSize: 13, color: 'rgba(255,255,255,0.7)', ...FONTS.bold },
  list: { padding: SIZES.base, gap: SIZES.sm },
  orderCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.sm, padding: SIZES.base },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { fontSize: 13, ...FONTS.bold, color: COLORS.textPrimary },
  orderDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  orderTotal: { fontSize: 15, ...FONTS.bold, color: COLORS.primary },
  itemSummary: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  detail: { marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SIZES.sm },
  detailItem: { flexDirection: 'row', marginBottom: 4 },
  detailName: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  detailQty: { fontSize: 13, color: COLORS.textMuted, marginHorizontal: 8 },
  detailPrice: { fontSize: 13, ...FONTS.semiBold, color: COLORS.textPrimary },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  detailMeta: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  expandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  expandText: { fontSize: 12, ...FONTS.semiBold, color: COLORS.accent },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: SIZES.sm },
  emptyTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  emptySubTitle: { fontSize: 14, color: COLORS.textMuted },

  /* Review Button */
  reviewSellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SIZES.base,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
  },
  reviewSellerText: { fontSize: 13, ...FONTS.bold, color: COLORS.accent },

  /* Modal Styles (Synced with ProductDetail) */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: SIZES.lg, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 30 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.xl },
  modalTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  modalSubTitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  starSelector: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SIZES.xl },
  reviewInput: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: RADIUS.md, 
    padding: 16, 
    height: 120, 
    textAlignVertical: 'top', 
    fontSize: 14, 
    color: COLORS.textPrimary, 
    borderWidth: 1, 
    borderColor: '#EDF2F7', 
    marginBottom: SIZES.xl 
  },
  submitReviewBtn: { 
    backgroundColor: COLORS.accent, 
    borderRadius: RADIUS.lg, 
    paddingVertical: 14, 
    alignItems: 'center', 
    ...SHADOWS.md 
  },
  submitReviewText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },
  disabledBtn: { backgroundColor: '#CBD5E0' },
});
