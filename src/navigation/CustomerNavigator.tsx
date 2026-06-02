import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import type { CustomerStackParamList, CustomerTabParamList } from '@types/navigation.types';
import { HomeScreen } from '@features/home/screens/HomeScreen';
import { SearchScreen } from '@features/restaurants/screens/SearchScreen';
import { OrdersScreen } from '@features/orders/screens/OrdersScreen';
import { FavoritesScreen } from '@features/favorites/screens/FavoritesScreen';
import { ProfileScreen } from '@features/profile/screens/ProfileScreen';
import { RestaurantDetailScreen } from '@features/restaurants/screens/RestaurantDetailScreen';
import { CartScreen } from '@features/cart/screens/CartScreen';
import { CheckoutScreen } from '@features/checkout/screens/CheckoutScreen';
import { OrderTrackingScreen } from '@features/orders/screens/OrderTrackingScreen';
import { OrderDetailScreen } from '@features/orders/screens/OrderDetailScreen';
import { NotificationsScreen } from '@features/notifications/screens/NotificationsScreen';
import { EditProfileScreen } from '@features/profile/screens/EditProfileScreen';
import { AddAddressScreen } from '@features/profile/screens/AddAddressScreen';
import { ReviewOrderScreen } from '@features/orders/screens/ReviewOrderScreen';
import { ChatScreen } from '@features/orders/screens/ChatScreen';
import { useCartStore } from '@store/cart.store';
import { useAppStore } from '@store/app.store';
import { Colors } from '@constants/colors';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<CustomerStackParamList>();

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.15 : 1) }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={name as any}
        size={24}
        color={focused ? Colors.primary[500] : Colors.light.textTertiary}
      />
    </Animated.View>
  );
}

function CustomerTabs() {
  const itemCount = useCartStore((s) => s.getItemCount());
  const unread = useAppStore((s) => s.unreadNotifications);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={{ flex: 1 }} />
        ),
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.light.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'search' : 'search-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'receipt' : 'receipt-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'heart' : 'heart-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'person' : 'person-outline'} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Cart" component={CartScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="ReviewOrder" component={ReviewOrderScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
