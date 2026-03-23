import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../constants/theme';
import { useWishlist } from '../../context/WishlistContext';
import { useReviews } from '../../context/ReviewContext';
import { useCart } from '../../context/CartContext';
import useCurrency from '../../hooks/useCurrency';

export default function ProductCard({ product, seller, onPress, onAddToCart, compact = false, style }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { getAverageRating, getReviewCount } = useReviews();
  const { items, updateQuantity, removeItem } = useCart();
  const { formatINR } = useCurrency();
  
  const wishlisted = isInWishlist(product.id);
  const inCart = items.find(i => i.productId === product.id);
  const avgRating = getAverageRating(product.id, product.rating);
  const totalReviews = getReviewCount(product.id, product.reviews);

  return (
    <TouchableOpacity 
      style={[styles.card, compact && styles.compact, style]} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      {/* Image / Placeholder Area */}
      <View style={[styles.imageArea, compact && styles.compactImage]}>
        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={StyleSheet.absoluteFill}
        />
        <MaterialIcons name="inventory-2" size={compact ? 32 : 48} color="rgba(255,255,255,0.2)" />

        {/* Wishlist Button */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => toggleWishlist(product.id)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={wishlisted ? "favorite" : "favorite-border"}
            size={18}
            color={wishlisted ? COLORS.accent : COLORS.white}
          />
        </TouchableOpacity>

        {/* Badges */}
        <View style={styles.badgeContainer}>
          {product.tags?.includes('bestseller') && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>BESTSELLER</Text>
            </View>
          )}
          {seller?.rating >= 4.5 && (
            <View style={[styles.tag, { backgroundColor: COLORS.success, marginTop: 4 }]}>
              <MaterialIcons name="verified" size={10} color={COLORS.white} />
              <Text style={styles.tagText}>VERIFIED</Text>
            </View>
          )}
        </View>

        {!product.inStock && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.ratingBox}>
            <MaterialIcons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingNum}>{avgRating}</Text>
          </View>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.reviewCount}>{totalReviews} Reviews</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatINR(product.price)}</Text>
            <Text style={styles.unit}>/{product.unit || 'unit'}</Text>
          </View>

          {!compact && product.inStock && (
            inCart ? (
              <View style={styles.qtyPill}>
                <TouchableOpacity 
                  style={styles.pillBtn} 
                  onPress={() => {
                    if (inCart.quantity <= 1) removeItem(product.id);
                    else updateQuantity(product.id, inCart.quantity - 1);
                  }}
                >
                  <MaterialIcons name="remove" size={14} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.pillText}>{inCart.quantity}</Text>
                <TouchableOpacity 
                  style={styles.pillBtn} 
                  onPress={() => updateQuantity(product.id, inCart.quantity + 1)}
                >
                  <MaterialIcons name="add" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.quickAdd} 
                onPress={onAddToCart}
                activeOpacity={0.7}
              >
                <MaterialIcons name="add-shopping-cart" size={18} color={COLORS.accent} />
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
    width: 170, // Slightly wider for better text flow
    marginRight: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  compact: { width: '48%', marginRight: 0 },
  imageArea: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  compactImage: { height: 110 },
  wishlistBtn: {
    position: 'absolute',
    top: 8, right: 8,
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 5,
  },
  badgeContainer: { position: 'absolute', top: 8, left: 8, zIndex: 5 },
  tag: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    ...SHADOWS.sm,
  },
  tagText: { color: COLORS.white, fontSize: 8, ...FONTS.bold, letterSpacing: 0.5 },
  outOfStock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  outOfStockText: { color: COLORS.error, fontSize: 10, ...FONTS.bold, letterSpacing: 1 },
  
  info: { padding: 12 },
  name: { fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 4 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingNum: { fontSize: 12, ...FONTS.extraBold, color: COLORS.textPrimary },
  separator: { color: COLORS.divider, fontSize: 12 },
  reviewCount: { fontSize: 11, color: COLORS.textMuted, ...FONTS.medium },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceContainer: { flex: 1 },
  price: { fontSize: 18, ...FONTS.extraBold, color: COLORS.primary },
  unit: { fontSize: 10, color: COLORS.textMuted, marginTop: -2 },
  
  quickAdd: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FED7AA',
  },
  
  qtyPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 4, paddingVertical: 2,
  },
  pillBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 13, ...FONTS.bold, color: COLORS.primary, minWidth: 20, textAlign: 'center' },
});
