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
const pubKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const accounts = [
  { role: 'BUYER', email: 'buyer.laxmi@krishisetu.in', pass: 'buyer123' },
  { role: 'BUYER', email: 'rohit.traders@krishisetu.in', pass: 'buyer123' },
  { role: 'TRANSPORTER', email: 'transporter.raj@krishisetu.in', pass: 'transport123' },
  { role: 'ADMIN', email: 'admin@krishisetu.in', pass: 'admin123' },
  { role: 'FARMER', email: 'user_farmer_9140627603@krishisetu.in', pass: 'kisan123' },
  { role: 'FARMER', email: 'user_farmer_9874563210@krishisetu.in', pass: 'kisan123' },
];

async function testAll() {
  console.log('=== TESTING REAL SUPABASE AUTH SIGN-IN FOR ALL ACCOUNTS ===\n');
  let passed = 0;

  for (const acc of accounts) {
    const client = createClient(url, pubKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });

    if (error || !data.user) {
      console.error(`❌ [${acc.role}] Failed ${acc.email}: ${error?.message}`);
    } else {
      console.log(`✅ [${acc.role}] SUCCESS ${acc.email} (ID: ${data.user.id}, Session: ${!!data.session})`);
      passed++;
    }
  }

  console.log(`\nResults: ${passed} / ${accounts.length} accounts passed!`);
  if (passed !== accounts.length) process.exit(1);
}

testAll();
