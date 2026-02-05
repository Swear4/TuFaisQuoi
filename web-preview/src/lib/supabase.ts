import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://hnpewfssuwtxdooqiqkj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucGV3ZnNzdXd0eGRvb3FpcWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NjY3NDMsImV4cCI6MjA4MTA0Mjc0M30.IaSocWikhr0HJ3i2ySs9j3KsSvhslszOoooVywRvrIs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
