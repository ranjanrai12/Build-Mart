import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, 
  Alert, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import { useQuotes } from '../../../context/QuoteContext';
import useCurrency from '../../../hooks/useCurrency';
import Toast from 'react-native-toast-message';
import ConfirmModal from '../../../components/shared/ConfirmModal';

export default function QuoteReviewScreen({ navigation, route }) {
  const { quoteId } = route.params;
  const { quotes, updateQuoteStatus, respondToQuote, acceptQuoteBySeller } = useQuotes();
  const { formatINR } = useCurrency();
  
  const quote = quotes.find(q => q.id === quoteId);
  const [showCounter, setShowCounter] = useState(false);
  const [counterPrice, setCounterPrice] = useState(quote ? String(quote.targetPrice || '') : '');
  const [sellerNotes, setSellerNotes] = useState('');
  const [priceError, setPriceError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showApprove, setShowApprove] = useState(false);

  if (!quote) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Inquiry not found</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleApprove = () => setShowApprove(true);

  const confirmApprove = async () => {
    try {
      setIsProcessing(true);
      setShowApprove(false);
      await acceptQuoteBySeller(quote.id);
      Toast.show({ type: 'success', text1: 'Quote Accepted!', text2: 'Converting to order...' });
      navigation.navigate('SellerOrders');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Approval Failed', text2: 'Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCounter = async () => {
    const price = parseFloat(counterPrice);
    setPriceError('');

    if (!price || price <= 0) {
      setPriceError('Please enter a valid amount.');
      return;
    }

    const originalPrice = quote.product?.price || 0;
    if (originalPrice > 0 && price > originalPrice) {
      setPriceError(`Price cannot exceed ₹${originalPrice} (Current Product Price).`);
      return;
    }
    
    try {
      setIsProcessing(true);
      await respondToQuote(quote.id, { offeredPrice: price, sellerNotes, validDays: 7 });
      Toast.show({ type: 'info', text1: 'Counter Offer Sent', text2: `Proposed: ₹${price}` });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Submission Failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    setShowReject(true);
  };

  const confirmReject = async () => {
    try {
      setIsProcessing(true);
      setShowReject(false);
      await updateQuoteStatus(quote.id, 'Declined');
      Toast.show({ type: 'error', text1: 'Inquiry Declined', text2: 'The buyer has been notified.' });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Decline Failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const quoteDate = quote.createdAt || quote.requestedAt;
  const d = new Date(quoteDate);
  const formattedDate = (quoteDate && !isNaN(d.getTime())) 
    ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
    : 'Recently';

  return (
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Review Inquiry</Text>
          <Text style={styles.headerSub}>ID: INQ-{quote.id.substring(0, 8).toUpperCase()}</Text>
        </View>
        <View style={styles.statusBadgeGlobal}>
          <View style={[styles.statusDot, quote.status === 'Declined' && { backgroundColor: COLORS.error }]} />
          <Text style={styles.statusTextGlobal}>{quote.status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Material Summary Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardSection}>
            <View style={styles.sectionIconBox}>
              <MaterialIcons name="inventory" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionLabel}>Procurement Material</Text>
              <Text style={styles.productTitle}>{quote.productName || quote.product?.name}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel} numberOfLines={1}>QUANTITY</Text>
              <Text style={styles.statVal} numberOfLines={1}>{quote.quantity} <Text style={styles.unitText}>{quote.unit || 'Units'}</Text></Text>
            </View>
            <View style={[styles.statBox, styles.statBorder]}>
              <Text style={styles.statLabel} numberOfLines={1}>TARGET PRICE</Text>
              <Text style={[styles.statVal, { color: COLORS.accent }]} numberOfLines={1}>
                {formatINR(quote.targetPrice || quote.product?.price || 0)}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <MaterialIcons name="history" size={14} color={COLORS.textMuted} />
            <Text style={styles.dateRowText}>Inquiry received on {formattedDate}</Text>
          </View>

          {/* Wholesale Reference for Seller */}
          {quote.product?.pricingTiers && quote.product.pricingTiers.length > 0 && (
            <View style={styles.tierRefBox}>
              <Text style={styles.tierRefTitle}>Wholesale Reference</Text>
              <View style={styles.tierRefGrid}>
                {quote.product.pricingTiers.map((tier, idx) => (
                  <View key={idx} style={styles.tierRefRow}>
                    <Text style={styles.tierRefQty}>{tier.minQty}+ {quote.unit || 'Units'}:</Text>
                    <Text style={styles.tierRefPrice}>{formatINR(tier.price)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Logistic & Buyer Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <MaterialIcons name="person" size={18} color={COLORS.textMuted} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>BUYER REPRESENTATIVE</Text>
              <Text style={styles.infoValue}>{quote.buyerName || quote.buyer?.name || 'Verified Procurement Partner'}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <MaterialIcons name="location-on" size={18} color={COLORS.textMuted} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>SITE LOCATION</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{quote.siteLocation || quote.buyer?.location || 'Logistics center'}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <MaterialIcons name="schedule" size={18} color={COLORS.textMuted} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>EXPECTED DELIVERY</Text>
              <Text style={styles.infoValue}>{quote.requiredBy || 'Immediate requirement'}</Text>
            </View>
          </View>
        </View>

        {quote.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Buyer's Special Instructions</Text>
            <Text style={styles.notesText}>"{quote.notes}"</Text>
          </View>
        ) : null}

        {/* Action Logic */}
        {!showCounter ? (
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} activeOpacity={0.8}>
              <MaterialIcons name="verified" size={24} color={COLORS.white} />
              <Text style={styles.approveBtnText}>Accept Target Price</Text>
            </TouchableOpacity>
            
            <View style={styles.secondaryRow}>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setShowCounter(true)}>
                <MaterialIcons name="edit" size={20} color={COLORS.primary} />
                <Text style={styles.counterBtnText}>Send Counter Offer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
                <MaterialIcons name="close" size={20} color={COLORS.error} />
                <Text style={styles.rejectBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.counterPanel}>
            <View style={styles.counterHeader}>
              <Text style={styles.counterTitle}>Propose New Quote</Text>
              <Text style={styles.counterSub}>Enter your best possible price per {quote.unit || 'unit'}</Text>
            </View>
            
            <View style={[
              styles.priceInputRow, 
              isFocused && styles.inputFocused,
              priceError ? styles.inputErrorBorder : null
            ]}>
              <Text style={[styles.pricePrefix, isFocused && { color: COLORS.primary }]}>₹</Text>
              <TextInput
                style={styles.priceInputField}
                value={counterPrice}
                onChangeText={(t) => {
                  const numeric = t.replace(/[^0-9.]/g, '');
                  setCounterPrice(numeric);
                  if (priceError) setPriceError('');
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={COLORS.divider}
                selectionColor={COLORS.primary}
                underlineColorAndroid="transparent"
                autoFocus
              />
            </View>
            
            {priceError ? (
              <View style={styles.inlineErrorBox}>
                <MaterialIcons name="error" size={14} color={COLORS.error} />
                <Text style={styles.inlineErrorText}>{priceError}</Text>
              </View>
            ) : null}

            <Text style={styles.notesLabel}>Add Seller Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={sellerNotes}
              onChangeText={setSellerNotes}
              placeholder="e.g. Price valid for bulk order, stock availability notes..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.counterFooter}>
              <TouchableOpacity style={styles.backLink} onPress={() => setShowCounter(false)}>
                <Text style={styles.backLinkText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitCounterBtn, !counterPrice && { opacity: 0.6 }]} 
                onPress={handleCounter}
                disabled={!counterPrice}
              >
                <Text style={styles.submitCounterText}>Submit Offer</Text>
                <MaterialIcons name="send" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingText}>Syncing with procurement network...</Text>
        </View>
      )}

      <ConfirmModal
        visible={showReject}
        title="Decline Inquiry?"
        message="Are you sure you want to decline this procuremnt request? This action cannot be undone."
        onConfirm={confirmReject}
        onCancel={() => setShowReject(false)}
        confirmText="Decline"
        isDestructive
      />

      <ConfirmModal
        visible={showApprove}
        title="Approve Request"
        message={`Are you sure you want to approve this quote at ₹${quote.targetPrice || quote.product?.price}/${quote.unit || 'unit'}?`}
        onConfirm={confirmApprove}
        onCancel={() => setShowApprove(false)}
        confirmText="Approve"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 25,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.md,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 19 },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.white },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', ...FONTS.medium },
  statusBadgeGlobal: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    marginLeft: 8
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  statusTextGlobal: { fontSize: 10, ...FONTS.bold, color: COLORS.white },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60, width: '100%', flexGrow: 1 },
  
  mainCard: { 
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, marginBottom: 16,
    ...SHADOWS.md, borderWidth: 1, borderColor: '#EDF2F7',
    width: '100%', alignSelf: 'stretch'
  },
  cardSection: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  sectionIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center' },
  sectionInfo: { flex: 1 },
  sectionLabel: { fontSize: 11, ...FONTS.bold, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  productTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary, marginTop: 2 },

  statsGrid: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: RADIUS.lg, padding: 12 },
  statBox: { flex: 1, paddingVertical: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: '#E2E8F0', paddingLeft: 12, marginLeft: 12 },
  statLabel: { fontSize: 9, ...FONTS.bold, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  statVal: { fontSize: 18, ...FONTS.extraBold, color: COLORS.primary },
  unitText: { fontSize: 11, ...FONTS.medium, color: COLORS.textSecondary },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, alignSelf: 'flex-end' },
  dateRowText: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },

  infoCard: { 
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, marginBottom: 16,
    ...SHADOWS.sm, borderWidth: 1, borderColor: '#EDF2F7',
    width: '100%', alignSelf: 'stretch'
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 9, ...FONTS.bold, color: COLORS.textMuted, letterSpacing: 0.5 },
  infoValue: { fontSize: 14, ...FONTS.semiBold, color: COLORS.textPrimary, marginTop: 1 },
  infoDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12, marginLeft: 44 },

  notesBox: { 
    backgroundColor: '#FFFBEB', borderRadius: RADIUS.lg, padding: 16, marginBottom: 24,
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#FEF3C7',
    width: '100%', alignSelf: 'stretch'
  },
  notesTitle: { fontSize: 12, ...FONTS.bold, color: '#92400E', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#B45309', lineHeight: 20 },

  footerActions: { marginTop: 8, gap: 12 },
  approveBtn: {
    backgroundColor: COLORS.success,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 60, borderRadius: RADIUS.lg, gap: 12,
    ...SHADOWS.md,
  },
  approveBtnText: { color: COLORS.white, fontSize: 18, ...FONTS.extraBold },
  
  secondaryRow: { flexDirection: 'row', gap: 12 },
  counterBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD',
    height: 54, borderRadius: RADIUS.lg, gap: 8,
  },
  counterBtnText: { color: COLORS.primary, fontSize: 15, ...FONTS.bold },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2',
    height: 54, borderRadius: RADIUS.lg, gap: 8,
  },
  rejectBtnText: { color: COLORS.error, fontSize: 15, ...FONTS.bold },

  counterPanel: { 
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16,
    ...SHADOWS.lg, borderWidth: 2, borderColor: COLORS.primary,
    marginBottom: 20, width: '100%', alignSelf: 'stretch'
  },
  counterHeader: { alignItems: 'center', marginBottom: 25 },
  counterTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary },
  counterSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  
  priceInputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, paddingHorizontal: 20, height: 75, marginBottom: 15,
    borderWidth: 1.8, borderColor: '#EDF2F7', ...SHADOWS.sm,
    overflow: 'hidden'
  },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: '#FAFBFD', ...SHADOWS.md },
  pricePrefix: { fontSize: 24, ...FONTS.bold, color: COLORS.textMuted, marginRight: 10 },
  priceInputField: { flex: 1, flexShrink: 1, fontSize: 32, ...FONTS.extraBold, color: COLORS.primary, height: '100%', paddingVertical: 0 },

  counterFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backLink: { paddingVertical: 10, paddingHorizontal: 5 },
  backLinkText: { fontSize: 16, ...FONTS.semiBold, color: COLORS.textMuted },
  submitCounterBtn: { 
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', 
    gap: 10, paddingHorizontal: 25, paddingVertical: 14, borderRadius: RADIUS.md, ...SHADOWS.md 
  },
  submitCounterText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },

  inputErrorBorder: { borderColor: COLORS.error, borderWidth: 1.5 },
  inlineErrorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -15, marginBottom: 20, marginLeft: 5 },
  inlineErrorText: { fontSize: 12, ...FONTS.bold, color: COLORS.error },
  
  notesLabel: { fontSize: 13, ...FONTS.bold, color: COLORS.textSecondary, marginBottom: 10 },
  notesInput: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#EDF2F7',
    ...SHADOWS.sm,
  },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary, marginTop: 15 },
  errorBtn: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: RADIUS.md },
  errorBtnText: { color: COLORS.white, ...FONTS.bold },

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

  /* Tier Reference Styles */
  tierRefBox: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  tierRefTitle: { fontSize: 10, ...FONTS.bold, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  tierRefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tierRefRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tierRefQty: { fontSize: 12, color: COLORS.textSecondary, ...FONTS.medium },
  tierRefPrice: { fontSize: 12, ...FONTS.bold, color: COLORS.primary },
});
