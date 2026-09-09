import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(url, serviceKey);

async function inspectDatabase() {
  console.log('Inspecting Supabase database tables...');

  // 1. Check users table
  const { data: users, error: uErr } = await supabase.from('users').select('*').limit(5);
  console.log('users table:', { count: users?.length, error: uErr, sample: users });

  // 2. Check farmer_profiles table
  const { data: fProfiles, error: fErr } = await supabase.from('farmer_profiles').select('*').limit(5);
  console.log('farmer_profiles table:', { count: fProfiles?.length, error: fErr, sample: fProfiles });

  // 3. Check produce_listings table
  const { data: listings, error: lErr } = await supabase.from('produce_listings').select('*').limit(5);
  console.log('produce_listings table:', { count: listings?.length, error: lErr, sample: listings });

  // 4. Check orders table
  const { data: orders, error: oErr } = await supabase.from('orders').select('*').limit(5);
  console.log('orders table:', { count: orders?.length, error: oErr, sample: orders });
}

inspectDatabase();
