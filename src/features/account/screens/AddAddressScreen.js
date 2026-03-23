import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  StatusBar, Platform, KeyboardAvoidingView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { useAddresses } from '../../../context/AddressContext';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';

export default function AddAddressScreen({ navigation, route }) {
  const { addAddress, updateAddress } = useAddresses();
  const editData = route.params?.editData;

  const [type, setType] = useState(editData?.type || 'Home');
  const [address, setAddress] = useState(editData?.address || '');
  const [city, setCity] = useState(editData?.city || '');
  const [state, setState] = useState(editData?.state || '');
  const [pin, setPin] = useState(editData?.pin || '');
  const [errors, setErrors] = useState({});
  const [isLocating, setIsLocating] = useState(false);

  const handleCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Please enable location access in settings.',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      
      let place = null;
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (results && results.length > 0) place = results[0];
      } catch (e) {
        console.warn('Expo Geocoder failed, falling back to Nominatim...', e);
      }

      // Fallback to Nominatim (OpenStreetMap) if Expo Geocoder fails (common on Web / SDK 49+)
      if (!place) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}&addressdetails=1`
        );
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          setAddress([addr.road || addr.suburb, addr.neighbourhood].filter(Boolean).join(', '));
          setCity(addr.city || addr.town || addr.village || '');
          setPin(addr.postcode || '');
          setState(addr.state || '');
          setErrors({});
          Toast.show({ type: 'success', text1: 'Location Detected (Fallback) ✓' });
          return;
        }
      }

      if (place) {
        const streetNum = place.name || '';
        const street = place.street || '';
        const district = place.district || '';
        const subRegion = place.subregion || '';

        setAddress(`${streetNum} ${street} ${district} ${subRegion}`.trim());
        setCity(place.city || place.subregion || '');
        setPin(place.postalCode || '');
        setState(place.region || '');
        
        // Clear errors
        setErrors({});
        
        Toast.show({
          type: 'success',
          text1: 'Location Detected ✓',
          text2: 'Address fields have been auto-filled.',
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Failed to fetch your precise location.',
      });
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = () => {
    let newErrors = {};
    if (!address.trim()) newErrors.address = 'Please enter your street address or plot number.';
    if (!city.trim()) newErrors.city = 'Please enter your city.';
    if (!pin.trim()) newErrors.pin = 'Please enter a valid PIN code.';
    if (!state.trim()) newErrors.state = 'Please enter your state.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const addressData = {
      type,
      address,
      city,
      state,
      pin,
      isDefault: editData ? editData.isDefault : false
    };

    if (editData) {
      updateAddress(editData.id, addressData).then(res => {
        if (res.success) navigation.goBack();
      });
    } else {
      addAddress(addressData).then(res => {
        if (res.success) navigation.goBack();
      });
    }
  };

  const handleTextChange = (field, setter) => (text) => {
    let val = text;
    if (field === 'pin') val = text.replace(/[^0-9]/g, '');
    setter(val);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editData ? 'Edit Address' : 'Add New Address'}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.formContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Address Type</Text>
        <View style={styles.typeRow}>
          {['Home', 'Site Office'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => setType(t)}
            >
              <MaterialIcons
                name={t === 'Home' ? 'home' : 'business'}
                size={20}
                color={type === t ? COLORS.accent : COLORS.textMuted}
              />
              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.locationBtn, isLocating && styles.locationBtnDisabled]} 
          onPress={handleCurrentLocation}
          disabled={isLocating}
          activeOpacity={0.7}
        >
          <MaterialIcons name="my-location" size={18} color={COLORS.primary} />
          <Text style={styles.locationBtnText}>
            {isLocating ? 'Detecting address...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Street Address / Plot No.</Text>
          <View style={[styles.inputBox, { height: 80, paddingTop: 12 }, errors.address && styles.inputError]}>
            <TextInput
              style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
              value={address}
              onChangeText={handleTextChange('address', setAddress)}
              placeholder="e.g. 123 Palm Grove Avenue, Phase 2..."
              placeholderTextColor={COLORS.textMuted}
              multiline
            />
          </View>
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: SIZES.sm }]}>
            <Text style={styles.label}>City</Text>
            <View style={[styles.inputBox, errors.city && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={handleTextChange('city', setCity)}
                placeholder="e.g. Mumbai"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>PIN Code</Text>
            <View style={[styles.inputBox, errors.pin && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={handleTextChange('pin', setPin)}
                placeholder="e.g. 400001"
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            {errors.pin && <Text style={styles.errorText}>{errors.pin}</Text>}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State</Text>
          <View style={[styles.inputBox, errors.state && styles.inputError]}>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={handleTextChange('state', setState)}
              placeholder="e.g. Maharashtra"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons name="local-shipping" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>Ensuring your PIN code is accurate helps us calculate exact delivery times and costs.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Address</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.header,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  headerRow: {
    flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.base,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.white },

  formContainer: { padding: SIZES.base, paddingTop: SIZES.lg },
  sectionTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 12 },

  typeRow: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.lg },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    height: 48, borderWidth: 1, borderColor: COLORS.divider,
  },
  typeBtnActive: {
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderColor: COLORS.accent,
  },
  typeText: { fontSize: 15, ...FONTS.semiBold, color: COLORS.textSecondary },
  typeTextActive: { color: COLORS.accent },

  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EEF2FF', borderRadius: RADIUS.md,
    paddingVertical: 12, marginBottom: SIZES.lg,
    borderWidth: 1, borderColor: '#E0E7FF',
  },
  locationBtnText: { fontSize: 14, ...FONTS.bold, color: COLORS.primary },
  locationBtnDisabled: { opacity: 0.6 },

  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: SIZES.md },
  label: { fontSize: 14, ...FONTS.semiBold, color: COLORS.textPrimary, marginBottom: 8, marginLeft: 4 },
  inputBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: COLORS.divider,
    justifyContent: 'center',
  },
  input: { fontSize: 15, ...FONTS.medium, color: COLORS.textPrimary },

  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
    ...FONTS.medium,
  },

  infoBox: {
    flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 12, borderRadius: RADIUS.md,
    marginTop: SIZES.sm, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, marginLeft: 8, lineHeight: 18 },

  footer: { padding: SIZES.base, paddingBottom: Platform.OS === 'ios' ? 32 : 20, backgroundColor: COLORS.white, ...SHADOWS.up },
  saveBtn: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, ...FONTS.bold, color: COLORS.white },
});
