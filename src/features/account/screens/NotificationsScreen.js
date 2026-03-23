import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, StatusBar, Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../../context/NotificationContext';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import EmptyState from '../../../components/shared/EmptyState';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { notifications, loading, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();

  useEffect(() => {
    refreshNotifications();
  }, []);

  const getIconData = (type) => {
    switch (type) {
      case 'QUOTE_COUNTER': return { icon: 'local-offer', color: '#CA8A04', bg: '#FEF08A' };
      case 'QUOTE_ACCEPTED': return { icon: 'check-circle', color: '#16A34A', bg: '#DCFCE7' };
      case 'QUOTE_DECLINED': return { icon: 'cancel', color: '#DC2626', bg: '#FEE2E2' };
      case 'ORDER_PLACED': return { icon: 'shopping-bag', color: '#2563EB', bg: '#DBEAFE' };
      default: return { icon: 'notifications', color: COLORS.primary, bg: '#F0F9FF' };
    }
  };

  const handlePress = async (item) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    
    // Navigate based on type
    if (item.type.startsWith('QUOTE_')) {
      if (user?.role === 'seller') {
        navigation.navigate('SellerMain', { screen: 'Dashboard' }); // Or wherever you handle seller quotes
      } else {
        navigation.navigate('BuyerInquiries'); 
      }
    } else if (item.type === 'ORDER_PLACED') {
      navigation.navigate('SellerOrders');
    }
  };

  const renderItem = ({ item }) => {
    const { icon, color, bg } = getIconData(item.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: bg }]}>
          <MaterialIcons name={icon} size={24} color={color} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.timeStr}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <MaterialIcons name="done-all" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-none"
            title="No Notifications"
            message="You're all caught up! We'll alert you here when there's an update."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 25,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOWS.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 12 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 20, ...FONTS.bold, color: COLORS.white },
  markAllBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 40 },
  
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  unreadCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BAE6FD',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    ...FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  unreadText: {
    ...FONTS.bold,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  timeStr: {
    fontSize: 11,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 12,
  },
});
