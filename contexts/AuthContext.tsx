
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  signUp: (name: string, farmName: string, email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('=== AuthContext: Initializing ===');
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error.message);
      }
      
      console.log('Initial session check:', session ? `Session found for ${session.user.email}` : 'No session');
      
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          farmName: session.user.user_metadata?.farmName,
        };
        console.log('Setting user from session:', userData);
        setUser(userData);
      } else {
        console.log('No session found, user will need to sign in');
      }
      
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('=== Auth State Changed ===');
      console.log('Event:', _event);
      console.log('Session:', session ? `Exists for ${session.user.email}` : 'None');
      
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          farmName: session.user.user_metadata?.farmName,
        };
        console.log('Setting user from auth state change:', userData);
        setUser(userData);
      } else {
        console.log('Clearing user from auth state change');
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log('Unsubscribing from auth state changes');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('=== SIGN IN STARTED ===');
      console.log('Email:', email);
      
      if (!email || !password) {
        console.log('❌ Missing email or password');
        return { success: false, error: 'Please enter your email and password' };
      }

      const trimmedEmail = email.trim().toLowerCase();
      console.log('Attempting sign in with:', trimmedEmail);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (error) {
        console.log('❌ Sign in error:', error.message);
        
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Invalid email or password. If you just signed up, please verify your email first by clicking the link we sent you.' 
          };
        } else if (error.message.includes('Email not confirmed')) {
          return { 
            success: false, 
            error: 'Please verify your email address before signing in. Check your inbox for the verification link.' 
          };
        } else if (error.message.includes('Email link is invalid or has expired')) {
          return { 
            success: false, 
            error: 'Your verification link has expired. Please request a new one.' 
          };
        }
        
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        console.log('✅ Sign in successful:', data.user.email);
        
        const userData = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
          farmName: data.user.user_metadata?.farmName,
        };
        
        console.log('User data:', userData);
        setUser(userData);
        
        return { success: true };
      }

      console.log('❌ Sign in failed - no user or session returned');
      return { success: false, error: 'Sign in failed. Please try again.' };
    } catch (error: any) {
      console.error('=== SIGN IN ERROR ===', error);
      return { success: false, error: error.message || 'An unexpected error occurred during sign in' };
    }
  };

  const signUp = async (
    name: string,
    farmName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> => {
    try {
      console.log('=== SIGN UP STARTED ===');
      console.log('Name:', name);
      console.log('Farm Name:', farmName);
      console.log('Email:', email);
      
      if (!email || !password || !name) {
        console.log('❌ Missing required fields');
        return { success: false, error: 'Please fill in all required fields' };
      }

      if (password.length < 6) {
        console.log('❌ Password too short');
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const trimmedEmail = email.trim().toLowerCase();
      console.log('Attempting sign up with:', trimmedEmail);

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            name: name.trim(),
            farmName: farmName.trim(),
          },
          emailRedirectTo: 'https://natively.dev/email-confirmed',
        },
      });

      if (error) {
        console.log('❌ Sign up error:', error.message);
        
        // Provide user-friendly error messages
        if (error.message.includes('already registered')) {
          return { success: false, error: 'This email is already registered. Please sign in instead.' };
        }
        
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Sign up successful:', data.user.email);
        
        // Check if email confirmation is required
        if (data.session) {
          // User is automatically signed in (email confirmation disabled)
          const userData = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name,
            farmName: data.user.user_metadata?.farmName,
          };
          console.log('User automatically signed in:', userData);
          setUser(userData);
          return { success: true, needsVerification: false };
        } else {
          // Email confirmation required
          console.log('⚠️ Email confirmation required');
          return { 
            success: true, 
            needsVerification: true,
            error: 'Account created! Please check your email and click the verification link to complete your registration.' 
          };
        }
      }

      console.log('❌ Sign up failed - no user returned');
      return { success: false, error: 'Sign up failed. Please try again.' };
    } catch (error: any) {
      console.error('=== SIGN UP ERROR ===', error);
      return { success: false, error: error.message || 'An unexpected error occurred during sign up' };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('=== RESEND VERIFICATION EMAIL ===');
      console.log('Email:', email);
      
      if (!email) {
        return { success: false, error: 'Please enter your email address' };
      }

      const trimmedEmail = email.trim().toLowerCase();
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
        },
      });

      if (error) {
        console.log('❌ Resend error:', error.message);
        
        if (error.message.includes('rate limit')) {
          return { 
            success: false, 
            error: 'Please wait a moment before requesting another verification email.' 
          };
        }
        
        return { success: false, error: error.message };
      }

      console.log('✅ Verification email resent');
      return { success: true };
    } catch (error: any) {
      console.error('=== RESEND ERROR ===', error);
      return { success: false, error: error.message || 'Failed to resend verification email' };
    }
  };

  const signOut = async () => {
    try {
      console.log('=== SIGN OUT STARTED ===');
      console.log('Current user before sign out:', user?.email);
      
      // Clear user state immediately for better UX
      setUser(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error.message);
        // Still keep user as null even if there's an error
        throw error;
      }
      
      // Clear any cached session data
      await AsyncStorage.removeItem('supabase.auth.token');
      
      console.log('✅ SIGN OUT SUCCESS');
    } catch (error) {
      console.error('Sign out error:', error);
      // Ensure user is set to null even if there's an error
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resendVerificationEmail,
  };

  console.log('AuthContext rendering - User:', user ? user.email : 'null', 'Loading:', isLoading);

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
