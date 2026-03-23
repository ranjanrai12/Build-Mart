import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import { useAuth } from '../../../context/AuthContext';
import { useOrders } from '../../../context/OrderContext';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import Avatar from '../../../components/shared/Avatar';
import useImagePicker from '../../../hooks/useImagePicker';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const { buyerOrders, sellerOrders } = useOrders();
  const { pickImage } = useImagePicker();
  const [showLogout, setShowLogout] = useState(false);
  const myOrders = (user?.role === 'seller' ? sellerOrders(user.id) : buyerOrders(user?.id))
    .filter(o => o.status !== 'Rejected');

  const handleLogout = () => {
    setShowLogout(true);
  };

  const handlePickImage = async () => {
    const uri = await pickImage({ aspect: [1, 1] });
    if (uri) {
      updateUser({ image: uri });
      Toast.show({
        type: 'success',
        text1: 'Profile Photo Updated ✓',
      });
    }
  };

  const handleMenuPress = (label) => {
    switch (label) {
      case 'Edit Profile':
        navigation.navigate('EditProfile');
        break;
      case 'Saved Addresses':
        navigation.navigate('SavedAddresses');
        break;
      case 'Notifications':
        navigation.navigate('Notifications');
        break;
      case 'Help & Support':
        navigation.navigate('HelpSupport');
        break;
      case 'My Inquiries':
        navigation.navigate('BuyerInquiries');
        break;
      case 'Rate the App':
        Toast.show({
          type: 'info',
          text1: 'Rate the App',
          text2: 'Rating will be available once we launch on the App Store!',
        });
        break;
      case 'About BuildMart':
        navigation.navigate('About');
        break;
      default:
        break;
    }
  };

  const menuItems = [
    { icon: 'person', label: 'Edit Profile', sub: 'Update your information' },
    { icon: 'location-on', label: 'Saved Addresses', sub: 'Manage delivery addresses' },
    { icon: 'notifications', label: 'Notifications', sub: 'Manage alerts' },
    { icon: 'help-outline', label: 'Help & Support', sub: 'FAQs, contact us' },
    user?.role === 'buyer' && { icon: 'psychology-alt', label: 'My Inquiries', sub: 'B2B procurement requests' },
    { icon: 'star', label: 'Rate the App', sub: 'Share your feedback' },
  ].filter(Boolean);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.header} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={styles.avatarContainer}>
            <Avatar uri={user?.image} name={user?.name} size={90} />
            <View style={styles.editBadge}>
              <MaterialIcons name="camera-alt" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.phone}>+91 {user?.phone || '9876543210'}</Text>
          <View style={styles.roleBadge}>
            <MaterialIcons name={user?.role === 'seller' ? 'store' : 'shopping-bag'} size={14} color={COLORS.white} />
            <Text style={styles.roleText}>{user?.role === 'seller' ? 'Seller Account' : 'Buyer Account'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{myOrders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>₹{myOrders.reduce((s, o) => s + o.total, 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>{user?.role === 'seller' ? 'Revenue' : 'Spent'}</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={() => handleMenuPress(item.label)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <MaterialIcons name={item.icon} size={20} color={COLORS.accent} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmModal
        visible={showLogout}
        title="Logout Account?"
        message="Are you sure you want to log out? You'll need to sign in again to access your account."
        onConfirm={logout}
        onCancel={() => setShowLogout(false)}
        confirmText="Logout"
        isDestructive
        icon="logout"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: {
    alignItems: 'center', backgroundColor: COLORS.header,
    paddingTop: 70, paddingBottom: 60,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    ...SHADOWS.lg,
  },
  avatarContainer: {
    marginBottom: SIZES.md,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: COLORS.header,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, ...FONTS.bold, color: COLORS.white, marginBottom: 4 },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: SIZES.md },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  roleText: { fontSize: 13, ...FONTS.bold, color: COLORS.white },
  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    marginHorizontal: SIZES.base, marginTop: -30,
    borderRadius: RADIUS.lg, ...SHADOWS.md, marginBottom: SIZES.base,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: SIZES.md },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.divider },
  statValue: { fontSize: 20, ...FONTS.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  menuCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    marginHorizontal: SIZES.base, marginBottom: SIZES.lg, ...SHADOWS.sm,
    overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SIZES.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  menuIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.1)', alignItems: 'center', justifyContent: 'center',
    marginRight: SIZES.md,
  },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, ...FONTS.semiBold, color: COLORS.textPrimary },
  menuSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: SIZES.base, backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, paddingVertical: 18, ...SHADOWS.sm,
    borderWidth: 1.5, borderColor: '#FADBD8',
  },
  logoutText: { fontSize: 15, ...FONTS.semiBold, color: COLORS.error },
});
