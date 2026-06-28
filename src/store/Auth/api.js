import { supabase } from '@library/supabase';

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp({ email, password, full_name, phone, role, restaurant, rider }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone, role }, emailRedirectTo: 'foodorax://auth/callback' },
  });
  if (error) throw error;

  if (data.session && data.user) {
    await ensureProfile(data.user.id, { email, full_name, phone, role });

    if (role === 'restaurant_owner' && restaurant) {
      const { data: created } = await supabase
        .from('restaurants')
        .insert({
          owner_id: data.user.id,
          name: restaurant.restaurant_name,
          cuisine_type: restaurant.cuisine_type.split(',').map((c) => c.trim()).filter(Boolean),
          address: restaurant.address,
          city: restaurant.city,
          is_open: true,
          is_verified: false,
        })
        .select()
        .single();
      if (created) {
        await supabase.from('menu_categories').insert({ restaurant_id: created.id, name: 'Main Menu', sort_order: 0 });
      }
    }

    if (role === 'rider' && rider) {
      await supabase.from('riders').upsert({
        id: data.user.id,
        vehicle_type: rider.vehicle_type,
        vehicle_number: rider.vehicle_number,
        license_number: rider.license_number,
        is_verified: false,
      });
    }
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function ensureProfile(userId, profile) {
  await supabase.from('users').upsert(
    {
      id: userId,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      role: profile.role,
    },
    { onConflict: 'id' },
  );
}

export async function getCurrentUser() {
  const { data: auth } = await supabase.auth.getUser();
  const authUser = auth?.user;
  if (!authUser) return null;

  const { data } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
  if (data) return data;

  const meta = authUser.user_metadata || {};
  const { data: created } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      email: authUser.email,
      full_name: meta.full_name || 'User',
      phone: meta.phone || null,
      role: meta.role || 'customer',
    })
    .select()
    .single();

  if (created && (meta.role === 'rider')) {
    await supabase.from('riders').upsert({ id: authUser.id });
  }
  return created || {
    id: authUser.id,
    email: authUser.email,
    full_name: meta.full_name || 'User',
    phone: meta.phone,
    role: meta.role || 'customer',
  };
}

export async function forgotPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'foodorax://reset-password',
  });
  if (error) throw error;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
