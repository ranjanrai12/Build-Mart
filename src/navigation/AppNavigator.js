import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import OtpScreen from '../features/auth/screens/OtpScreen';
import BuyerTabs from './BuyerTabs';
import SellerTabs from './SellerTabs';
import OnboardingScreen from '../features/auth/screens/OnboardingScreen';
import ProductDetailScreen from '../features/marketplace/screens/ProductDetailScreen';
import SellerProfileScreen from '../features/marketplace/screens/SellerProfileScreen';
import ProductListScreen from '../features/marketplace/screens/ProductListScreen';
import CheckoutScreen from '../features/marketplace/screens/CheckoutScreen';
import OrderSuccessScreen from '../features/marketplace/screens/OrderSuccessScreen';
import OrderDetailScreen from '../features/marketplace/screens/OrderDetailScreen';
import AddProductScreen from '../features/seller/screens/AddProductScreen';
import LogisticsHubScreen from '../features/seller/screens/LogisticsHubScreen';
import SellerOrderDetailScreen from '../features/seller/screens/SellerOrderDetailScreen';
import EditStoreScreen from '../features/seller/screens/EditStoreScreen';
import EditProfileScreen from '../features/account/screens/EditProfileScreen';
import SavedAddressesScreen from '../features/account/screens/SavedAddressesScreen';
import AddAddressScreen from '../features/account/screens/AddAddressScreen';
import NotificationsScreen from '../features/account/screens/NotificationsScreen';
import HelpSupportScreen from '../features/account/screens/HelpSupportScreen';
import AboutScreen from '../features/account/screens/AboutScreen';
import BuyerInquiriesScreen from '../features/account/screens/BuyerInquiriesScreen';

import QuoteReviewScreen from '../features/seller/screens/QuoteReviewScreen';
import AdvancedAnalyticsScreen from '../features/seller/screens/AdvancedAnalyticsScreen';
import SellerInventoryScreen from '../features/seller/screens/SellerInventoryScreen';

const Stack = createNativeStackNavigator();

import WriteReviewScreen from '../features/buyer/screens/WriteReviewScreen';

export default function AppNavigator() {
  const { user, loading, hasSeenOnboarding } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasSeenOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
        </>
      ) : (
        <>
          {user.role === 'seller' ? (
            <>
              <Stack.Screen name="SellerMain" component={SellerTabs} />
              <Stack.Screen name="AddProduct" component={AddProductScreen} />
              <Stack.Screen name="LogisticsHub" component={LogisticsHubScreen} />
      <Stack.Screen name="SellerOrderDetail" component={SellerOrderDetailScreen} />
              <Stack.Screen name="EditStore" component={EditStoreScreen} />
              <Stack.Screen name="QuoteReview" component={QuoteReviewScreen} />
              <Stack.Screen name="AdvancedAnalytics" component={AdvancedAnalyticsScreen} />
              <Stack.Screen name="SellerInventory" component={SellerInventoryScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="BuyerMain" component={BuyerTabs} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
              <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
              <Stack.Screen name="ProductList" component={ProductListScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
              <Stack.Screen name="BuyerInquiries" component={BuyerInquiriesScreen} />
            </>
          )}
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
          <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
          <Stack.Screen name="AddAddress" component={AddAddressScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
