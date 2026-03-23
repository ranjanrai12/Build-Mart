import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';

const OTP_DIGITS = 4;

export default function OtpScreen({ navigation, route }) {
  const { phone, role, form, isRegister } = route.params || {};
  const { loginByPhone } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const id = setTimeout(() => setTimer(t => t - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [timer]);

  const handleChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setError('');
    if (val && idx < OTP_DIGITS - 1) inputs.current[idx + 1]?.focus();
  };

  const handleBackspace = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otp.join('').length < OTP_DIGITS) { setError('Enter the 4-digit OTP'); return; }
    
    try {
      setLoading(true);
      const result = await loginByPhone(phone, { ...(isRegister ? form : {}), isRegister });
      if (result.success) {
        // AuthContext handles state & navigation listener will trigger
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify OTP</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconBox}>
          <MaterialIcons name="sms" size={40} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>Enter the OTP</Text>
        <Text style={styles.sub}>Sent to +91 {phone}</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={r => (inputs.current[idx] = r)}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={v => handleChange(v, idx)}
              onKeyPress={e => handleBackspace(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={idx === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.hint}>
          {role === 'buyer' ? '(Use any 4 digits for demo)' : '(Demo mode — any 4 digits)'}
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, otp.join('').length < OTP_DIGITS && styles.primaryBtnDisabled]}
          onPress={handleVerify}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Verify & Continue</Text>
          <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive OTP? </Text>
          {timer > 0
            ? <Text style={styles.timerText}>Resend in {timer}s</Text>
            : (
              <TouchableOpacity onPress={() => { setTimer(30); setOtp(['', '', '', '']); }}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 60, paddingBottom: 24, paddingHorizontal: SIZES.base,
  },
  back: { padding: 4 },
  headerTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.white, marginLeft: SIZES.sm },
  body: {
    flex: 1, backgroundColor: COLORS.white,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: SIZES.xl, alignItems: 'center',
  },
  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SIZES.xl,
  },
  title: { fontSize: 22, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 6 },
  sub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SIZES.xl },
  otpRow: { flexDirection: 'row', gap: SIZES.base, marginBottom: SIZES.sm },
  otpBox: {
    width: 58, height: 62, borderRadius: RADIUS.md,
    borderWidth: 2, borderColor: COLORS.border,
    textAlign: 'center', fontSize: 24, ...FONTS.bold, color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  otpBoxFilled: { borderColor: COLORS.accent, backgroundColor: 'rgba(255,107,53,0.06)' },
  error: { color: COLORS.error, fontSize: 13, marginBottom: SIZES.sm },
  hint: { fontSize: 12, color: COLORS.textMuted, marginBottom: SIZES.xl },
  primaryBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
    paddingVertical: 16, gap: 8, ...SHADOWS.md,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 16, ...FONTS.bold, color: COLORS.white },
  resendRow: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.xl },
  resendText: { fontSize: 13, color: COLORS.textSecondary },
  timerText: { fontSize: 13, ...FONTS.semiBold, color: COLORS.textMuted },
  resendLink: { fontSize: 13, ...FONTS.semiBold, color: COLORS.accent },
});
