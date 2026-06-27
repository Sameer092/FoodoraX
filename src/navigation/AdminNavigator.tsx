import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@types/navigation.types';
import { AdminDashboardScreen } from '@features/admin/screens/AdminDashboardScreen';
import { ManageRestaurantsScreen } from '@features/admin/screens/ManageRestaurantsScreen';
import { ManageRidersScreen } from '@features/admin/screens/ManageRidersScreen';
import { ManageUsersScreen } from '@features/admin/screens/ManageUsersScreen';
import { PlatformSettingsScreen } from '@features/admin/screens/PlatformSettingsScreen';
import { AdminOrdersScreen } from '@features/admin/screens/AdminOrdersScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="ManageRestaurants" component={ManageRestaurantsScreen} />
      <Stack.Screen name="ManageRiders" component={ManageRidersScreen} />
      <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
      <Stack.Screen name="PlatformSettings" component={PlatformSettingsScreen} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
    </Stack.Navigator>
  );
}
