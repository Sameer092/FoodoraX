export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const TAX_RATE = 0.05;
export const DEFAULT_PAGE_SIZE = 20;

export const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export const NOMINATIM = 'https://nominatim.openstreetmap.org';
export const OSRM = 'https://router.project-osrm.org';
