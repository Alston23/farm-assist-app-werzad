
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface User {
  id: string;
  email: string;
  name?: string;
  farmName?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, farmName: string, email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error.message);
        showUserFriendlyError('Failed to restore your session. Please sign in again.');
      }
      
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          farmName: session.user.user_metadata?.farmName,
        };
        setUser(userData);
        setSession(session);
      } else {
        setUser(null);
        setSession(null);
      }
      
      setIsLoading(false);
    }).catch((error) => {
      console.error('Unexpected error during session check:', error);
      showUserFriendlyError('An unexpected error occurred. Please restart the app.');
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session ? 'Session exists' : 'No session');
      
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          farmName: session.user.user_metadata?.farmName,
        };
        setUser(userData);
        setSession(session);
      } else {
        setUser(null);
        setSession(null);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const showUserFriendlyError = (message: string) => {
    Alert.alert('Connection Issue', message, [{ text: 'OK' }]);
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email || !password) {
        return { success: false, error: 'Please enter your email and password' };
      }

      const trimmedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Invalid email or password. If you just signed up, please verify your email first.' 
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
        const userData = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
          farmName: data.user.user_metadata?.farmName,
        };
        
        setUser(userData);
        setSession(data.session);
        
        return { success: true };
      }

      return { success: false, error: 'Sign in failed. Please try again.' };
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Check for network errors
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        return { 
          success: false, 
          error: 'Unable to connect. Please check your internet connection and try again.' 
        };
      }
      
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signUp = async (
    name: string,
    farmName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> => {
    try {
      if (!email || !password || !name) {
        return { success: false, error: 'Please fill in all required fields' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const trimmedEmail = email.trim().toLowerCase();

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
        if (error.message.includes('already registered')) {
          return { success: false, error: 'This email is already registered. Please sign in instead.' };
        }
        
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // User is automatically signed in (email confirmation disabled)
          const userData = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name,
            farmName: data.user.user_metadata?.farmName,
          };
          setUser(userData);
          setSession(data.session);
          return { success: true, needsVerification: false };
        } else {
          // Email confirmation required
          return { 
            success: true, 
            needsVerification: true,
            error: 'Account created! Please check your email and click the verification link to complete your registration.' 
          };
        }
      }

      return { success: false, error: 'Sign up failed. Please try again.' };
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Check for network errors
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        return { 
          success: false, 
          error: 'Unable to connect. Please check your internet connection and try again.' 
        };
      }
      
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
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
        if (error.message.includes('rate limit')) {
          return { 
            success: false, 
            error: 'Please wait a moment before requesting another verification email.' 
          };
        }
        
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Resend error:', error);
      
      // Check for network errors
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        return { 
          success: false, 
          error: 'Unable to connect. Please check your internet connection and try again.' 
        };
      }
      
      return { success: false, error: 'Failed to resend verification email. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      console.log('Logout initiated...');
      
      // Clear local state first to ensure UI updates immediately
      setUser(null);
      setSession(null);
      
      // Call Supabase signOut to invalidate the session on the server
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out from Supabase:', error);
        // Don't show error to user since local state is already cleared
      } else {
        console.log('Successfully signed out from Supabase');
      }
      
      // Clear any cached auth data from AsyncStorage
      try {
        await AsyncStorage.removeItem('supabase.auth.token');
        console.log('Cleared auth token from AsyncStorage');
      } catch (storageError) {
        console.error('Error clearing AsyncStorage:', storageError);
      }
      
    } catch (error: any) {
      console.error('Unexpected error during logout:', error);
      // Ensure user is set to null even if there's an error
      setUser(null);
      setSession(null);
    }
  };

  // Alias for backward compatibility
  const signOut = logout;

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    logout,
    signOut,
    resendVerificationEmail,
  };

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
