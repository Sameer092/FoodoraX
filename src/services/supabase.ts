import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@constants/config';

// Supabase stores the auth session (a large JWT + refresh token) which exceeds
// expo-secure-store's 2KB limit and triggers a warning. AsyncStorage handles
// large values cleanly and is the storage recommended by Supabase for Expo.
export const supabase = createClient(
  Config.supabase.url,
  Config.supabase.anonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);
