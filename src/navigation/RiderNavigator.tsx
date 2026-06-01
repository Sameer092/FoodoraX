import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RiderStackParamList } from '@types/navigation.types';
import { RiderDashboardScreen } from '@features/rider/screens/RiderDashboardScreen';
import { ActiveDeliveryScreen } from '@features/rider/screens/ActiveDeliveryScreen';
import { EarningsScreen } from '@features/rider/screens/EarningsScreen';
import { RiderProfileScreen } from '@features/rider/screens/RiderProfileScreen';

const Stack = createNativeStackNavigator<RiderStackParamList>();

export function RiderNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RiderDashboard" component={RiderDashboardScreen} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
      <Stack.Screen name="EarningsHistory" component={EarningsScreen} />
      <Stack.Screen name="RiderProfile" component={RiderProfileScreen} />
    </Stack.Navigator>
  );
}
