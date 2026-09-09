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
const clientAdmin = createClient(url, serviceKey);

async function checkPolicies() {
  // Let's see what tables we can query from information_schema or pg_catalog if exposed, or through rpc
  const { data, error } = await clientAdmin.rpc('exec_sql', { query: 'SELECT * FROM pg_policies WHERE tablename = \'users\';' });
  console.log('rpc exec_sql:', { data, error });
}

checkPolicies();
