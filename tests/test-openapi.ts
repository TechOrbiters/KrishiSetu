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

async function testEndpoints() {
  console.log('Testing Supabase REST endpoints with service role key...');

  // Check what OpenAPI schema says
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    const schema = await res.json();
    console.log('Available tables in OpenAPI definition:', Object.keys(schema.definitions || {}));
    console.log('Available paths in OpenAPI definition:', Object.keys(schema.paths || {}));
  } catch (e: any) {
    console.error('Fetch OpenAPI error:', e.message);
  }
}

testEndpoints();
