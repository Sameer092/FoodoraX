export const Config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://your-project.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'your-anon-key',
  },
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_your_key',
  },
  googleMaps: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  },
  app: {
    name: 'FoodoraX',
    version: '1.0.0',
    taxRate: 0.05,
    defaultPageSize: 20,
    maxCartItems: 50,
    locationUpdateInterval: 5000,
    orderRefreshInterval: 30000,
  },
  storage: {
    buckets: {
      avatars: 'avatars',
      restaurants: 'restaurants',
      menuItems: 'menu-items',
      reviews: 'reviews',
    },
    maxFileSizeMb: 10,
  },
} as const;
