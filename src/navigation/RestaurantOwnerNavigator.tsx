import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RestaurantOwnerStackParamList } from '@types/navigation.types';
import { OwnerDashboardScreen } from '@features/restaurant-management/screens/OwnerDashboardScreen';
import { MenuManagementScreen } from '@features/restaurant-management/screens/MenuManagementScreen';
import { AddMenuItemScreen } from '@features/restaurant-management/screens/AddMenuItemScreen';
import { EditMenuItemScreen } from '@features/restaurant-management/screens/EditMenuItemScreen';
import { OrderManagementScreen } from '@features/restaurant-management/screens/OrderManagementScreen';
import { RestaurantSettingsScreen } from '@features/restaurant-management/screens/RestaurantSettingsScreen';
import { CreateRestaurantScreen } from '@features/restaurant-management/screens/CreateRestaurantScreen';
import { AnalyticsScreen } from '@features/restaurant-management/screens/AnalyticsScreen';
import { OwnerProfileScreen } from '@features/profile/screens/OwnerProfileScreen';
import { OrderDetailScreen } from '@features/orders/screens/OrderDetailScreen';

const Stack = createNativeStackNavigator<RestaurantOwnerStackParamList>();

export function RestaurantOwnerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
      <Stack.Screen name="MenuManagement" component={MenuManagementScreen} />
      <Stack.Screen name="AddMenuItem" component={AddMenuItemScreen} />
      <Stack.Screen name="EditMenuItem" component={EditMenuItemScreen} />
      <Stack.Screen name="OrderManagement" component={OrderManagementScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="RestaurantSettings" component={RestaurantSettingsScreen} />
      <Stack.Screen name="CreateRestaurant" component={CreateRestaurantScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Profile" component={OwnerProfileScreen} />
    </Stack.Navigator>
  );
}
