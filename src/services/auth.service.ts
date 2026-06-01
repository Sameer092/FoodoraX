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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone, role },
      },
    });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        full_name,
        phone,
        role,
      });
      if (profileError) throw profileError;

      if (role === 'rider') {
        await supabase.from('riders').insert({ id: data.user.id });
      }
    }
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

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) return null;
    return data as User;
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
