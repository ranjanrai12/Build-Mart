import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, StatusBar, Animated, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Smarter Sourcing',
    description: 'Find premium construction materials from verified sellers nearest to your site.',
    icon: 'location-on',
    color: '#3498DB',
  },
  {
    id: '2',
    title: 'Transparent Pricing',
    description: 'Compare wholesale prices and access bulk discounts directly from the dashboard.',
    icon: 'attach-money',
    color: '#27AE60',
  },
  {
    id: '3',
    title: 'Verified Materials',
    description: 'Shop with confidence using verified merchant ratings and verified product reviews.',
    icon: 'verified',
    color: COLORS.accent,
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setHasSeenOnboarding } = useAuth();
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@has_seen_onboarding', 'true');
      setHasSeenOnboarding(true);
    } catch (e) {
      console.log('Error saving onboarding state:', e);
      setHasSeenOnboarding(true); // Fallback to proceed anyway
    }
  };

  const Indicator = () => (
    <View style={styles.indicatorContainer}>
      {SLIDES.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 20, 10],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View 
            key={i} 
            style={[styles.dot, { width: dotWidth, opacity, backgroundColor: SLIDES[currentIndex].color }]} 
          />
        );
      })}
    </View>
  );

  const Slide = ({ item }) => (
    <View style={styles.slide}>
      <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
        <MaterialIcons name={item.icon} size={120} color={item.color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <TouchableOpacity style={styles.skipBtn} onPress={finishOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        data={SLIDES}
        renderItem={({ item }) => <Slide item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      <View style={styles.footer}>
        <Indicator />
        <TouchableOpacity 
          style={[styles.nextBtn, { backgroundColor: SLIDES[currentIndex].color }]} 
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <MaterialIcons 
            name={currentIndex === SLIDES.length - 1 ? 'check' : 'arrow-forward'} 
            size={20} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  slide: { width, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconContainer: {
    width: 240, height: 240, borderRadius: 120,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 60,
  },
  textContainer: { alignItems: 'center' },
  title: { fontSize: 28, ...FONTS.extraBold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 40 },
  dot: { height: 10, borderRadius: 5, marginHorizontal: 5 },
  footer: { paddingHorizontal: 40, paddingBottom: Platform.OS === 'ios' ? 60 : 40 },
  nextBtn: {
    flexDirection: 'row', height: 60, borderRadius: RADIUS.xl,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    ...SHADOWS.md,
  },
  nextText: { color: COLORS.white, fontSize: 18, ...FONTS.bold },
  skipBtn: { position: 'absolute', top: 60, right: 30, zIndex: 10 },
  skipText: { fontSize: 16, color: COLORS.textMuted, ...FONTS.medium },
});
