import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iobcpeqbwuekhysywvmy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYmNwZXFid3Vla2h5c3l3dm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNTYwNzgsImV4cCI6MjA4ODgzMjA3OH0.8WTa1mk3FnyH8OV5RKfu7tAPptweixzX1DQArSVSIew'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})