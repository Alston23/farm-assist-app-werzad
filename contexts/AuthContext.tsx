
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { router } from 'expo-router';
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
      console.log('AuthContext: Calling Supabase signOut()');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthContext: Sign out error:', error);
        // Even with an error, clear local state and redirect
        setUser(null);
        setSession(null);
        
        // Show error but still redirect
        Alert.alert('Notice', 'You have been signed out.');
        
        // Navigate to auth screen
        setTimeout(() => {
          router.replace('/auth');
        }, 100);
        
        return;
      }
      
      console.log('AuthContext: Sign out successful, clearing local state');
      // Clear local state
      setUser(null);
      setSession(null);
      
      console.log('AuthContext: Redirecting to auth screen');
      // Navigate to auth screen
      setTimeout(() => {
        router.replace('/auth');
      }, 100);
      
      console.log('AuthContext: Sign out complete');
    } catch (error) {
      console.error('AuthContext: Sign out exception:', error);
      // Always clear local state even if there's an error
      setUser(null);
      setSession(null);
      
      // Show error message
      Alert.alert('Error', 'Failed to sign out, but local session has been cleared.');
      
      // Navigate to auth screen anyway
      setTimeout(() => {
        router.replace('/auth');
      }, 100);
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
