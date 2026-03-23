import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, Animated, 
  TouchableOpacity, ActivityIndicator, Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

/**
 * PaymentSimulationModal - A high-fidelity simulated payment gateway.
 * Mimics the behavior and look of a real gateway (e.g., Razorpay/Stripe).
 */
export default function PaymentSimulationModal({ 
  visible, 
  onSuccess, 
  onCancel, 
  amount, 
  method 
}) {
  const [step, setStep] = useState('init'); // init, processing, success
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setStep('init');
      // Auto-advance from init to processing
      const timer = setTimeout(() => setStep('processing'), 1500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    if (step === 'processing') {
      // Simulate gateway approval time
      const timer = setTimeout(() => {
        setStep('success');
      }, 3000);

      // Pulse animation for security feel
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();

      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleFinish = () => {
    // Generate a simulated transaction ID
    const txId = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    onSuccess(txId);
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.securityBadge}>
              <MaterialIcons name="security" size={14} color={COLORS.success} />
              <Text style={styles.securityText}>BuildMart Secure Gateway</Text>
            </View>
            {step !== 'success' && (
              <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {step === 'init' && (
              <View style={styles.centerItem}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.title}>Connecting...</Text>
                <Text style={styles.subtitle}>Securing connection to {method} portal</Text>
              </View>
            )}

            {step === 'processing' && (
              <View style={styles.centerItem}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <MaterialIcons name="account-balance" size={60} color={COLORS.primary} />
                </Animated.View>
                <Text style={styles.title}>Authorizing Payment</Text>
                <Text style={styles.subtitle}>Please do not close the app or press back</Text>
                <View style={styles.amountBox}>
                  <Text style={styles.amountLabel}>Amount to Pay</Text>
                  <Text style={styles.amountValue}>₹{amount?.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            )}

            {step === 'success' && (
              <View style={styles.centerItem}>
                <View style={styles.successIcon}>
                  <MaterialIcons name="check" size={40} color={COLORS.white} />
                </View>
                <Text style={styles.title}>Payment Successful!</Text>
                <Text style={styles.subtitle}>Your transaction has been verified.</Text>
                
                <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
                  <LinearGradient
                    colors={[COLORS.success, '#15803d']}
                    style={styles.btnGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.btnText}>Return to Merchant</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Certified PCI DSS Compliant</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center'
  },
  container: {
    width: width * 0.9, backgroundColor: COLORS.white,
    borderRadius: 24, overflow: 'hidden', ...SHADOWS.lg
  },
  header: {
    padding: 16, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  securityText: { fontSize: 12, ...FONTS.bold, color: COLORS.success, textTransform: 'uppercase' },
  closeBtn: { padding: 4 },
  
  content: { padding: 30, minHeight: 300, justifyContent: 'center' },
  centerItem: { alignItems: 'center' },
  title: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary, marginTop: 20 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
  
  amountBox: { 
    marginTop: 30, padding: 16, backgroundColor: '#F8FAFC', 
    borderRadius: 16, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  amountLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  amountValue: { fontSize: 24, ...FONTS.extraBold, color: COLORS.textPrimary },

  successIcon: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.md
  },
  finishBtn: { marginTop: 30, width: '100%', height: 50, borderRadius: 12, overflow: 'hidden' },
  btnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },

  footer: { 
    padding: 12, backgroundColor: '#F8FAFC', 
    alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' 
  },
  footerText: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 }
});
