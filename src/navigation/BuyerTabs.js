import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { useCart } from '../context/CartContext';

import HomeScreen from '../features/marketplace/screens/HomeScreen';
import CartScreen from '../features/marketplace/screens/CartScreen';
import OrderHistoryScreen from '../features/account/screens/OrderHistoryScreen';
import ProfileScreen from '../features/account/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function CartIcon({ color, size }) {
  const { itemCount } = useCart();
  return (
    <View>
      <MaterialIcons name="shopping-cart" size={size} color={color} />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function BuyerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: '#B0B8C1',
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color }) => <CartIcon color={color} size={26} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderHistoryScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialIcons name="receipt" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={26} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 20,
  },
  label: {
    ...FONTS.bold,
    fontSize: 10,
    marginBottom: 0,
    marginTop: -4,
  },
  badge: {
    position: 'absolute',
    top: -4, right: -8,
    backgroundColor: COLORS.accent,
    borderRadius: 9,
    minWidth: 17, height: 17,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    ...FONTS.extraBold,
  },
});
