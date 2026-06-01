import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useColorScheme } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { RootNavigator } from './src/navigation';
import { Config } from './src/constants/config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StripeProvider publishableKey={Config.stripe.publishableKey}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <RootNavigator />
            <FlashMessage position="top" />
          </StripeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
