import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  StatusBar, Platform, KeyboardAvoidingView, Modal, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import Toast from 'react-native-toast-message';

export default function EditProfileScreen({ navigation }) {
  const { user, requestProfileUpdate, confirmProfileUpdate, updateUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleNameChange = (val) => {
    setName(val);
    if (errors.name) setErrors(prev => ({ ...prev, name: null }));
  };

  const handlePhoneChange = (val) => {
    const sanitized = val.replace(/[^0-9]/g, '');
    setPhone(sanitized);
    if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
  };

  const handleEmailChange = (val) => {
    setEmail(val.trim().toLowerCase());
    if (errors.email) setErrors(prev => ({ ...prev, email: null }));
  };

  const handleSave = async () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!phone.trim() || phone.length < 10) newErrors.phone = 'Valid 10-digit phone number is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const updateData = { name, phone, email };
      
      const response = await requestProfileUpdate(updateData);
      
      if (response.success) {
        if (response.otpRequired) {
          setShowOtpModal(true);
        } else {
          // Name only or no sensitive changes
          await updateUser(updateData);
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Profile updated successfully'
          });
          navigation.goBack();
        }
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response.message });
      }
    } catch (error) {
      console.error('Save error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setOtpError('Enter 4-digit OTP');
      return;
    }

    try {
      setIsVerifying(true);
      setOtpError('');
      
      const response = await confirmProfileUpdate({ name, phone, email }, otp);
      
      if (response.success) {
        setShowOtpModal(false);
        Toast.show({
          type: 'success',
          text1: 'Verified ✓',
          text2: 'Profile updated successfully'
        });
        navigation.goBack();
      } else {
        setOtpError(response.message || 'Invalid OTP');
      }
    } catch (error) {
      setOtpError('Verification failed');
    } finally {
      setIsVerifying(false);
    }
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        
        <View style={styles.avatarEdit}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.cameraBtn}>
            <MaterialIcons name="camera-alt" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputBox, errors.name && styles.inputError]}>
            <MaterialIcons name="person-outline" size={20} color={errors.name ? COLORS.error : COLORS.textMuted} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputBox, errors.email && styles.inputError]}>
            <MaterialIcons name="email" size={20} color={errors.email ? COLORS.error : COLORS.textMuted} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.inputBox, errors.phone && styles.inputError]}>
            <MaterialIcons name="phone" size={20} color={errors.phone ? COLORS.error : COLORS.textMuted} />
            <Text style={styles.prefix}>+91</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>
        
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>Changing email or phone number will require OTP verification to ensure account security.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleSave} 
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Change</Text>
            <Text style={styles.modalSub}>Enter the 4-digit OTP sent to your new contact information.</Text>
            
            <View style={styles.otpWrapper}>
              {/* Hidden hidden input */}
              <TextInput
                style={styles.hiddenInput}
                value={otp}
                onChangeText={(v) => { if (v.length <= 4) setOtp(v); setOtpError(''); }}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
              />
              {/* Visible boxes */}
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3].map((idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.otpBox, 
                      otp.length === idx && styles.activeOtpBox,
                      otpError && { borderColor: COLORS.error }
                    ]}
                  >
                    <Text style={styles.otpText}>{otp[idx] || ''}</Text>
                  </View>
                ))}
              </View>
            </View>

            {otpError ? <Text style={styles.otpErrorText}>{otpError}</Text> : null}

            <TouchableOpacity 
              style={[styles.verifyBtn, isVerifying && { opacity: 0.7 }]} 
              onPress={handleVerifyOtp}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.verifyBtnText}>Verify & Save</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => setShowOtpModal(false)}
              disabled={isVerifying}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.header,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  headerRow: {
    flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.base, marginBottom: SIZES.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.white },
  avatarEdit: { position: 'relative', marginTop: 10 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { fontSize: 32, ...FONTS.bold, color: COLORS.white },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.header,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.accent,
  },
  formContainer: { padding: SIZES.base, paddingTop: SIZES.lg },
  inputGroup: { marginBottom: SIZES.md },
  label: { fontSize: 14, ...FONTS.semiBold, color: COLORS.textPrimary, marginBottom: 8, marginLeft: 4 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  input: { flex: 1, fontSize: 15, ...FONTS.medium, color: COLORS.textPrimary, marginLeft: 10 },
  prefix: { fontSize: 15, ...FONTS.medium, color: COLORS.textPrimary, marginLeft: 10 },
  divider: { width: 1, height: 24, backgroundColor: COLORS.divider, marginHorizontal: 10 },
  inputError: { borderColor: COLORS.error, backgroundColor: '#FFF5F5' },
  errorText: { color: COLORS.error, fontSize: 11, ...FONTS.medium, marginTop: 4, marginLeft: 4 },
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
  
  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%', backgroundColor: COLORS.white,
    borderRadius: 24, padding: 24, alignItems: 'center',
    ...SHADOWS.lg,
  },
  modalTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 8 },
  modalSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  otpWrapper: { width: '100%', alignItems: 'center', marginBottom: 20, height: 60 },
  hiddenInput: { 
    position: 'absolute', width: '100%', height: '100%', 
    opacity: 0, zIndex: 10 
  },
  otpContainer: { 
    flexDirection: 'row', justifyContent: 'space-between', width: '100%', zIndex: 1 
  },
  otpBox: { 
    width: 44, height: 54, borderRadius: 12, borderWidth: 2, 
    borderColor: '#EDF2F7', backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm,
  },
  activeOtpBox: { borderColor: COLORS.accent, backgroundColor: COLORS.white },
  otpText: { fontSize: 24, ...FONTS.bold, color: COLORS.textPrimary },
  otpErrorText: { color: COLORS.error, fontSize: 12, marginBottom: 15 },
  verifyBtn: {
    width: '100%', height: 52, backgroundColor: COLORS.accent,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginTop: 10,
  },
  verifyBtnText: { fontSize: 16, ...FONTS.bold, color: COLORS.white },
  cancelBtn: { marginTop: 15, padding: 10 },
  cancelBtnText: { fontSize: 14, ...FONTS.medium, color: COLORS.textSecondary },
});
