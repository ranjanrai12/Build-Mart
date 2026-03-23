import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Platform, BackHandler,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import useCurrency from '../../../hooks/useCurrency';

export default function OrderSuccessScreen({ navigation, route }) {
  const { total = 0, order } = route.params || {};
  const { formatINR } = useCurrency();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    return () => backHandler.remove();
  }, []);

  const handleDone = () => {
    if (Array.isArray(order) && order.length > 1) {
      navigation.navigate('BuyerMain', { screen: 'Orders' });
      Toast.show({
        type: 'info',
        text1: 'Multi-Seller Order',
        text2: `Dispatched in ${order.length} separate shipments.`,
        visibilityTime: 4000
      });
    } else if (order) {
      const singleOrder = Array.isArray(order) ? order[0] : order;
      navigation.navigate('OrderDetail', { 
        order: singleOrder,
        orderId: singleOrder?.id 
      });
    } else {
      navigation.navigate('BuyerMain', { screen: 'Orders' });
    }
  };

  const getOrderNumber = () => {
    const mainOrder = Array.isArray(order) ? order[0] : order;
    return mainOrder?.orderNumber || mainOrder?.id?.slice(0, 8).toUpperCase() || 'BM-XYZ';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <View style={styles.content}>
        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient 
            colors={[COLORS.primary, '#0F172A']} 
            style={styles.gradientCircle}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="check" size={70} color={COLORS.white} />
          </LinearGradient>
        </Animated.View>
        
        <Animated.View style={{ opacity: opacityAnim, alignItems: 'center', width: '100%' }}>
          <Text style={styles.title}>Procurement Confirmed</Text>
          <Text style={styles.subtitle}>Your building materials are being prepared for dispatch.</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Order Recognition</Text>
              <Text style={styles.value}>#{getOrderNumber()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Transaction Value</Text>
              <Text style={styles.value}>{formatINR(total)}</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Processing at Logistics Hub</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleDone}>
          <LinearGradient 
            colors={[COLORS.primary, '#0F172A']} 
            style={styles.btnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.primaryBtnText}>Track Logistics</Text>
            <MaterialIcons name="local-shipping" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('BuyerMain', { screen: 'Home' })}>
          <Text style={styles.secondaryBtnText}>Back to Marketplace</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 24 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successCircle: { width: 140, height: 140, borderRadius: 70, ...SHADOWS.lg, marginBottom: 40 },
  gradientCircle: { flex: 1, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 40 },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '100%', ...SHADOWS.sm,    borderWidth: 1, borderColor: '#F1F5F9'
 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  label: { fontSize: 13, color: COLORS.textMuted, ...FONTS.medium },
  value: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', justifyContent: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  statusText: { fontSize: 13, color: COLORS.success, ...FONTS.bold },
  footer: { gap: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  primaryBtn: { height: 60, borderRadius: 16, overflow: 'hidden', ...SHADOWS.md },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryBtnText: { color: COLORS.white, fontSize: 17, ...FONTS.bold },
  secondaryBtn: { height: 60, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: COLORS.textMuted, fontSize: 15, ...FONTS.bold },
});
