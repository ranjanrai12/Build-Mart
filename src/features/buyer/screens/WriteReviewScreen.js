import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import { useReviews } from '../../../context/ReviewContext';
import Toast from 'react-native-toast-message';

export default function WriteReviewScreen({ navigation, route }) {
  const { productId, sellerId, name, type } = route.params; // type: 'product' or 'seller'
  const { submitProductReview, submitSellerReview } = useReviews();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Toast.show({ type: 'error', text1: 'Rating Required', text2: 'Please select a star rating.' });
      return;
    }

    setSubmitting(true);
    try {
      if (type === 'product') {
        await submitProductReview(productId, rating, comment);
      } else {
        await submitSellerReview(sellerId, rating, comment);
      }
      
      Toast.show({
        type: 'success',
        text1: 'Review Submitted! ✓',
        text2: 'Thank you for your feedback.',
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Submission Failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <LinearGradient colors={[COLORS.primary, '#1A2C3F']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write a Review</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.targetCard}>
          <View style={styles.iconCircle}>
            <MaterialIcons name={type === 'product' ? 'inventory' : 'storefront'} size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.targetName}>{name}</Text>
          <Text style={styles.targetSub}>{type === 'product' ? 'Rate this product' : 'Rate your experience with this seller'}</Text>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.label}>Your Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.7}>
                <MaterialIcons 
                  name={s <= rating ? "star" : "star-border"} 
                  size={48} 
                  color={s <= rating ? "#F39C12" : COLORS.divider} 
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingHint}>
            {rating === 1 ? 'Terrible' : rating === 2 ? 'Poor' : rating === 3 ? 'Average' : rating === 4 ? 'Very Good' : rating === 5 ? 'Excellent' : 'Select stars'}
          </Text>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.label}>Share your thoughts</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="What did you like or dislike? How's the quality?"
            multiline
            numberOfLines={6}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, submitting && styles.disabledBtn]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          <LinearGradient colors={[COLORS.accent, '#EA580C']} style={styles.gradientBtn}>
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>Submit Review</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.white },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingBottom: 60 },
  targetCard: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, ...SHADOWS.sm
  },
  targetName: { fontSize: 22, ...FONTS.extraBold, color: COLORS.textPrimary, textAlign: 'center' },
  targetSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  ratingSection: { alignItems: 'center', marginBottom: 32 },
  label: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 12, width: '100%' },
  starsRow: { flexDirection: 'row', gap: 8 },
  ratingHint: { fontSize: 14, ...FONTS.semiBold, color: '#F39C12', marginTop: 12 },
  commentSection: { marginBottom: 40 },
  commentInput: {
    backgroundColor: '#F8FAFC', borderRadius: RADIUS.lg,
    padding: 16, fontSize: 15, ...FONTS.regular, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: '#E2E8F0', height: 150,
  },
  submitBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.md },
  gradientBtn: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 16, ...FONTS.bold, color: COLORS.white },
  disabledBtn: { opacity: 0.7 },
});
