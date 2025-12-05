
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  is_pro: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPro: boolean;
  profile: UserProfile | null;
  signUp: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Initializing auth state');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session ? 'exists' : 'none');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('AuthContext: Error getting initial session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthContext: Auth state changed:', _event, session ? 'session exists' : 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsPro(false);
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthContext: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, is_pro')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AuthContext: Error fetching profile:', error);
        
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('AuthContext: Profile not found, creating one');
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: userId, is_pro: false })
            .select('id, is_pro')
            .single();
          
          if (insertError) {
            console.error('AuthContext: Error creating profile:', insertError);
          } else {
            console.log('AuthContext: Profile created successfully');
            setProfile(newProfile);
            setIsPro(newProfile?.is_pro ?? false);
          }
        }
      } else {
        console.log('AuthContext: Profile fetched:', data);
        setProfile(data);
        setIsPro(data?.is_pro ?? false);
      }
    } catch (error) {
      console.error('AuthContext: Exception fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('AuthContext: Manually refreshing profile');
      await fetchProfile(user.id);
    }
  };

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
      // Clear local state first
      console.log('AuthContext: Clearing local state');
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsPro(false);
      
      // Then sign out from Supabase
      console.log('AuthContext: Calling Supabase signOut()');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthContext: Sign out error:', error);
        // Even with an error, we already cleared local state
        // Just log it and continue with navigation
      } else {
        console.log('AuthContext: Supabase sign out successful');
      }
      
      // Navigate to auth screen
      console.log('AuthContext: Redirecting to /auth');
      router.replace('/auth');
      
      console.log('AuthContext: Sign out complete');
    } catch (error) {
      console.error('AuthContext: Sign out exception:', error);
      
      // Always clear local state even if there's an error
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsPro(false);
      
      // Show error message
      Alert.alert('Notice', 'You have been signed out. If you experience issues, please restart the app.');
      
      // Navigate to auth screen anyway
      router.replace('/auth');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isPro,
      profile,
      signUp, 
      signIn, 
      signOut,
      refreshProfile 
    }}>
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
