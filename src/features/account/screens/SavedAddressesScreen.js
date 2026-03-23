import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAddresses } from '../../../context/AddressContext';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';

export default function SavedAddressesScreen({ navigation }) {
  const { addresses, loading, deleteAddress, setDefaultAddress } = useAddresses();
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const confirmAndRemove = async () => {
    const id = confirmDelete;
    await deleteAddress(id);
    setConfirmDelete(null);
  };

  const handleEdit = (item) => {
    navigation.navigate('AddAddress', { editData: item });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBox}>
          <MaterialIcons name={item.type === 'Home' ? 'home' : 'business'} size={18} color={COLORS.accent} />
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
        {item.isDefault ? (
          <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>
        ) : (
          <TouchableOpacity onPress={() => setDefaultAddress(item.id)}>
            <Text style={styles.setDefaultText}>Set as Default</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.addressLine}>{item.address}</Text>
      <Text style={styles.cityLine}>{item.city}, {item.state} {item.pin}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <Text style={[styles.actionText, { color: COLORS.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading && !addresses.length ? (
        <View style={styles.empty}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="location-off" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No saved addresses found.</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddAddress', { editData: null })}>
          <MaterialIcons name="add" size={20} color={COLORS.white} />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      </View>
      <ConfirmModal
        visible={!!confirmDelete}
        title="Delete Address?"
        message="Are you sure you want to remove this address? This action cannot be undone."
        onConfirm={confirmAndRemove}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Delete"
        isDestructive
        icon="delete-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.header,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20, paddingHorizontal: SIZES.base,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    ...SHADOWS.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.white },
  list: { padding: SIZES.base },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SIZES.base, marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  typeBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { fontSize: 15, ...FONTS.bold, color: COLORS.textPrimary },
  defaultBadge: { backgroundColor: '#EAFDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  defaultText: { fontSize: 11, ...FONTS.semiBold, color: COLORS.success },
  setDefaultText: { fontSize: 12, color: COLORS.primary, ...FONTS.semiBold },
  addressLine: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4, lineHeight: 20 },
  cityLine: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SIZES.sm },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SIZES.sm, marginTop: 4, gap: SIZES.md },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  actionText: { fontSize: 14, ...FONTS.semiBold, color: COLORS.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, ...FONTS.medium },
  footer: { padding: SIZES.base, paddingBottom: Platform.OS === 'ios' ? 32 : 20, backgroundColor: COLORS.white, ...SHADOWS.up },
  addBtn: {
    flexDirection: 'row', backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
    height: 52, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  addBtnText: { fontSize: 16, ...FONTS.bold, color: COLORS.white },
});
