import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
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

// REQUIRED for React Native: tie token auto-refresh to app foreground state.
// Without this the access token can expire while the app is open — then every
// query silently returns empty rows (RLS rejects the stale token) until a
// manual reload. Starting/stopping auto-refresh on AppState changes keeps the
// session valid so data never "disappears".
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// The AppState listener only fires on a CHANGE — kick off auto-refresh now for
// the initial cold-start (app is already "active" so the listener won't fire).
supabase.auth.startAutoRefresh();
