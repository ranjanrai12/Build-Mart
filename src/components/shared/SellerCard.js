import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../constants/theme';

export default function SellerCard({ seller, onPress }) {
  // pick a stable accent color per seller initial
  const avatarColors = ['#1B2838', '#2980B9', '#8E44AD', '#16A085', '#C0392B'];
  const avatarBg = avatarColors[seller.name.charCodeAt(0) % avatarColors.length];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Accent strip */}
      <View style={[styles.strip, { backgroundColor: avatarBg }]} />

      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <Text style={styles.avatarText}>{seller.name.charAt(0)}</Text>
        {seller.verified && (
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="verified" size={14} color="#3498DB" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{seller.name}</Text>

        {/* Stars */}
        <View style={styles.ratingRow}>
          {[1,2,3,4,5].map(i => (
            <MaterialIcons key={i} name="star" size={13}
              color={i <= Math.round(seller.rating) ? '#F39C12' : '#DDE2E8'} />
          ))}
          <Text style={styles.ratingText}>{seller.rating}</Text>
          <Text style={styles.reviewCount}>({seller.totalReviews})</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="location-on" size={12} color={COLORS.accent} />
            <Text style={styles.metaText} numberOfLines={1}>{seller.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="inventory" size={12} color={COLORS.accent} />
            <Text style={styles.metaText}>{seller.products} products</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="local-shipping" size={12} color={COLORS.accent} />
            <Text style={styles.metaText}>{seller.deliveryRange}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chevronWrap}>
        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
    padding: SIZES.base,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
    overflow: 'hidden',
    gap: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  strip: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 5,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  },
  avatar: {
    width: 56, height: 56,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 4,
  },
  avatarText: { color: COLORS.white, fontSize: 24, ...FONTS.bold },
  verifiedBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 2,
    ...SHADOWS.sm,
  },
  info: { flex: 1 },
  name: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 2 },
  ratingText: { fontSize: 13, ...FONTS.bold, color: COLORS.textPrimary, marginLeft: 2 },
  reviewCount: { fontSize: 12, color: COLORS.textMuted, marginLeft: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, ...FONTS.medium, color: COLORS.textSecondary },
  chevronWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
});
