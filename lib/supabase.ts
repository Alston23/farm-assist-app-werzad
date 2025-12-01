
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tbobabbteplxwkltdlki.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRib2JhYmJ0ZXBseHdrbHRkbGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTk4MDcsImV4cCI6MjA4MDE3NTgwN30.fKj4ciCDn2M905dHpv-U9Rfy9FOHHntibK2lT2PDwsk';

console.log('🔧 Supabase Configuration:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key is missing!');
} else {
  console.log('✅ Supabase credentials loaded successfully');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('✅ Supabase client initialized');
