import { supabase } from './supabase';
import type { User, UserRole } from '@types/database.types';

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: UserRole;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUp({ email, password, full_name, phone, role = 'customer' }: SignUpData) {
    // Pass metadata — the DB trigger handle_new_user() creates the users row automatically
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone, role },
        emailRedirectTo: 'foodorax://auth/callback',
      },
    });
    if (error) throw error;
    return data;
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
