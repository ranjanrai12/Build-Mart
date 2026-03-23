import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { OrderProvider } from './src/context/OrderContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { ReviewProvider } from './src/context/ReviewContext';
import { LocationProvider } from './src/context/LocationContext';
import { QuoteProvider } from './src/context/QuoteContext';
import { AddressProvider } from './src/context/AddressContext';
import { LogisticsProvider } from './src/context/LogisticsContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';

const linking = {
  prefixes: ['buildmart://', 'https://buildmart.com'],
  config: {
    screens: {
      BuyerMain: {
        screens: {
          Home: 'home',
          Cart: 'cart',
          Orders: 'orders',
          Profile: 'profile',
        },
      },
      ProductDetail: 'product/:productId',
      SellerProfile: 'seller/:sellerId',
      ProductList: 'products',
      Checkout: 'checkout',
      OrderSuccess: 'order-success',
      OrderDetail: 'order-detail/:orderId',
      SellerMain: 'seller-dashboard',
    },
  },
};

export default function App() {
  return (
    <>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <OrderProvider>
              <WishlistProvider>
                <ReviewProvider>
                  <NotificationProvider>
                    <QuoteProvider>
                      <AddressProvider>
                        <LogisticsProvider>
                          <NavigationContainer linking={linking}>
                            <AppNavigator />
                          </NavigationContainer>
                        </LogisticsProvider>
                      </AddressProvider>
                    </QuoteProvider>
                  </NotificationProvider>
                </ReviewProvider>
              </WishlistProvider>
            </OrderProvider>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
      <Toast />
    </>
  );
}
