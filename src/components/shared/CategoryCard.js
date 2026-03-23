import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../constants/theme';

export default function CategoryCard({ category, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconBox, { backgroundColor: category.color }]}>
        <MaterialIcons name={category.icon} size={26} color="#fff" />
      </View>
      <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    width: 80,
    marginRight: SIZES.sm,
  },
  iconBox: {
    width: 64, height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  name: {
    fontSize: 12,
    ...FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
