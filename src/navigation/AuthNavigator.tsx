import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@types/navigation.types';
import { LoginScreen } from '@features/auth/screens/LoginScreen';
import { SignUpScreen } from '@features/auth/screens/SignUpScreen';
import { ForgotPasswordScreen } from '@features/auth/screens/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
