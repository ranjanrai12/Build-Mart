import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../constants/theme';

export default function ConfirmModal({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  isDestructive = false,
  icon = 'help-outline'
}) {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={[styles.iconBox, { backgroundColor: isDestructive ? 'rgba(231,76,60,0.1)' : 'rgba(255,107,53,0.1)' }]}>
            <MaterialIcons name={icon} size={32} color={isDestructive ? COLORS.error : COLORS.accent} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: isDestructive ? COLORS.error : COLORS.accent }]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: SIZES.base,
  },
  container: {
    width: '100%', maxWidth: 340, backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: 24, alignItems: 'center', ...SHADOWS.lg,
  },
  iconBox: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { fontSize: 15, ...FONTS.semiBold, color: COLORS.textSecondary },
  confirmBtn: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, ...SHADOWS.sm },
  confirmText: { fontSize: 15, ...FONTS.bold, color: COLORS.white },
});
