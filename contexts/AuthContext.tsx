
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing auth state');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session ? 'exists' : 'none');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('AuthContext: Error getting initial session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthContext: Auth state changed:', _event, session ? 'session exists' : 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('AuthContext: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    console.log('AuthContext: Signing up user:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
        },
      });
      
      if (error) {
        console.error('AuthContext: Sign up error:', error);
      } else {
        console.log('AuthContext: Sign up successful:', data);
      }
      
      return { data, error };
    } catch (error) {
      console.error('AuthContext: Sign up exception:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Signing in user:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('AuthContext: Sign in error:', error);
      } else {
        console.log('AuthContext: Sign in successful:', data);
      }
      
      return { data, error };
    } catch (error) {
      console.error('AuthContext: Sign in exception:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    console.log('AuthContext: Starting sign out process');
    try {
      // First, clear local state immediately for better UX
      console.log('AuthContext: Clearing local state');
      setUser(null);
      setSession(null);
      
      // Then call Supabase signOut
      console.log('AuthContext: Calling Supabase signOut');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthContext: Sign out error:', error);
        throw error;
      }
      
      console.log('AuthContext: Sign out successful');
    } catch (error) {
      console.error('AuthContext: Sign out exception:', error);
      // State is already cleared, so we can still consider this a success from UX perspective
      // But we'll throw the error so the caller can show an alert if needed
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
