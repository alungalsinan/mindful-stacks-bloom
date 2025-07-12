import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
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
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verify(token, JWT_SECRET);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify supervisor role
    const { data: user } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', payload.userId)
      .single();

    if (!user || user.role !== 'supervisor') {
      return new Response(
        JSON.stringify({ error: 'Access denied. Supervisor role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, studentId, data } = await req.json();

    switch (action) {
      case 'getAllStudents':
        const { data: students } = await supabaseClient
          .from('users')
          .select('id, username, full_name, role, created_at')
          .eq('role', 'student')
          .order('created_at', { ascending: false });

        return new Response(
          JSON.stringify({ students }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'getStudentDetails':
        const { data: student } = await supabaseClient
          .from('users')
          .select('id, username, full_name, role, created_at, password_hash')
          .eq('id', studentId)
          .eq('role', 'student')
          .single();

        if (!student) {
          return new Response(
            JSON.stringify({ error: 'Student not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get circulation data
        const { data: circulation } = await supabaseClient
          .from('circulation')
          .select(`
            id, status, checkout_date, due_date, return_date,
            books(title, author_id, authors(name))
          `)
          .eq('patron_id', studentId);

        // Get reading stats
        const { data: stats } = await supabaseClient
          .from('reader_stats')
          .select('*')
          .eq('user_id', studentId);

        return new Response(
          JSON.stringify({ 
            student: {
              ...student,
              password: student.password_hash // Include password hash for supervisor
            },
            circulation,
            stats
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'updateStudent':
        const updateData: any = {};
        
        if (data.username) {
          // Check if username is already taken by another user
          const { data: existingUser } = await supabaseClient
            .from('users')
            .select('id')
            .eq('username', data.username)
            .neq('id', studentId)
            .single();

          if (existingUser) {
            return new Response(
              JSON.stringify({ error: 'Username already exists' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          updateData.username = data.username;
        }

        if (data.fullName) {
          updateData.full_name = data.fullName;
        }

        if (data.password) {
          updateData.password_hash = await bcrypt.hash(data.password);
        }

        const { data: updatedStudent, error: updateError } = await supabaseClient
          .from('users')
          .update(updateData)
          .eq('id', studentId)
          .eq('role', 'student')
          .select('id, username, full_name, role')
          .single();

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to update student' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update profile if exists
        if (data.username || data.fullName) {
          await supabaseClient
            .from('profiles')
            .update({
              email: data.username ? `${data.username}@library.local` : undefined,
              full_name: data.fullName || undefined
            })
            .eq('id', studentId);
        }

        return new Response(
          JSON.stringify({ student: updatedStudent }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'deleteStudent':
        // Delete user sessions first
        await supabaseClient
          .from('user_sessions')
          .delete()
          .eq('user_id', studentId);

        // Delete user (cascade will handle profiles)
        const { error: deleteError } = await supabaseClient
          .from('users')
          .delete()
          .eq('id', studentId)
          .eq('role', 'student');

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: 'Failed to delete student' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ message: 'Student deleted successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'resetPassword':
        if (!data.newPassword) {
          return new Response(
            JSON.stringify({ error: 'New password is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const hashedPassword = await bcrypt.hash(data.newPassword);
        
        const { error: resetError } = await supabaseClient
          .from('users')
          .update({ password_hash: hashedPassword })
          .eq('id', studentId)
          .eq('role', 'student');

        if (resetError) {
          return new Response(
            JSON.stringify({ error: 'Failed to reset password' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Invalidate all sessions for this user
        await supabaseClient
          .from('user_sessions')
          .delete()
          .eq('user_id', studentId);

        return new Response(
          JSON.stringify({ message: 'Password reset successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Supervisor management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})