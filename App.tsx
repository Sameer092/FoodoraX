import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme, LogBox } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { RootNavigator } from './src/navigation';

// Suppress known harmless dev-only warnings so the on-screen toasts stay clean.
// These never appear in a production build.
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'expo-notifications',
  'Constants.platform.ios.model',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'AsyncStorage has been extracted',
  'Value being stored in SecureStore is larger than 2048 bytes',
]);

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
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
          <FlashMessage position="top" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
