import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotificationPayload = await req.json();

    // Store notification in DB
    await supabase.from('notifications').insert({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sent_at: new Date().toISOString(),
    });

    // Get push token
    const { data: user } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', payload.userId)
      .single();

    if (user?.push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.push_token,
          sound: 'default',
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
          priority: 'high',
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
