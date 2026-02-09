// D:\text-to-image\AI-Image-Studio-Pro\supabaseConfig.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aqukwfwfoncxfoyrolor.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdWt3Zndmb25jeGZveXJvbG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjkyMDcsImV4cCI6MjA4NTcwNTIwN30.jf2hJkSmUQMwkmc0m-hqetNlg3HzeeLMoCqD4B9efJQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);