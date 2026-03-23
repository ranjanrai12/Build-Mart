import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, FONTS, SIZES, RADIUS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MerchantRevenueChart({ data = [], growthText = '+0% vs last week' }) {
  // data: [{ day: 'M', value: 40 }, ...]
  
  return (
    <View style={styles.container}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartPeriod}>Weekly Revenue Trend</Text>
        <Text style={[
          styles.chartGrowth, 
          growthText.includes('↓') && { color: COLORS.error }
        ]}>{growthText}</Text>
      </View>
      
      <View style={styles.chartArea}>
        {data.map((item, index) => (
          <Bar key={index} value={item.displayValue || item.value} label={item.day} index={index} />
        ))}
      </View>
      
      <View style={styles.yAxis}>
        <Text style={styles.yLabel}>High</Text>
        <View style={styles.yLine} />
        <Text style={styles.yLabel}>Avg</Text>
        <View style={styles.yLine} />
        <Text style={styles.yLabel}>0</Text>
      </View>
    </View>
  );
}

const Bar = ({ value, label, index }) => {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: value,
      duration: 1000,
      delay: index * 100,
      useNativeDriver: false, // Animating height
    }).start();
  }, [value]);

  return (
    <View style={styles.barContainer}>
      <View style={styles.barBack}>
        <Animated.View 
          style={[
            styles.barFill, 
            { 
              height: heightAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }),
              backgroundColor: index === 6 ? COLORS.accent : COLORS.primary 
            }
          ]} 
        />
      </View>
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SIZES.lg,
    marginTop: SIZES.md,
  },
  chartHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 24,
  },
  chartPeriod: { fontSize: 13, ...FONTS.semiBold, color: COLORS.textMuted },
  chartGrowth: { fontSize: 13, ...FONTS.bold, color: COLORS.success },
  chartArea: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingRight: 30, // Space for Y axis
    zIndex: 2,
  },
  barContainer: { alignItems: 'center', flex: 1 },
  barBack: {
    width: 24,
    height: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 11,
    ...FONTS.medium,
    color: COLORS.textMuted,
  },
  yAxis: {
    position: 'absolute',
    right: 20,
    top: 65,
    height: 140,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yLabel: { fontSize: 9, color: '#94A3B8', ...FONTS.bold, textTransform: 'uppercase' },
  yLine: { width: 10, height: 1, backgroundColor: '#E2E8F0' },
});
