import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import OrderStatusBadge from '../../../components/shared/OrderStatusBadge';
import OrderStepTracker from '../../../components/shared/OrderStepTracker';
import { LinearGradient } from 'expo-linear-gradient';
import MerchantRevenueChart from '../../../components/shared/MerchantRevenueChart';
import { useNotifications } from '../../../context/NotificationContext';

import { useSellerDashboard } from '../hooks/useSellerDashboard';

export default function DashboardScreen({ navigation }) {
  const { unreadCount } = useNotifications();
  const {
    user, isStoreOpen, toggleStoreStatus,
    dashboardStats, totalRevenue, monthlyTarget,
    targetProgress, activeOrder, performanceStats,
    sellerQuotes, pendingQuotes, newCustomers,
    returningCustomers, lowStockItems, recentOrders,
    revByCat, topSellers, revenueMetrics
  } = useSellerDashboard();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header with Background Gradient */}
        <LinearGradient colors={[COLORS.primary, '#1A2C3F']} style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.greetingHeader}>Store Dashboard</Text>
              <View style={styles.storeNameRow}>
                <Text style={styles.storeName} numberOfLines={1}>{user?.businessName || 'Sharma Supplies'}</Text>
                <TouchableOpacity 
                  style={[styles.statusIndicator, { backgroundColor: isStoreOpen ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)' }]}
                  onPress={toggleStoreStatus}
                >
                  <View style={[styles.statusDot, { backgroundColor: isStoreOpen ? COLORS.success : COLORS.error }]} />
                  <Text style={[styles.statusText, { color: isStoreOpen ? COLORS.success : COLORS.error }]}>
                    {isStoreOpen ? 'Open' : 'Closed'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('EditStore')}>
                <MaterialIcons name="settings" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.notifBtn, { marginLeft: 10 }]} onPress={() => navigation.navigate('Notifications')}>
                <MaterialIcons name="notifications-none" size={26} color={COLORS.white} />
                {unreadCount > 0 && (
                  <View style={[styles.notifBadge, { right: -2, top: -2 }]}>
                    <Text style={{ fontSize: 9, color: 'white', fontWeight: 'bold' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            {dashboardStats.map(s => (
              <TouchableOpacity 
                key={s.label} 
                style={styles.statCard} 
                onPress={() => navigation.navigate(s.screen, s.params)}
              >
                <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
                  <MaterialIcons name={s.icon} size={22} color={s.color} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.targetCard}>
            <View style={styles.targetInfo}>
              <Text style={styles.targetTitle}>Monthly Goal</Text>
              <Text style={styles.targetAmt}>₹{totalRevenue.toLocaleString()} / ₹{monthlyTarget.toLocaleString()}</Text>
              <Text style={styles.targetSub}>{Math.round(targetProgress)}% of target achieved</Text>
            </View>
            <View style={styles.progressRing}>
              <View style={[styles.progressFill, { width: `${targetProgress}%` }]} />
            </View>
          </View>
        </View>

        {activeOrder && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Order Status</Text>
            </View>
            <View style={styles.trackerCard}>
              <View style={styles.trackerTop}>
                <Text style={styles.activeOrderId}>Order #{activeOrder.id.toUpperCase()}</Text>
                <OrderStatusBadge status={activeOrder.status} />
              </View>
              <OrderStepTracker currentStatus={activeOrder.status} />
              <TouchableOpacity style={styles.manageBtn} onPress={() => navigation.navigate('SellerOrders')}>
                <Text style={styles.manageBtnText}>Update Tracking Status</Text>
                <MaterialIcons name="edit" size={14} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Merchant Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merchant Scorecard</Text>
          <View style={styles.scorecardRow}>
            {performanceStats.map(s => (
              <View key={s.label} style={styles.scoreItem}>
                <View style={styles.scoreIconBox}><MaterialIcons name={s.icon} size={18} color={COLORS.primary} /></View>
                <Text style={styles.scoreVal}>{s.value}</Text>
                <Text style={styles.scoreLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.quoteScorecard}>
            <View style={styles.quoteStat}>
              <Text style={styles.quoteStatVal}>{sellerQuotes.length}</Text>
              <Text style={styles.quoteStatLabel}>Total Quotes</Text>
            </View>
            <View style={styles.quoteDivider} />
            <View style={styles.quoteStat}>
              <Text style={[styles.quoteStatVal, { color: COLORS.accent }]}>{pendingQuotes.length}</Text>
              <Text style={styles.quoteStatLabel}>New Inquiries</Text>
            </View>
          </View>
          
          <View style={styles.retentionRow}>
            <View style={styles.retentionItem}>
              <Text style={styles.retentionVal}>{newCustomers}</Text>
              <Text style={styles.retentionLabel}>New Buyers</Text>
            </View>
            <View style={styles.retentionDivider} />
            <View style={styles.retentionItem}>
              <Text style={styles.retentionVal}>{returningCustomers}</Text>
              <Text style={styles.retentionLabel}>Returning</Text>
            </View>
          </View>
        </View>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.alertCard}>
              <MaterialIcons name="report-problem" size={20} color={COLORS.error} />
              <Text style={styles.alertText}>{lowStockItems.length} items are running low on stock!</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products', { initialFilter: 'lowStock' })}>
                <Text style={styles.alertAction}>Refill</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* B2B Inquiries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>B2B Procurement Inquiries</Text>
            {pendingQuotes.length > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{pendingQuotes.length} New</Text></View>
            )}
          </View>
          
          {pendingQuotes.length > 0 ? (
            pendingQuotes.map(quote => (
              <View key={quote.id} style={styles.premiumQuoteCard}>
                <View style={styles.quoteTop}>
                  <View style={styles.materialInfo}>
                    <View style={styles.productIconBox}>
                      <MaterialIcons name="inventory" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.premiumQuoteProduct} numberOfLines={1}>{quote.productName || quote.product?.name}</Text>
                  </View>
                  <View style={styles.premiumQuoteQtyBadge}>
                    <Text style={styles.premiumQuoteQtyText}>{quote.quantity} {quote.unit || 'Units'}</Text>
                  </View>
                </View>

                <View style={styles.quoteBottom}>
                  <View style={styles.buyerMeta}>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="person" size={14} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>{quote.buyerName || 'Verified Buyer'}</Text>
                    </View>
                    <View style={[styles.metaItem, { marginTop: 4 }]}>
                      <MaterialIcons name="location-on" size={14} color={COLORS.textMuted} />
                      <Text style={styles.metaText} numberOfLines={1}>{quote.siteLocation || 'Logistics Site'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.premiumReviewBtn} 
                    onPress={() => navigation.navigate('QuoteReview', { quoteId: quote.id })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.premiumReviewBtnText}>Review</Text>
                    <MaterialIcons name="arrow-forward" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyQuotes}>
              <MaterialIcons name="mark-email-read" size={32} color={COLORS.divider} />
              <Text style={styles.emptyQuotesText}>No pending inquiries</Text>
            </View>
          )}
        </View>

        {/* Category Performance */}
        {revByCat.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Revenue</Text>
            <View style={styles.analyticsCard}>
              {revByCat.map(cat => (
                <View key={cat.id} style={styles.catRevRow}>
                  <View style={styles.catInfoRow}>
                    <Text style={styles.catRevName}>{cat.name}</Text>
                    <Text style={styles.catRevAmt}>₹{cat.rev.toLocaleString()}</Text>
                  </View>
                  <View style={styles.catProgressBg}>
                    <View style={[styles.catProgressFill, { width: `${cat.percent}%`, backgroundColor: COLORS.accent }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sales Insights - Dynamic Pulse Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Performance</Text>
            <View style={styles.weeklyTotalBadge}>
              <Text style={styles.weeklyTotalLabel}>TOTAL</Text>
              <Text style={styles.weeklyTotalVal}>₹{revenueMetrics.currentTotal?.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.advancedAnalyticsBtn}
            onPress={() => navigation.navigate('AdvancedAnalytics')}
          >
            <LinearGradient
              colors={['#F0F9FF', '#E0F2FE']}
              style={styles.advancedAnalyticGradient}
            >
              <View style={styles.advLeft}>
                <View style={styles.advIconBox}>
                  <MaterialIcons name="insights" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.advText}>View Deep Business Analytics</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.primary} />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.pulseFeed}>
            {revenueMetrics.chartData.map((item, index) => {
              const isHigh = item.rawPrice > 0;
              const isPeak = item.rawPrice === Math.max(...revenueMetrics.chartData.map(d => d.rawPrice)) && isHigh;
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.pulseRow, 
                    isHigh ? styles.pulseRowHigh : styles.pulseRowEmpty
                  ]}
                >
                  <View style={styles.pulseDayCol}>
                    <Text style={[styles.pulseDayText, isHigh && styles.pulseDayTextActive]}>{item.day}</Text>
                    {isPeak && <View style={styles.peakDot} />}
                  </View>
                  
                  <View style={styles.pulseDataCol}>
                    {isHigh ? (
                      <View style={styles.pulseHighContent}>
                        <View>
                          <Text style={styles.pulseAmount}>₹{item.rawPrice?.toLocaleString()}</Text>
                          <Text style={styles.pulseInsights}>
                            {item.change}% vs last {item.day}
                          </Text>
                        </View>
                        <View style={[styles.pulseIndicator, { backgroundColor: item.trend === 'up' ? COLORS.success : COLORS.error }]}>
                          <MaterialIcons 
                            name={item.trend === 'up' ? "arrow-upward" : "arrow-downward"} 
                            size={12} 
                            color={COLORS.white} 
                          />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.pulseEmptyContent}>
                        <View style={styles.emptyLine} />
                        <Text style={styles.emptyText}>No sales recorded</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Selling Products - Bento List Format */}
        {topSellers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Selling Products</Text>
            <View style={styles.productBentoContainer}>
              {topSellers.map((p, index) => {
                const trendInfo = (revenueMetrics.topSellers || []).find(rt => rt.name === p.name);
                return (
                  <View key={p.name} style={styles.productBentoCard}>
                    <View style={[styles.bentoRankBadge, { backgroundColor: index === 0 ? COLORS.accent : '#F1F5F9' }]}>
                      <Text style={[styles.bentoRankText, { color: index === 0 ? COLORS.white : COLORS.primary }]}>
                        #{index + 1}
                      </Text>
                    </View>
                    <View style={styles.productBentoInfo}>
                      <Text style={styles.productBentoName} numberOfLines={1}>{p.name}</Text>
                      <View style={styles.productBentoStats}>
                        <Text style={styles.productBentoQty}>{p.qty} Units Sold</Text>
                        {trendInfo && (
                          <View style={styles.productBentoTrend}>
                            <MaterialIcons 
                              name={trendInfo.trend === 'up' ? "trending-up" : "trending-down"} 
                              size={12} 
                              color={trendInfo.trend === 'up' ? COLORS.success : COLORS.error} 
                            />
                            <Text style={[styles.productBentoTrendText, { color: trendInfo.trend === 'up' ? COLORS.success : COLORS.error }]}>
                              {trendInfo.trend === 'up' ? '+' : ''}{trendInfo.growth}%
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SellerOrders')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </View>
          {recentOrders.map(o => (
            <View key={o.id} style={styles.orderRow}>
              <View style={styles.orderIcon}><MaterialIcons name="receipt" size={18} color={COLORS.accent} /></View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>#{o.id.toUpperCase()}</Text>
                <Text style={styles.orderItems} numberOfLines={1}>{o.items.map(i => i.name).join(', ')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.orderTotal}>₹{o.total.toLocaleString()}</Text>
                <OrderStatusBadge status={o.status} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 65, paddingBottom: 60, paddingHorizontal: 20,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flex: 1, marginRight: 12 },
  greetingHeader: { fontSize: 13, color: 'rgba(255,255,255,0.6)', ...FONTS.medium, textTransform: 'uppercase', letterSpacing: 1 },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  storeName: { fontSize: 24, ...FONTS.bold, color: COLORS.white, flexShrink: 1 },
  statusIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(39,174,96,0.15)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  statusText: { fontSize: 11, ...FONTS.bold, color: COLORS.success },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.accent, borderWidth: 2, borderColor: COLORS.primary,
  },
  statsContainer: { marginTop: -40, paddingHorizontal: SIZES.base },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: SIZES.md,
    ...SHADOWS.md, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  statIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statInfo: { flex: 1 },
  statValue: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  section: { paddingHorizontal: SIZES.base, marginTop: SIZES.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  sectionTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  trackerCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SIZES.lg, ...SHADOWS.md, borderLeftWidth: 5, borderLeftColor: COLORS.accent,
  },
  trackerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SIZES.md, paddingBottom: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  activeOrderId: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  manageBtn: {
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: SIZES.md, paddingVertical: 14, borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  manageBtnText: { fontSize: 14, ...FONTS.bold, color: COLORS.white },
  alertCard: {
    backgroundColor: '#FEF2F2', padding: 12, borderRadius: RADIUS.md,
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#FEE2E2',
  },
  alertText: { flex: 1, fontSize: 13, color: COLORS.error, ...FONTS.medium },
  alertAction: { fontSize: 13, ...FONTS.bold, color: COLORS.error, textDecorationLine: 'underline' },
  scorecardRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SIZES.base, marginTop: SIZES.md, ...SHADOWS.sm,
  },
  scoreItem: { flex: 1, alignItems: 'center', gap: 4 },
  scoreIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  scoreVal: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  scoreLabel: { fontSize: 10, color: COLORS.textMuted, ...FONTS.medium },
  quoteScorecard: {
    flexDirection: 'row', backgroundColor: '#FFF7ED', borderRadius: RADIUS.lg,
    padding: 16, marginTop: SIZES.md, alignItems: 'center', borderWidth: 1, borderColor: '#FFEDD5',
  },
  quoteStat: { flex: 1, alignItems: 'center' },
  quoteStatVal: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary },
  quoteStatLabel: { fontSize: 11, ...FONTS.semiBold, color: '#9A3412', marginTop: 2, textTransform: 'uppercase' },
  quoteDivider: { width: 1, height: 24, backgroundColor: '#FED7AA' },
  retentionRow: {
    flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: RADIUS.lg,
    padding: 16, marginTop: SIZES.sm, alignItems: 'center', borderWidth: 1, borderColor: '#EDF2F7',
  },
  retentionItem: { flex: 1, alignItems: 'center' },
  retentionVal: { fontSize: 18, ...FONTS.bold, color: COLORS.primary },
  retentionLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  retentionDivider: { width: 1, height: 30, backgroundColor: '#CBD5E0' },
  premiumQuoteCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  quoteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  materialInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  productIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center' },
  premiumQuoteProduct: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary, flex: 1 },
  premiumQuoteQtyBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  premiumQuoteQtyText: { fontSize: 12, ...FONTS.bold, color: COLORS.primary },
  
  quoteBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  buyerMeta: { flex: 1, marginRight: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  
  premiumReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0F9FF', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#BAE6FD',
  },
  premiumReviewBtnText: { fontSize: 14, ...FONTS.bold, color: COLORS.primary },

  badge: { backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: COLORS.white, fontSize: 10, ...FONTS.bold },
  emptyQuotes: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 30,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.divider,
  },
  emptyQuotesText: { fontSize: 13, color: COLORS.textMuted, marginTop: 8, ...FONTS.medium },
  targetCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SIZES.lg,
    ...SHADOWS.md, borderLeftWidth: 5, borderLeftColor: COLORS.success,
  },
  targetTitle: { fontSize: 14, ...FONTS.bold, color: COLORS.textMuted, textTransform: 'uppercase' },
  targetAmt: { fontSize: 20, ...FONTS.extraBold, color: COLORS.textPrimary, marginVertical: 4 },
  targetSub: { fontSize: 13, color: COLORS.textSecondary },
  progressRing: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 4 },
  orderRow: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.sm,
    padding: SIZES.md, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SIZES.sm,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  orderIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 2 },
  orderItems: { fontSize: 12, color: COLORS.textMuted },
  orderTotal: { fontSize: 15, ...FONTS.bold, color: COLORS.primary, marginBottom: 2 },
  seeAll: { fontSize: 14, ...FONTS.semiBold, color: COLORS.accent },
  analyticsCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SIZES.lg, marginTop: SIZES.md, ...SHADOWS.sm,
  },
  catRevRow: { marginBottom: 16 },
  catInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catRevName: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  catRevAmt: { fontSize: 14, ...FONTS.bold, color: COLORS.primary },
  catProgressBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  catProgressFill: { height: '100%', borderRadius: 3 },
  weeklyTotalBadge: { alignItems: 'flex-end', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7' },
  weeklyTotalLabel: { fontSize: 9, ...FONTS.bold, color: COLORS.success, letterSpacing: 1 },
  weeklyTotalVal: { fontSize: 16, ...FONTS.extraBold, color: COLORS.primary },

  advancedAnalyticsBtn: { 
    marginTop: 10, marginBottom: 20, 
    borderRadius: RADIUS.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: '#BAE6FD'
  },
  advancedAnalyticGradient: { 
    padding: 16, flexDirection: 'row', 
    alignItems: 'center', justifyContent: 'space-between' 
  },
  advLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  advIconBox: { 
    width: 36, height: 36, borderRadius: 10, 
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' 
  },
  advText: { fontSize: 14, ...FONTS.bold, color: COLORS.primary },
  
  pulseFeed: { marginTop: 15, gap: 10 },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  pulseRowHigh: { 
    backgroundColor: COLORS.white, padding: 16, borderRadius: RADIUS.xl, 
    ...SHADOWS.md, borderWidth: 1, borderColor: '#BAE6FD' 
  },
  pulseRowEmpty: { opacity: 0.6, paddingHorizontal: 10 },
  pulseDayCol: { width: 30, alignItems: 'center' },
  pulseDayText: { fontSize: 13, ...FONTS.bold, color: COLORS.textMuted },
  pulseDayTextActive: { color: COLORS.primary, fontSize: 15 },
  peakDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginTop: 4 },
  
  pulseDataCol: { flex: 1 },
  pulseHighContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pulseAmount: { fontSize: 20, ...FONTS.extraBold, color: COLORS.textPrimary },
  pulseInsights: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  pulseIndicator: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  
  pulseEmptyContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emptyLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0', borderStyle: 'dashed' },
  emptyText: { fontSize: 11, color: COLORS.divider, fontStyle: 'italic' },
  
  productBentoContainer: { gap: 10, marginTop: 15 },
  productBentoCard: { 
    flexDirection: 'row', alignItems: 'center', gap: 12, 
    backgroundColor: COLORS.white, padding: 12, borderRadius: RADIUS.xl, 
    borderWidth: 1, borderColor: '#F1F5F9', ...SHADOWS.sm 
  },
  bentoRankBadge: { 
    width: 36, height: 36, borderRadius: 18, 
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' 
  },
  bentoRankText: { fontSize: 14, ...FONTS.extraBold },
  productBentoInfo: { flex: 1, gap: 4 },
  productBentoName: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },
  productBentoStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productBentoQty: { fontSize: 12, color: COLORS.textMuted, ...FONTS.semiBold },
  productBentoTrend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  productBentoTrendText: { fontSize: 11, ...FONTS.bold },
});
