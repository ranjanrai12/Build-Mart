import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

/**
 * Avatar Shared Component
 * 
 * Renders:
 * - Profile Image (if `uri` is provided)
 * - Initials Fallback (if no `uri` but `name` provided)
 * - Generic icon (if nothing provided)
 */
export default function Avatar({ uri, name, size = 40, style }) {
  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  const borderRadius = size / 2;
  const fontSize = size * 0.4;

  const containerStyle = {
    width: size,
    height: size,
    borderRadius,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...style,
  };

  const textStyle = {
    fontSize,
    ...FONTS.bold,
    color: COLORS.white,
  };

  if (uri) {
    return (
      <View style={containerStyle}>
        <Image 
          source={{ uri }} 
          style={{ width: '100%', height: '100%' }} 
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{initials || 'U'}</Text>
    </View>
  );
}
