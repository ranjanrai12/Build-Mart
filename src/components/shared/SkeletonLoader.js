import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

export default function SkeletonLoader({ width, height, borderRadius = RADIUS.md, style }) {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    return () => animation.stop();
  }, [shimmerValue]);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
});

export const ProductSkeleton = () => (
  <View style={productStyles.card}>
    <SkeletonLoader width="100%" height={120} borderRadius={RADIUS.lg} />
    <View style={productStyles.content}>
      <SkeletonLoader width="80%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="40%" height={14} style={{ marginBottom: 12 }} />
      <View style={productStyles.footer}>
        <SkeletonLoader width="50%" height={24} />
        <SkeletonLoader width={32} height={32} borderRadius={16} />
      </View>
    </View>
  </View>
);

const productStyles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  content: { marginTop: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
