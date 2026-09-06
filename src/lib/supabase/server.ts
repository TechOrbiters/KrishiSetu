import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hikysobkgojhmzqaiity.supabase.co';

// Server-side admin client MUST use service role key to bypass RLS for authoritative backend operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpa3lzb2JrZ29qaG16cWFpaXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5Mjk4MiwiZXhwIjoyMTA0MTY4OTgyfQ.JnzimdZ7ZjI_qKeXByMMnA-atMZA5p6EruOomstlTOI';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
