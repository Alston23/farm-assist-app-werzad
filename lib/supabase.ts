
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Load Supabase credentials from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                    process.env.EXPO_PUBLIC_SUPABASE_URL || 
                    'https://tbobabbteplxwkltdlki.supabase.co';

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRib2JhYmJ0ZXBseHdrbHRkbGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTk4MDcsImV4cCI6MjA4MDE3NTgwN30.fKj4ciCDn2M905dHpv-U9Rfy9FOHHntibK2lT2PDwsk';

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your environment configuration.');
}

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'smallfarm-copilot@1.0.0',
    },
  },
});

// Helper function to check if Supabase is reachable
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('_health_check').select('*').limit(1);
    // If we get a "relation does not exist" error, that's actually good - it means we connected
    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return true;
    }
    return !error;
  } catch (error) {
    return false;
  }
};
