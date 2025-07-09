import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
import { create, verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts"

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
    const { username, password } = await req.json();
    
    console.log('Login request for username:', username);

    // Validate input
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find user by username
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create JWT token
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const token = await create(
      { alg: "HS256", typ: "JWT" },
      payload,
      JWT_SECRET
    );

    // Store session in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await supabaseClient
      .from('user_sessions')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString()
      });

    console.log('User logged in successfully:', user.id);

    return new Response(
      JSON.stringify({ 
        message: 'Login successful',
        token,
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
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error during login' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})