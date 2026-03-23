import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, 
  ActivityIndicator, RefreshControl, Dimensions, StatusBar 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../../api/apiClient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../../constants/theme';

const { width } = Dimensions.get('window');

const AdvancedAnalyticsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await apiClient.get('/orders/seller/advanced-metrics');
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching advanced metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Synthesizing your business data...</Text>
      </View>
    );
  }

  const { categoryDistribution, customerInsights, efficiency } = metrics || {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Business Intelligence</Text>
          <Text style={styles.headerSubtitle}>Real-time Growth Analytics</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <MaterialIcons name="tune" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchMetrics} color={COLORS.primary} />}
      >
        {/* Main Efficiency Hub */}
        <LinearGradient
          colors={[COLORS.white, '#F8FAFC']}
          style={styles.heroSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Operational Hub</Text>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>Last 30 Days</Text>
            </View>
          </View>

          <View style={styles.efficiencyHub}>
            <View style={styles.effLargeItem}>
              <Text style={styles.effTarget}>85% Target</Text>
              <Text style={[styles.effValueLarge, { color: COLORS.primary }]}>{efficiency?.successRate || '0'}<Text style={styles.unit}>%</Text></Text>
              <Text style={styles.effLabelLarge}>Fulfillment Success</Text>
            </View>
            
            <View style={styles.effGridSmall}>
              <View style={styles.effSmallCard}>
                <Text style={styles.effSmallValue}>{efficiency?.avgProcessingHours || '0'}h</Text>
                <Text style={styles.effSmallLabel}>Processing</Text>
              </View>
              <View style={styles.effSmallCard}>
                <Text style={styles.effSmallValue}>{efficiency?.totalCompleted || '0'}</Text>
                <Text style={styles.effSmallLabel}>Shipped</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Dynamic Category Insights */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Revenue Distribution</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>By Volume</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoryStack}>
            {categoryDistribution?.map((cat, index) => {
              const maxRevenue = categoryDistribution[0]?.revenue || 1;
              const percentage = (cat.revenue / maxRevenue) * 100;
              const barColors = index === 0 ? [COLORS.primary, '#6366F1'] : ['#94A3B8', '#64748B'];
              
              return (
                <View key={cat.name} style={styles.categoryRow}>
                  <View style={styles.catDetails}>
                    <Text style={[styles.catName, index === 0 && styles.catNameActive]}>{cat.name}</Text>
                    <Text style={styles.catAmount}>₹{(cat.revenue / 1000).toFixed(1)}k</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <LinearGradient
                      colors={barColors}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.progressBar, { width: `${percentage}%` }]}
                    >
                      {percentage > 20 && <View style={styles.progressShine} />}
                    </LinearGradient>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* High-Value Customer Pulse */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Retention</Text>
            <View style={styles.retentionBadge}>
              <MaterialIcons name="loop" size={14} color="#059669" />
              <Text style={styles.retentionText}>{customerInsights?.repeatRate}% Repeat</Text>
            </View>
          </View>

          <View style={styles.customerMetrics}>
            <View style={styles.custMetricItem}>
              <Text style={styles.custMetricValue}>{customerInsights?.totalUnique}</Text>
              <Text style={styles.custMetricLabel}>Total Reach</Text>
            </View>
            <View style={styles.custMetricDivider} />
            <View style={styles.custMetricItem}>
              <Text style={styles.custMetricValue}>₹{((customerInsights?.topCustomers?.reduce((s,c)=>s+c.totalValue, 0) || 0) / 1000).toFixed(1)}k</Text>
              <Text style={styles.custMetricLabel}>Top Revenue</Text>
            </View>
          </View>

          <Text style={styles.listSubheader}>MVP Buyers (Top 3)</Text>
          {customerInsights?.topCustomers?.map((cust, idx) => (
            <TouchableOpacity key={idx} style={styles.customerRowAlt}>
              <LinearGradient 
                colors={[COLORS.primary, '#4F46E5']} 
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarChars}>{cust.name[0]}</Text>
              </LinearGradient>
              <View style={styles.custMeta}>
                <Text style={styles.custNameFull}>{cust.name}</Text>
                <Text style={styles.custOrderCount}>{cust.count} Purchases</Text>
              </View>
              <View style={styles.custValueBox}>
                <Text style={styles.custTotalValue}>₹{(cust.totalValue / 1000).toFixed(1)}k</Text>
                <Ionicons name="trending-up" size={16} color={COLORS.success} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI-Powered Strategic Insight */}
        <TouchableOpacity 
          style={styles.insightCardContainer} 
          activeOpacity={0.9}
          onPress={() => navigation.navigate('SellerInventory')}
        >
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.insightCard}
          >
            <View style={styles.insightIconCircle}>
              <MaterialIcons name="auto-awesome" size={20} color={COLORS.accent} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Smart Insight</Text>
              <Text style={styles.insightText}>
                Your {categoryDistribution?.[0]?.name} demand is peaking. 
                Maintain high inventory for next 14 days to maximize efficiency.
              </Text>
              <View style={styles.insightAction}>
                <Text style={styles.insightActionText}>Analyze Inventory</Text>
                <MaterialIcons name="arrow-forward" size={14} color={COLORS.white} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 16, color: COLORS.textMuted, fontSize: 14, ...FONTS.medium },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTextContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1, ...FONTS.medium },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  filterBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },

  content: { flex: 1 },
  heroSection: { 
    padding: 24, backgroundColor: COLORS.white, borderRadius: 28, 
    marginHorizontal: 20, marginTop: 20, ...SHADOWS.sm 
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.3 },
  periodBadge: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#EFF6FF', borderRadius: 10 },
  periodText: { fontSize: 11, ...FONTS.bold, color: COLORS.primary },

  efficiencyHub: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  effLargeItem: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  effTarget: { fontSize: 10, ...FONTS.bold, color: '#94A3B8', textTransform: 'uppercase' },
  effValueLarge: { fontSize: 34, ...FONTS.extraBold, marginTop: 4 },
  unit: { fontSize: 16, ...FONTS.bold },
  effLabelLarge: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, ...FONTS.medium },
  
  effGridSmall: { width: 110, gap: 12 },
  effSmallCard: { backgroundColor: COLORS.white, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', ...SHADOWS.sm },
  effSmallValue: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  effSmallLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, ...FONTS.medium },

  card: { backgroundColor: COLORS.white, borderRadius: 28, padding: 24, marginHorizontal: 20, marginTop: 20, ...SHADOWS.sm },
  viewAllText: { fontSize: 13, ...FONTS.bold, color: COLORS.primary },
  
  categoryStack: { gap: 20 },
  categoryRow: { gap: 10 },
  catDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: 14, ...FONTS.bold, color: '#64748B' },
  catNameActive: { color: COLORS.textPrimary },
  catAmount: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary },
  progressTrack: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 5, justifyContent: 'center' },
  progressShine: { position: 'absolute', top: 0, left: 0, right: 0, height: '40%', backgroundColor: 'rgba(255,255,255,0.2)', blur: 10 },

  retentionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  retentionText: { fontSize: 11, ...FONTS.bold, color: '#059669' },
  
  customerMetrics: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, marginBottom: 20 },
  custMetricItem: { flex: 1, alignItems: 'center' },
  custMetricValue: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary },
  custMetricLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  custMetricDivider: { width: 1, height: 20, backgroundColor: '#E2E8F0' },

  listSubheader: { fontSize: 13, ...FONTS.bold, color: COLORS.textMuted, marginBottom: 12 },
  customerRowAlt: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarGradient: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarChars: { color: COLORS.white, fontSize: 16, ...FONTS.bold },
  custMeta: { flex: 1, marginLeft: 14 },
  custNameFull: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },
  custOrderCount: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  custValueBox: { alignItems: 'flex-end' },
  custTotalValue: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },

  insightCardContainer: { marginHorizontal: 20, marginTop: 20 },
  insightCard: { borderRadius: 28, padding: 24, flexDirection: 'row', gap: 20, ...SHADOWS.md },
  insightIconCircle: { width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  insightContent: { flex: 1 },
  insightLabel: { fontSize: 10, ...FONTS.bold, color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 1 },
  insightTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.white, marginTop: 4 },
  insightText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20, marginTop: 6 },
  insightAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  insightActionText: { fontSize: 12, ...FONTS.bold, color: COLORS.white },
});

export default AdvancedAnalyticsScreen;
