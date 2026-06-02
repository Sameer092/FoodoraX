import { supabase } from './supabase';
import type { User, UserRole } from '@types/database.types';

export interface RestaurantSignUpData {
  restaurant_name: string;
  cuisine_type: string;
  address: string;
  city: string;
}

export interface RiderSignUpData {
  vehicle_type: string;
  vehicle_number?: string;
  license_number?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: UserRole;
  restaurant?: RestaurantSignUpData;
  rider?: RiderSignUpData;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUp({ email, password, full_name, phone, role = 'customer', restaurant, rider }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone, role },
        emailRedirectTo: 'foodorax://auth/callback',
      },
    });
    if (error) throw error;

    // If signup returned a session (email confirmation OFF), we can create the
    // role-specific records right away. Otherwise they're created on first login.
    if (data.session && data.user) {
      await authService.ensureProfile(data.user.id, { email, full_name, phone, role });

      if (role === 'restaurant_owner' && restaurant) {
        await supabase.from('restaurants').insert({
          owner_id: data.user.id,
          name: restaurant.restaurant_name,
          cuisine_type: restaurant.cuisine_type.split(',').map((c) => c.trim()).filter(Boolean),
          address: restaurant.address,
          city: restaurant.city,
          is_open: true,
          is_verified: false, // pending admin approval
        });
      }

      if (role === 'rider' && rider) {
        await supabase.from('riders').upsert({
          id: data.user.id,
          vehicle_type: rider.vehicle_type,
          vehicle_number: rider.vehicle_number,
          license_number: rider.license_number,
          is_verified: false, // pending admin approval
        });
      }
    }

    return data;
  },

  async ensureProfile(
    userId: string,
    profile: { email: string; full_name: string; phone?: string; role: UserRole }
  ) {
    await supabase.from('users').upsert({
      id: userId,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      role: profile.role,
    }, { onConflict: 'id' });
  },

  async signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'foodorax://reset-password',
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'foodorax://auth/callback' },
    });
    if (error) throw error;
    return data;
  },

  async signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: 'foodorax://auth/callback' },
    });
    if (error) throw error;
    return data;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try to read the profile row
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) return data as User;

    // Row missing (trigger didn't run yet) — create it from auth metadata.
    // This makes the app work even without the DB trigger configured.
    const meta = (user.user_metadata ?? {}) as Record<string, string>;
    const { data: created, error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email ?? meta.email ?? '',
        full_name: meta.full_name ?? 'User',
        phone: meta.phone ?? null,
        role: (meta.role as UserRole) ?? 'customer',
      })
      .select()
      .single();

    if (createError) {
      // Fallback: return a minimal profile from auth so the app still works
      return {
        id: user.id,
        email: user.email ?? '',
        full_name: meta.full_name ?? 'User',
        phone: meta.phone,
        role: (meta.role as UserRole) ?? 'customer',
        is_active: true,
        created_at: user.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User;
    }

    // Create rider profile if needed
    if ((meta.role as UserRole) === 'rider') {
      await supabase.from('riders').insert({ id: user.id });
    }

    return created as User;
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },

  async updatePushToken(userId: string, token: string) {
    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);
    if (error) throw error;
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
