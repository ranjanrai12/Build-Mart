import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, Platform, KeyboardAvoidingView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../constants/theme';

export default function QuoteRequestModal({
  visible,
  onClose,
  onSubmit,
  product,
  seller
}) {
  const [qty, setQty] = useState('500');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  // Use state to track keyboard status if needed, but standard behavior usually works

  const handleSub = () => {
    if (!qty || !location) return;
    onSubmit({
      productId: product.id,
      productName: product.name,
      sellerId: product.sellerId,
      quantity: parseInt(qty),
      unit: product.unit,
      targetPrice: parseFloat(price),
      siteLocation: location,
      requiredBy: date || 'Contact for date',
      notes
    });
    setQty('500');
    setPrice(product?.price?.toString() || '');
    setLocation('');
    setDate('');
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bulk Quote Request</Text>
              <Text style={styles.subTitle}>{product?.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Requesting a quote allows you to negotiate pricing for high-volume project orders.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Requested Quantity ({product?.unit})</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500"
                keyboardType="numeric"
                value={qty}
                onChangeText={setQty}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Price per Unit (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 350"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Project Site Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Whitefield, Bengaluru"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Required By Date</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 15th April 2026"
                value={date}
                onChangeText={setDate}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any specific logistics or grade requirements?"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, (!qty || !location) && styles.disabledBtn]}
              onPress={handleSub}
              disabled={!qty || !location}
            >
              <Text style={styles.submitText}>Submit Inquiry</Text>
              <MaterialIcons name="send" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)', // Darker background to hide clutter 
    justifyContent: 'flex-end'
  },
  keyboardView: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.lg, // Use consistent padding
    paddingBottom: SIZES.base,
    maxHeight: '85%', // Prevent modal from covering the full screen
    width: '100%',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SIZES.lg,
    paddingBottom: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary },
  subTitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  closeBtn: {
    padding: 10, // Increased hit area
    marginRight: -10, // Offset padding for alignment
  },
  form: { paddingBottom: 40 },
  infoBox: {
    flexDirection: 'row', gap: 10, backgroundColor: '#EFF6FF',
    padding: 12, borderRadius: RADIUS.md, marginBottom: SIZES.xl,
    borderWidth: 1, borderColor: '#DBEAFE'
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 18 },
  inputGroup: { marginBottom: SIZES.lg },
  label: { fontSize: 14, ...FONTS.semiBold, color: COLORS.textPrimary, marginBottom: 8 },
  input: {
    backgroundColor: '#F8FAFC', borderRadius: RADIUS.md,
    padding: 14, fontSize: 14, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: '#EDF2F7'
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  footer: {
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12, // Safe area for footer
  },
  submitBtn: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.lg,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10, ...SHADOWS.md
  },
  submitText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },
  disabledBtn: { backgroundColor: '#CBD5E0' },
});
