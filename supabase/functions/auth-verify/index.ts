import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key-change-in-production';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No valid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    const payload = await verify(token, JWT_SECRET);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if session exists and is valid
    const { data: session } = await supabaseClient
      .from('user_sessions')
      .select('*')
      .eq('token', token)
      .eq('user_id', payload.userId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get current user data
    const { data: user } = await supabaseClient
      .from('users')
      .select('id, username, full_name, role')
      .eq('id', payload.userId)
      .single();

    return new Response(
      JSON.stringify({ 
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid token', valid: false }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})