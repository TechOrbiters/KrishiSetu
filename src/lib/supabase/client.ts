import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hikysobkgojhmzqaiity.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_UETMByYA6eSq1_K2C7Tm9A_CaFgL90e';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
