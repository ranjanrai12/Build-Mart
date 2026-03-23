import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

import DashboardScreen from '../features/seller/screens/DashboardScreen';
import ManageProductsScreen from '../features/seller/screens/ManageProductsScreen';
import SellerOrdersScreen from '../features/seller/screens/SellerOrdersScreen';
import ProfileScreen from '../features/account/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { ...FONTS.medium, fontSize: 11, marginBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Products"
        component={ManageProductsScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialIcons name="inventory" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="SellerOrders"
        component={SellerOrdersScreen}
        options={{ tabBarLabel: 'Orders', tabBarIcon: ({ color, size }) => <MaterialIcons name="local-shipping" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="SellerProfile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 70,
    paddingTop: 8,
  },
});
