import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, RADIUS, SHADOWS, FONTS } from '../../constants/theme';

export default function SearchBar({ value, onChangeText, onClear, onVoicePress, placeholder = 'Search products, materials...' }) {
  return (
    <View style={styles.container}>
      <MaterialIcons name="search" size={20} color={COLORS.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity onPress={onClear} style={styles.rightIcon}>
          <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      ) : onVoicePress ? (
        <TouchableOpacity onPress={onVoicePress} style={styles.rightIcon}>
          <MaterialIcons name="mic" size={20} color={COLORS.accent} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SIZES.base + 2,
    paddingVertical: SIZES.sm + 2,
    ...SHADOWS.sm,
  },
  icon: { marginRight: SIZES.sm },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    ...FONTS.medium,
  },
  rightIcon: { paddingHorizontal: 4 },
});
