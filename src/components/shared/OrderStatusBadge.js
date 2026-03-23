import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

const STATUS_CONFIG = {
  Placed:     { bg: '#EBF5FB', color: '#2980B9', label: 'Placed' },
  Confirmed:  { bg: '#EAF7F0', color: '#27AE60', label: 'Confirmed' },
  Packed:     { bg: '#F5F3FF', color: '#7C3AED', label: 'Packed' },
  Dispatched: { bg: '#FEF9E7', color: '#F39C12', label: 'Dispatched' },
  Delivered:  { bg: '#EAFAF1', color: '#1E8449', label: 'Delivered' },
  Rejected:   { bg: '#FDEDEC', color: '#E74C3C', label: 'Rejected' },
};

export default function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Placed;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, ...FONTS.semiBold },
});
