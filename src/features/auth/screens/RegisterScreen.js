import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';

export default function RegisterScreen({ navigation, route }) {
  const [role, setRole] = useState('buyer');
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    businessName: '', gst: '',
  });
  const [errors, setErrors] = useState({});

  const update = (key, val) => {
    let sanitizedVal = val;
    if (key === 'phone') sanitizedVal = val.replace(/[^0-9]/g, '');
    setForm(f => ({ ...f, [key]: sanitizedVal }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleNext = () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.phone.trim() || form.phone.length < 10) newErrors.phone = 'Valid 10-digit number required';
    
    if (role === 'seller') {
      if (!form.businessName.trim()) newErrors.businessName = 'Business name is required';
      if (!form.gst.trim()) newErrors.gst = 'GST number is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    navigation.navigate('Otp', { phone: form.phone, role, form, isRegister: true });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {/* Role toggle */}
          <View style={styles.roleRow}>
            {['buyer', 'seller'].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => { setRole(r); setErrors({}); }}
              >
                <MaterialIcons name={r === 'buyer' ? 'shopping-bag' : 'store'} size={16} color={role === r ? COLORS.white : COLORS.textSecondary} />
                <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>{r === 'buyer' ? 'I\'m a Buyer' : 'I\'m a Seller'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField label="Full Name *" icon="person" value={form.name} onChangeText={v => update('name', v)} placeholder="Enter your full name" error={errors.name} />
          <InputField label="Mobile Number *" icon="phone" value={form.phone} onChangeText={v => update('phone', v)} placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10} error={errors.phone} />
          <InputField label="Email (Optional)" icon="email" value={form.email} onChangeText={v => update('email', v)} placeholder="your@email.com" keyboardType="email-address" />

          {role === 'seller' && (
            <>
              <View style={styles.sectionDivider}>
                <View style={styles.divLine} />
                <Text style={styles.sectionLabel}>Business Details</Text>
                <View style={styles.divLine} />
              </View>
              <InputField label="Business Name *" icon="store" value={form.businessName} onChangeText={v => update('businessName', v)} placeholder="Your business name" error={errors.businessName} />
              <InputField label="GST Number *" icon="receipt" value={form.gst} onChangeText={v => update('gst', v)} placeholder="22AAAAA0000A1Z5" autoCapitalize="characters" error={errors.gst} />
            </>
          )}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleNext}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InputField({ label, icon, error, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputError]}>
        <MaterialIcons name={icon} size={18} color={error ? COLORS.error : COLORS.textMuted} style={{ marginRight: SIZES.sm }} />
        <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted} {...props} />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
  form: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: SIZES.xl, flexGrow: 1,
  },
  roleRow: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.xl },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
    borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleBtnText: { fontSize: 13, ...FONTS.semiBold, color: COLORS.textSecondary },
  roleBtnTextActive: { color: COLORS.white },
  inputGroup: { marginBottom: SIZES.md },
  label: { fontSize: 12, ...FONTS.semiBold, color: COLORS.textSecondary, marginBottom: 6, marginLeft: 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SIZES.base,
    backgroundColor: '#F8FAFC',
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: COLORS.textPrimary, ...FONTS.medium },
  inputError: { borderColor: COLORS.error, backgroundColor: '#FFF5F5' },
  errorText: { color: COLORS.error, fontSize: 11, ...FONTS.medium, marginTop: 4, marginLeft: 4 },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: SIZES.base, gap: SIZES.sm },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.divider },
  sectionLabel: { fontSize: 12, ...FONTS.semiBold, color: COLORS.accent },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
    paddingVertical: 16, gap: 8, marginTop: SIZES.base,
    ...SHADOWS.md,
  },
  primaryBtnText: { fontSize: 16, ...FONTS.bold, color: COLORS.white },
});
