import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';

import { useAuth } from '../../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { checkPhone } = useAuth();

  const handlePhoneChange = (t) => {
    setPhone(t.replace(/[^0-9]/g, ''));
    if (error) setError('');
  };

  const handleGetOTP = async () => {
    if (phone.length < 10) {
      setError('10-digit mobile number is required');
      return;
    }
    
    setLoading(true);
    const { exists, error: apiError } = await checkPhone(phone);
    setLoading(false);

    if (apiError) {
      setError('Connection error. Please try again.');
      return;
    }

    if (!exists) {
      setError('Account not found. Please sign up first.');
      return;
    }

    navigation.navigate('Otp', { phone, role });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <MaterialIcons name="construction" size={36} color={COLORS.accent} />
        </View>
        <Text style={styles.logoText}>BuildMart</Text>
        <Text style={styles.tagline}>India's Construction Marketplace</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Welcome back 👋</Text>
          <Text style={styles.subheading}>Sign in to continue ordering materials</Text>

          {/* Role toggle */}
          <View style={styles.roleRow}>
            {['buyer', 'seller'].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
              >
                <MaterialIcons
                  name={r === 'buyer' ? 'shopping-bag' : 'store'}
                  size={16}
                  color={role === r ? COLORS.white : COLORS.textSecondary}
                />
                <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                  {r === 'buyer' ? 'Buyer' : 'Seller'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Phone input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={[styles.inputRow, error && styles.inputError]}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="Enter 10-digit number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleGetOTP}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Checking...' : 'Get OTP'}</Text>
            {!loading && <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.secondaryBtnText}>Create new account</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            By continuing you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 40,
  },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  logoText: { fontSize: 28, ...FONTS.extraBold, color: COLORS.white },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  form: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: SIZES.xl,
    flexGrow: 1,
  },
  heading: { fontSize: 24, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 4 },
  subheading: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SIZES.xl },
  roleRow: {
    flexDirection: 'row', gap: SIZES.sm,
    marginBottom: SIZES.xl,
  },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleBtnText: { fontSize: 14, ...FONTS.semiBold, color: COLORS.textSecondary },
  roleBtnTextActive: { color: COLORS.white },
  inputGroup: { marginBottom: SIZES.base },
  label: { fontSize: 13, ...FONTS.semiBold, color: COLORS.textSecondary, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, overflow: 'hidden' },
  inputError: { borderColor: COLORS.error, backgroundColor: '#FFF5F5' },
  errorText: { color: COLORS.error, fontSize: 11, ...FONTS.medium, marginTop: 4, marginLeft: 2 },
  countryCode: {
    paddingHorizontal: SIZES.sm, paddingVertical: 14,
    backgroundColor: COLORS.background,
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  countryCodeText: { fontSize: 14, ...FONTS.medium, color: COLORS.textPrimary },
  input: {
    flex: 1, paddingHorizontal: SIZES.base, paddingVertical: 14,
    fontSize: 15, color: COLORS.textPrimary,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
    paddingVertical: 16, gap: 8, marginTop: SIZES.lg,
    ...SHADOWS.md,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 16, ...FONTS.bold, color: COLORS.white },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: SIZES.base },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.divider },
  dividerText: { marginHorizontal: SIZES.sm, color: COLORS.textMuted, fontSize: 12 },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 14, alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 15, ...FONTS.semiBold, color: COLORS.primary },
  hint: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: SIZES.base, lineHeight: 16 },
});
