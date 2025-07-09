import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'supervisor' | 'staff' | 'student';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signUp: (username: string, password: string, fullName: string, role?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('auth-verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error || !data?.valid) {
        localStorage.removeItem('auth_token');
        setUser(null);
      } else {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Session check error:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { username, password },
      });

      if (error) {
        return { error: error.message || 'Login failed' };
      }

      if (data?.error) {
        return { error: data.error };
      }

      if (data?.token && data?.user) {
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        return {};
      }

      return { error: 'Login failed' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Login failed' };
    }
  };

  const signUp = async (username: string, password: string, fullName: string, role = 'student') => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-signup', {
        body: { username, password, fullName, role },
      });

      if (error) {
        return { error: error.message || 'Signup failed' };
      }

      if (data?.error) {
        return { error: data.error };
      }

      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Signup failed' };
    }
  };

  const signOut = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await supabase.functions.invoke('auth-logout', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useCustomAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useCustomAuth must be used within an AuthProvider');
  }
  return context;
};