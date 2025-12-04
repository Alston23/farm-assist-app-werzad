
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://tbobabbteplxwkltdlki.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRib2JhYmJ0ZXBseHdrbHRkbGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTk4MDcsImV4cCI6MjA4MDE3NTgwN30.fKj4ciCDn2M905dHpv-U9Rfy9FOHHntibK2lT2PDwsk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Ensure proper session handling
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
  },
});

// Log when the client is initialized
console.log('Supabase client initialized');
