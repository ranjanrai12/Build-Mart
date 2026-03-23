import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SIZES, SHADOWS } from '../../constants/theme';

export default function EmptyState({ 
  icon = 'inventory', 
  title = 'Nothing here yet', 
  message = 'This list is empty.', 
  btnLabel, 
  onBtnPress 
}) {
  return (
    <View style={styles.container}>
      <View style={styles.decorationCircle} />
      <View style={styles.iconBox}>
        <MaterialIcons name={icon} size={48} color={COLORS.primary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {btnLabel && onBtnPress && (
        <TouchableOpacity style={styles.btn} onPress={onBtnPress} activeOpacity={0.8}>
          <Text style={styles.btnText}>{btnLabel}</Text>
          <MaterialIcons name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  decorationCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#F1F5F9',
    top: 20,
    opacity: 0.5,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...SHADOWS.md,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    ...FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.md,
  },
  btnText: {
    fontSize: 16,
    ...FONTS.bold,
    color: COLORS.white,
  },
});
