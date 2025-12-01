import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://tbobabbteplxwkltdlki.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRib2JhYmJ0ZXBseHdrbHRkbGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTk4MDcsImV4cCI6MjA4MDE3NTgwN30.fKj4ciCDn2M905dHpv-U9Rfy9FOHHntibK2lT2PDwsk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
