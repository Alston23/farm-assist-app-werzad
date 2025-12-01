
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name?: string;
  farmName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, farmName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('=== AuthContext: Initializing ===');
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Session found' : 'No session');
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          farmName: session.user.user_metadata?.farmName,
        });
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session ? 'Session exists' : 'No session');
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          farmName: session.user.user_metadata?.farmName,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('=== SIGN IN STARTED ===');
      console.log('Email:', email);
      
      if (!email || !password) {
        console.log('Missing email or password');
        return { success: false, error: 'Please enter your email and password' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.log('Sign in error:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('Sign in successful:', data.user.email);
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
          farmName: data.user.user_metadata?.farmName,
        });
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (error: any) {
      console.error('=== SIGN IN ERROR ===', error);
      return { success: false, error: error.message || 'An error occurred during sign in' };
    }
  };

  const signUp = async (
    name: string,
    farmName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('=== SIGN UP STARTED ===');
      console.log('Name:', name);
      console.log('Farm Name:', farmName);
      console.log('Email:', email);
      
      if (!email || !password || !name) {
        console.log('Missing required fields');
        return { success: false, error: 'Please fill in all required fields' };
      }

      if (password.length < 6) {
        console.log('Password too short');
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            farmName: farmName.trim(),
          },
        },
      });

      if (error) {
        console.log('Sign up error:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('Sign up successful:', data.user.email);
        
        // Check if email confirmation is required
        if (data.session) {
          // User is automatically signed in
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name,
            farmName: data.user.user_metadata?.farmName,
          });
          return { success: true };
        } else {
          // Email confirmation required
          return { 
            success: false, 
            error: 'Please check your email to confirm your account before signing in.' 
          };
        }
      }

      return { success: false, error: 'Sign up failed' };
    } catch (error: any) {
      console.error('=== SIGN UP ERROR ===', error);
      return { success: false, error: error.message || 'An error occurred during sign up' };
    }
  };

  const signOut = async () => {
    try {
      console.log('=== SIGN OUT STARTED ===');
      console.log('Current user before sign out:', user?.email);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error.message);
        throw error;
      }
      
      setUser(null);
      console.log('=== SIGN OUT SUCCESS ===');
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, ensure user is set to null
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  console.log('AuthContext rendering with user:', user ? user.email : 'null', 'isLoading:', isLoading);

  return (
    <AuthContext.Provider value={value}>
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
