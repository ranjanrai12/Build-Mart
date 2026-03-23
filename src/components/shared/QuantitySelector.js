import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

export default function QuantitySelector({ value, onDecrease, onIncrease, min = 1, max = 999 }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, value <= min && styles.btnDisabled]}
        onPress={onDecrease}
        disabled={value <= min}
      >
        <MaterialIcons name="remove" size={18} color={value <= min ? COLORS.textMuted : COLORS.accent} />
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity
        style={[styles.btn, value >= max && styles.btnDisabled]}
        onPress={onIncrease}
        disabled={value >= max}
      >
        <MaterialIcons name="add" size={18} color={value >= max ? COLORS.textMuted : COLORS.accent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  btn: {
    width: 36, height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  btnDisabled: { opacity: 0.5 },
  value: {
    width: 40, textAlign: 'center',
    fontSize: 16, ...FONTS.bold,
    color: COLORS.textPrimary,
  },
});
