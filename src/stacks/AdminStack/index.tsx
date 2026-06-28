import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboard from '@routes/Admin/Dashboard';
import ManageRestaurants from '@routes/Admin/ManageRestaurants';
import ManageRiders from '@routes/Admin/ManageRiders';
import ManageUsers from '@routes/Admin/ManageUsers';
import AdminOrders from '@routes/Admin/AdminOrders';
import PlatformSettings from '@routes/Admin/PlatformSettings';

const Stack = createNativeStackNavigator();

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="ManageRestaurants" component={ManageRestaurants} />
      <Stack.Screen name="ManageRiders" component={ManageRiders} />
      <Stack.Screen name="ManageUsers" component={ManageUsers} />
      <Stack.Screen name="AdminOrders" component={AdminOrders} />
      <Stack.Screen name="PlatformSettings" component={PlatformSettings} />
    </Stack.Navigator>
  );
}

export default AdminStack;
