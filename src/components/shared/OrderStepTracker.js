import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

const STEPS = [
  { key: 'Placed', label: 'Placed', icon: 'receipt' },
  { key: 'Confirmed', label: 'Confirmed', icon: 'check-circle' },
  { key: 'Packed', label: 'Packed', icon: 'inventory' },
  { key: 'Dispatched', label: 'Dispatched', icon: 'local-shipping' },
  { key: 'Delivered', label: 'Delivered', icon: 'home-work' },
];

export default function OrderStepTracker({ currentStatus, style }) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStatus);
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.track}>
        {STEPS.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <React.Fragment key={step.key}>
              {/* Step Circle */}
              <View style={[
                styles.stepCircle, 
                isActive && styles.circleActive,
                isCurrent && styles.circleCurrent
              ]}>
                <MaterialIcons 
                  name={step.icon} 
                  size={16} 
                  color={isActive ? COLORS.white : COLORS.textMuted} 
                />
              </View>
              
              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <View style={[
                  styles.line, 
                  index < currentIndex && styles.lineActive
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
      
      <View style={styles.labels}>
        {STEPS.map((step, index) => (
          <Text key={step.key} style={[
            styles.label,
            index <= currentIndex && styles.labelActive,
            index === currentIndex && styles.labelCurrent
          ]}>
            {step.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 10 },
  track: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F1F3F5',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  circleActive: { backgroundColor: COLORS.primary },
  circleCurrent: { 
    backgroundColor: COLORS.primary,
    borderWidth: 3, borderColor: 'rgba(255,107,53,0.3)',
  },
  line: {
    flex: 1, height: 3, backgroundColor: '#F1F3F5',
    marginHorizontal: -5,
  },
  lineActive: { backgroundColor: COLORS.primary },
  labels: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  label: { fontSize: 10, color: COLORS.textMuted, width: 70, textAlign: 'center' },
  labelActive: { color: COLORS.textPrimary, ...FONTS.medium },
  labelCurrent: { color: COLORS.accent, ...FONTS.bold },
});
