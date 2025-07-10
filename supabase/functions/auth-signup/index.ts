import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password, fullName, role = 'student' } = await req.json();
    
    console.log('Signup request for username:', username);

    // Validate input
    if (!username || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Username, password, and full name are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate username format (3-20 characters, alphanumeric + underscore)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Username must be 3-20 characters (letters, numbers, underscore only)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
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

    // Check if username already exists
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Username already exists' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password);

    // Create the user
    const { data: newUser, error: createError } = await supabaseClient
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        full_name: fullName,
        role: role as 'student' | 'staff' | 'supervisor'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create profile entry
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: newUser.id,
        email: `${username}@library.local`, // Placeholder email
        full_name: fullName,
        role: role as 'student' | 'staff' | 'supervisor'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't fail the signup if profile creation fails, just log it
      console.log('Profile creation failed but user was created:', newUser.id);
    }

    console.log('User created successfully:', newUser.id);

    return new Response(
      JSON.stringify({ 
        message: 'User created successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.full_name,
          role: newUser.role
        }
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error during signup' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})