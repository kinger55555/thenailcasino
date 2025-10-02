// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid code' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Validate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Find trade link
    const { data: link, error: linkErr } = await supabase
      .from('trade_links')
      .select('*')
      .eq('code', code)
      .single();

    if (linkErr || !link) {
      return new Response(JSON.stringify({ error: 'Trade link not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (link.claimed_by) {
      return new Response(JSON.stringify({ error: 'Already claimed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Read original nail (service role bypasses RLS)
    const { data: original, error: originalErr } = await supabase
      .from('user_nails')
      .select('id, nail_id, is_dream')
      .eq('id', link.user_nail_id)
      .single();

    if (originalErr || !original) {
      return new Response(JSON.stringify({ error: 'Original nail not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Insert new nail for recipient
    const { error: insertErr } = await supabase
      .from('user_nails')
      .insert({
        user_id: user.id,
        nail_id: original.nail_id,
        is_dream: original.is_dream,
      });

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Delete original from sender
    const { error: deleteErr } = await supabase
      .from('user_nails')
      .delete()
      .eq('id', original.id);

    if (deleteErr) {
      return new Response(JSON.stringify({ error: deleteErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Mark link as claimed
    const { error: updateErr } = await supabase
      .from('trade_links')
      .update({ claimed_by: user.id, claimed_at: new Date().toISOString() })
      .eq('id', link.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});