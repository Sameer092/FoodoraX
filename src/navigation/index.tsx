import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@store/auth.store';
import { AuthNavigator } from './AuthNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { RestaurantOwnerNavigator } from './RestaurantOwnerNavigator';
import { RiderNavigator } from './RiderNavigator';
import { AdminNavigator } from './AdminNavigator';
import type { RootStackParamList } from '@types/navigation.types';
import { Colors } from '@constants/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  useAuth();
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary[500] }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user.role === 'admin' ? (
          <Stack.Screen name="Admin" component={AdminNavigator} />
        ) : user.role === 'restaurant_owner' ? (
          <Stack.Screen name="RestaurantOwner" component={RestaurantOwnerNavigator} />
        ) : user.role === 'rider' ? (
          <Stack.Screen name="Rider" component={RiderNavigator} />
        ) : (
          <Stack.Screen name="Customer" component={CustomerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
