import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Image, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import useImagePicker from '../../../hooks/useImagePicker';
import useCurrency from '../../../hooks/useCurrency';
import apiClient from '../../../api/apiClient';

export default function AddProductScreen({ navigation, route }) {
  const productId = route?.params?.productId;
  const isEdit = !!productId;

  const { formatINR } = useCurrency();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [tierErrors, setTierErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    unit: '',
    description: '',
    image: null,
    stock: '50',
    pricingTiers: []
  });

  const fetchData = useCallback(async () => {
    try {
      const catRes = await apiClient.get('/products/categories');
      setCategories(catRes.data);

      if (isEdit) {
        const prodRes = await apiClient.get(`/products/${productId}`);
        const p = prodRes.data;
        setForm({
          name: p.name,
          categoryId: p.categoryId,
          price: p.price.toString(),
          unit: p.unit,
          description: p.description || '',
          image: p.image || null,
          stock: p.stock.toString(),
          pricingTiers: p.pricingTiers || []
        });
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      Toast.show({ type: 'error', text1: 'Load Failed' });
    } finally {
      setLoading(false);
    }
  }, [isEdit, productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { pickImage } = useImagePicker();
  const update = (k, v) => {
    let sanitized = v;
    if (k === 'price') sanitized = v.replace(/[^0-9.]/g, '');
    if (k === 'stock') sanitized = v.replace(/[^0-9]/g, '');
    setForm(f => ({ ...f, [k]: sanitized }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: null }));
  };

  const onPriceChange = useCallback((val) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setForm(f => ({ ...f, price: clean }));

    // Live validate tiers against NEW retail price
    if (form.pricingTiers.length > 0) {
      const basePrice = parseFloat(clean || 0);
      let newTierErrors = { ...tierErrors };

      form.pricingTiers.forEach((t, i) => {
        const pPrice = parseFloat(t.price || 0);
        if (pPrice && basePrice > 0 && pPrice >= basePrice) { // Only validate if basePrice is valid
          newTierErrors[`tier_${i}_price`] = `Must be < ₹${basePrice}`;
        } else {
          // Clear error if it was specifically for this tier's price and related to basePrice
          if (newTierErrors[`tier_${i}_price`] && newTierErrors[`tier_${i}_price`].includes('Must be <')) {
            delete newTierErrors[`tier_${i}_price`];
          }
        }
      });
      setTierErrors(newTierErrors);
    }
    // Clear price error if it exists
    if (errors.price) setErrors(prev => ({ ...prev, price: null }));
  }, [form.pricingTiers, tierErrors, errors.price]);

  const handleSave = async () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    const parsedPrice = parseFloat(form.price);
    if (!form.price || isNaN(parsedPrice) || parsedPrice <= 0) newErrors.price = 'Please enter a valid price';
    if (!form.unit) newErrors.unit = 'Required (e.g. Kg, Bag)';
    if (!form.categoryId) newErrors.categoryId = 'Please select a category';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Auto-sort tiers by quantity before validation
    const sortedTiers = [...form.pricingTiers].sort((a, b) => parseInt(a.minQty || 0) - parseInt(b.minQty || 0));
    setForm(f => ({ ...f, pricingTiers: sortedTiers }));

    // Tier Validation
    if (sortedTiers.length > 0) {
      const basePrice = parseFloat(form.price);
      let lastMinQty = 0;
      let lastPrice = basePrice;
      let newTierErrors = {};

      for (let i = 0; i < sortedTiers.length; i++) {
        const t = sortedTiers[i];
        const mQty = parseInt(t.minQty || 0);
        const pPrice = parseFloat(t.price || 0);

        if (!t.minQty) newTierErrors[`tier_${i}_minQty`] = 'Required';
        if (!t.price) newTierErrors[`tier_${i}_price`] = 'Required';

        if (mQty && mQty < 2) {
          newTierErrors[`tier_${i}_minQty`] = 'Must be > 1';
        }

        if (mQty && mQty <= lastMinQty) {
          newTierErrors[`tier_${i}_minQty`] = `Must be > ${lastMinQty}`;
        }

        if (pPrice && pPrice >= basePrice) {
          newTierErrors[`tier_${i}_price`] = `Must be < ₹${basePrice}`;
        }

        if (pPrice && pPrice > lastPrice) {
          newTierErrors[`tier_${i}_price`] = `Price higher than previous tier`;
        }

        lastMinQty = mQty || lastMinQty;
        lastPrice = pPrice || lastPrice;
      }

      if (Object.keys(newTierErrors).length > 0) {
        setTierErrors(newTierErrors);
        Toast.show({ type: 'error', text1: 'Tier Validation Failed', text2: 'Please fix the errors highlighted below.' });
        return;
      }
    }

    setTierErrors({});
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        pricingTiers: sortedTiers.map(t => ({
          minQty: parseInt(t.minQty),
          price: parseFloat(t.price)
        }))
      };

      if (isEdit) {
        await apiClient.patch(`/products/${productId}`, payload);
      } else {
        await apiClient.post('/products', payload);
      }

      Toast.show({
        type: 'success',
        text1: isEdit ? 'Product Updated! ✓' : 'Product Saved! ✓',
        text2: `"${form.name}" is now live in your store.`,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error saving product:', error);
      Toast.show({ type: 'error', text1: 'Save Failed' });
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const uri = await pickImage({ aspect: [4, 3] });
    if (uri) update('image', uri);
  };

  const addTier = () => {
    const lastTier = form.pricingTiers[form.pricingTiers.length - 1];
    const basePrice = parseFloat(form.price || 0);

    let newQty = '';
    let newPrice = '';

    if (lastTier) {
      newQty = (parseInt(lastTier.minQty || 0) + 50).toString();
      newPrice = (parseFloat(lastTier.price || 0) * 0.95).toFixed(0); // Sugest 5% further discount
    } else if (basePrice) {
      newQty = '50';
      newPrice = (basePrice * 0.9).toFixed(0); // Suggest 10% discount for first tier
    }

    setForm(f => ({
      ...f,
      pricingTiers: [...f.pricingTiers, { minQty: newQty, price: newPrice }]
    }));
  };

  const updateTier = (index, key, val) => {
    const newTiers = [...form.pricingTiers];
    newTiers[index][key] = val.replace(/[^0-9.]/g, '');
    setForm(f => ({ ...f, pricingTiers: newTiers }));

    // Clear error inline
    if (tierErrors[`tier_${index}_${key}`]) {
      setTierErrors(prev => {
        const next = { ...prev };
        delete next[`tier_${index}_${key}`];
        return next;
      });
    }
  };

  const removeTier = (index) => {
    setForm(f => ({
      ...f,
      pricingTiers: f.pricingTiers.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <LinearGradient colors={[COLORS.primary, '#1A2C3F']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Listing' : 'New Listing'}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Image Picker */}
        <Text style={styles.sectionLabel}>Product Media</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.8}>
          {form.image ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: form.image }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.removeImg} onPress={() => update('image', null)}>
                <MaterialIcons name="cancel" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderBox}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="add-a-photo" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.imageText}>Upload High-Quality Photo</Text>
              <Text style={styles.imageSub}>Boost sales with clear product shots</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>Basic Information</Text>
          <Field
            label="Product Name *"
            icon="inventory-2"
            value={form.name}
            onChangeText={v => update('name', v)}
            placeholder="Full product name"
            error={errors.name}
          />

          <View style={styles.row}>
            <View style={{ flex: 1.5 }}>
                <Text style={styles.label}>Retail Price ({form.unit || 'Unit'})</Text>
                <View style={[styles.inputRow, errors.price && styles.inputError]}>
                  <MaterialIcons name="currency-rupee" size={16} color={errors.price ? COLORS.error : COLORS.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={form.price}
                    onChangeText={onPriceChange}
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Unit *"
                icon="straighten"
                value={form.unit}
                onChangeText={v => update('unit', v)}
                placeholder="e.g. bag, kg"
                error={errors.unit}
              />
            </View>
          </View>

          <Field
            label="Initial Stock *"
            icon="warehouse"
            value={form.stock}
            onChangeText={v => update('stock', v)}
            placeholder="50"
            keyboardType="numeric"
          />

          <Text style={[styles.label, errors.categoryId && { color: COLORS.error }]}>Select Category *</Text>
          <View style={[styles.categoryGrid, errors.categoryId && styles.gridError]}>
            {categories.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catChip, form.categoryId === c.id && styles.catChipActive]}
                onPress={() => update('categoryId', c.id)}
              >
                <MaterialIcons name={c.icon || 'category'} size={14} color={form.categoryId === c.id ? COLORS.white : COLORS.textMuted} />
                <Text style={[styles.catChipText, form.categoryId === c.id && styles.catChipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}
          <Text style={styles.sectionLabel}>Additional Details</Text>
          <Field
            label="Product Description"
            icon="description"
            value={form.description}
            onChangeText={v => update('description', v)}
            placeholder="Specifications, certifications, grade, etc."
            multiline
            numberOfLines={4}
            error={errors.description}
          />

          <View style={styles.tierSection}>
            <View style={styles.tierHeader}>
              <Text style={styles.sectionLabel}>Wholesale Tiers</Text>
              <TouchableOpacity style={styles.addTierBtn} onPress={addTier}>
                <MaterialIcons name="add-circle" size={18} color={COLORS.primary} />
                <Text style={styles.addTierText}>Add Tier</Text>
              </TouchableOpacity>
            </View>

            {form.pricingTiers.length === 0 ? (
              <View style={styles.emptyTiers}>
                <Text style={styles.emptyTiersText}>No bulk pricing tiers added yet.</Text>
              </View>
            ) : (
              form.pricingTiers.map((tier, idx) => (
                <View key={idx} style={styles.tierRowWrapper}>
                  <View style={styles.tierRow}>
                    <View style={{ flex: 1.2 }}>
                      <TextInput
                        style={[styles.tierInput, tierErrors[`tier_${idx}_minQty`] && styles.inputError]}
                        placeholder="Min Qty"
                        value={tier.minQty.toString()}
                        onChangeText={v => updateTier(idx, 'minQty', v)}
                        keyboardType="numeric"
                      />
                      {tierErrors[`tier_${idx}_minQty`] && <Text style={styles.tierErrorText}>{tierErrors[`tier_${idx}_minQty`]}</Text>}
                    </View>
                    <View style={{ flex: 1.2 }}>
                      <TextInput
                        style={[styles.tierInput, tierErrors[`tier_${idx}_price`] && styles.inputError]}
                        placeholder="Price (₹)"
                        value={tier.price.toString()}
                        onChangeText={v => updateTier(idx, 'price', v)}
                        keyboardType="numeric"
                      />
                      {tierErrors[`tier_${idx}_price`] && <Text style={styles.tierErrorText}>{tierErrors[`tier_${idx}_price`]}</Text>}
                    </View>
                    {tier.price && form.price && parseFloat(tier.price) < parseFloat(form.price) && (
                      <View style={styles.savingsTag}>
                        <Text style={styles.savingsTagText}>
                          -₹{(parseFloat(form.price) - parseFloat(tier.price)).toFixed(0)} ({((parseFloat(form.price) - parseFloat(tier.price)) / parseFloat(form.price) * 100).toFixed(0)}%)
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => removeTier(idx)} style={styles.removeTierBtn}>
                      <MaterialIcons name="remove-circle-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            
            {form.pricingTiers.length > 0 && form.price && (
              <View style={styles.summaryBox}>
                <MaterialIcons name="info-outline" size={14} color={COLORS.primary} />
                <Text style={styles.summaryText}>
                  Buyer pays <Text style={{...FONTS.bold}}>{formatINR(form.price)}</Text> for small orders.
                  {"\n"}At <Text style={{...FONTS.bold}}>{form.pricingTiers[0].minQty || '...'} {form.unit || 'units'}</Text>, the price drops to <Text style={{...FONTS.bold}}>{formatINR(form.pricingTiers[0].price || 0)}</Text>.
                </Text>
              </View>
            )}
            
            <Text style={styles.tierHint}>Example: 100+ units at ₹370 (Base: ₹380)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
        >
          <LinearGradient colors={[COLORS.accent, '#EA580C']} style={styles.gradientBtn}>
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialIcons name={isEdit ? "save" : "publish"} size={22} color={COLORS.white} />
                <Text style={styles.saveBtnText}>{isEdit ? 'Update Listing' : 'Publish Product'}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, icon, multiline, error, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, multiline && styles.inputRowMulti, error && styles.inputError]}>
        <MaterialIcons name={icon} size={16} color={error ? COLORS.error : COLORS.textMuted} style={{ marginRight: 8, marginTop: multiline ? 3 : 0 }} />
        <TextInput style={[styles.input, multiline && styles.inputMulti]} placeholderTextColor="#94A3B8" multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} {...props} />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 60, paddingBottom: 24, paddingHorizontal: SIZES.base,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  headerTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.white },
  body: { paddingHorizontal: SIZES.base, paddingTop: 20, paddingBottom: 60 },
  sectionLabel: { fontSize: 13, ...FONTS.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 4 },
  imagePicker: {
    height: 180, backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
    overflow: 'hidden', marginBottom: 24,
  },
  placeholderBox: { alignItems: 'center', gap: 6 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  imageWrapper: { width: '100%', height: '100%' },
  selectedImage: { width: '100%', height: '100%' },
  removeImg: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.white, borderRadius: 12, ...SHADOWS.sm },
  imageText: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },
  imageSub: { fontSize: 12, color: COLORS.textMuted },
  formCard: { gap: 16 },
  row: { flexDirection: 'row', gap: 16 },
  fieldWrap: { marginBottom: 6 },
  label: { fontSize: 13, ...FONTS.semiBold, color: COLORS.textPrimary, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0',
  },
  inputRowMulti: { alignItems: 'flex-start', paddingTop: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, color: COLORS.textPrimary, ...FONTS.medium },
  inputMulti: { minHeight: 100 },
  inputError: { borderColor: COLORS.error, backgroundColor: '#FFF5F5' },
  errorText: { color: COLORS.error, fontSize: 11, ...FONTS.medium, marginTop: 4, marginLeft: 4 },
  gridError: { padding: 4, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: RADIUS.md },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 13, ...FONTS.semiBold, color: COLORS.textSecondary },
  catChipTextActive: { color: COLORS.white },
  saveBtn: { borderRadius: RADIUS.lg, ...SHADOWS.lg, marginTop: 32, overflow: 'hidden' },
  gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  saveBtnText: { fontSize: 16, ...FONTS.bold, color: COLORS.white },

  /* Tier Management */
  tierSection: { marginTop: 12, paddingBottom: 10 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addTierBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addTierText: { fontSize: 12, ...FONTS.bold, color: COLORS.primary },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tierRowWrapper: { marginBottom: 12 },
  tierInput: {
    backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, ...FONTS.medium, color: COLORS.textPrimary
  },
  removeTierBtn: { padding: 4, height: 40, justifyContent: 'center' },
  tierErrorText: { color: COLORS.error, fontSize: 10, ...FONTS.bold, marginTop: 4, marginLeft: 4 },
  savingsTag: { backgroundColor: COLORS.success + '15', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, position: 'absolute', right: 40, top: 4 },
  savingsTagText: { color: COLORS.success, fontSize: 9, ...FONTS.extraBold },
  summaryBox: { backgroundColor: '#F0F9FF', padding: 12, borderRadius: 12, marginTop: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  summaryText: { fontSize: 11, color: '#0369A1', lineHeight: 16, flex: 1 },
  emptyTiers: { padding: 16, backgroundColor: '#F1F5F9', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  emptyTiersText: { fontSize: 12, color: COLORS.textMuted, ...FONTS.medium },
  tierHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 8, fontStyle: 'italic' },
});
