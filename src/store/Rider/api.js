import { supabase } from '@library/supabase';

export async function getStatus(riderId) {
  const { data } = await supabase.from('riders').select('status, is_verified').eq('id', riderId).maybeSingle();
  return data || { status: 'offline', is_verified: false };
}

export async function setStatus(riderId, status) {
  const { data, error } = await supabase
    .from('riders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', riderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPayoutRates() {
  const { data } = await supabase
    .from('platform_settings')
    .select('rider_base_pay, rider_per_km')
    .eq('id', 1)
    .maybeSingle();
  return { basePay: Number((data && data.rider_base_pay) || 2), perKm: Number((data && data.rider_per_km) || 0.5) };
}
