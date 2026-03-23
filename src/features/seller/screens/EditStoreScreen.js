import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../context/AuthContext';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import Toast from 'react-native-toast-message';

const InputField = ({ label, value, onChangeText, placeholder, error, multiline = false, keyboardType = 'default' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputBox, error && styles.inputError]}>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

import apiClient from '../../../api/apiClient';

export default function EditStoreScreen({ navigation }) {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    businessDescription: user?.businessDescription || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bannerImage: user?.bannerImage || '',
    operatingHours: user?.operatingHours || { open: '09:00', close: '18:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    deliveryRange: user?.deliveryRange || '15 km',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateForm = (key, val) => {
    let sanitized = val;
    if (key === 'phone') sanitized = val.replace(/[^0-9+]/g, '');
    setFormData(prev => ({ ...prev, [key]: sanitized }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleSave = async () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Business name is required';
    if (!formData.phone.trim() || formData.phone.length < 10) newErrors.phone = 'Enter a valid 10-digit number';
    if (!formData.location.trim()) newErrors.location = 'Store location is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.patch('/sellers/profile', formData);
      await updateUser(response.data); // Update local Auth state
      Toast.show({
        type: 'success',
        text1: 'Store Profile Updated ✓',
        text2: 'Buyers will now see your fresh storefront.',
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.message || 'Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={[COLORS.primary, '#1A2C3F']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Merchant Identity</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.headerSubtitle}>Personalize your business presence</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <InputField 
            label="Business Display Name *"
            value={formData.name}
            onChangeText={(t) => updateForm('name', t)}
            placeholder="e.g. Sharma Building Supplies"
            error={errors.name}
          />

          <InputField 
            label="Business Description"
            value={formData.businessDescription}
            onChangeText={(t) => updateForm('businessDescription', t)}
            placeholder="Tell buyers about your materials, quality, and experience..."
            multiline
            error={errors.businessDescription}
          />

          <InputField 
            label="Banner Image URL"
            value={formData.bannerImage}
            onChangeText={(t) => updateForm('bannerImage', t)}
            placeholder="https://example.com/your-store.jpg"
            error={errors.bannerImage}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <InputField 
                label="Opening Time"
                value={formData.operatingHours.open}
                onChangeText={(t) => setFormData({...formData, operatingHours: {...formData.operatingHours, open: t}})}
                placeholder="09:00"
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <InputField 
                label="Closing Time"
                value={formData.operatingHours.close}
                onChangeText={(t) => setFormData({...formData, operatingHours: {...formData.operatingHours, close: t}})}
                placeholder="18:00"
              />
            </View>
          </View>

          <InputField 
            label="Contact Hotline *"
            value={formData.phone}
            onChangeText={(t) => updateForm('phone', t)}
            placeholder="+91 XXXXX XXXXX"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <InputField 
            label="Storefront Headquarters *"
            value={formData.location}
            onChangeText={(t) => updateForm('location', t)}
            placeholder="City, Commercial Area"
            error={errors.location}
          />

          <InputField 
            label="Logistics Service Range"
            value={formData.deliveryRange}
            onChangeText={(t) => updateForm('deliveryRange', t)}
            placeholder="e.g. 50 km"
            error={errors.deliveryRange}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, loading && styles.disabledBtn]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialIcons name="verified" size={20} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Update Storefront</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 60, paddingBottom: 30, paddingHorizontal: SIZES.base,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  headerTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: SIZES.base, marginTop: -20 },
  formCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SIZES.lg,
    ...SHADOWS.md, marginBottom: SIZES.xl,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 8 },
  inputBox: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EDF2F7',
    borderRadius: RADIUS.md, overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: COLORS.textPrimary,
  },
  inputError: { borderColor: COLORS.error, backgroundColor: '#FFF5F5' },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4, marginLeft: 4, ...FONTS.medium },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  saveBtn: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.lg, py: SIZES.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, ...SHADOWS.md,
    paddingVertical: 15,
  },
  saveBtnText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },
  disabledBtn: { backgroundColor: '#CBD5E0' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
