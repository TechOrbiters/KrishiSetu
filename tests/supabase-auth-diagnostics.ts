import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local
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
const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('=== KRISHISETU SUPABASE AUTH DIAGNOSTIC ===');
console.log('URL:', url);
console.log('Publishable Key:', publishableKey ? `${publishableKey.substring(0, 15)}...` : 'MISSING');
console.log('Service Role Key:', serviceKey ? `${serviceKey.substring(0, 15)}...` : 'MISSING');

async function runDiagnostics() {
  console.log('\n--- 1. Testing Connection with Publishable Key ---');
  const client = createClient(url, publishableKey);

  try {
    const { data, error } = await client.auth.getSession();
    console.log('getSession status:', { hasSession: !!data?.session, error: error?.message || null });
  } catch (e: any) {
    console.error('getSession thrown exception:', e.message);
  }

  // Check anonymous access / public queries
  try {
    const { data: testData, error: testErr } = await client.from('users').select('id, full_name, role').limit(2);
    console.log('Select from users with publishable key:', {
      rowCount: testData?.length ?? 0,
      error: testErr?.message || null,
      code: testErr?.code || null
    });
  } catch (e: any) {
    console.error('Query users thrown exception:', e.message);
  }

  console.log('\n--- 2. Testing Connection with Service Role Key ---');
  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data: adminUsers, error: adminErr } = await adminClient.auth.admin.listUsers();
    console.log('admin.listUsers status:', {
      totalUsers: adminUsers?.users?.length ?? 0,
      error: adminErr?.message || null,
      users: adminUsers?.users?.map(u => ({ id: u.id, email: u.email, confirmed: !!u.email_confirmed_at, meta: u.user_metadata }))
    });
  } catch (e: any) {
    console.error('admin.listUsers thrown exception:', e.message);
  }

  console.log('\n--- 3. Testing Sign In with Test Credentials ---');
  try {
    const { data: sData, error: sErr } = await client.auth.signInWithPassword({
      email: 'buyer.laxmi@krishisetu.in',
      password: 'buyer123'
    });
    console.log('Sign in buyer.laxmi@krishisetu.in:', {
      userId: sData?.user?.id,
      email: sData?.user?.email,
      error: sErr?.message || null,
      status: sErr?.status || null
    });
  } catch (e: any) {
    console.error('Sign in exception:', e.message);
  }

  console.log('\n--- 4. Testing Sign Up with Publishable Key ---');
  const uniqueEmail = `test_buyer_${Date.now()}@krishisetu.in`;
  try {
    const { data: suData, error: suErr } = await client.auth.signUp({
      email: uniqueEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Test Buyer Diag',
          role: 'BUYER',
          phone: '9876543210'
        }
      }
    });
    console.log(`Sign up with ${uniqueEmail}:`, {
      userId: suData?.user?.id,
      email: suData?.user?.email,
      confirmed: !!suData?.user?.email_confirmed_at,
      hasSession: !!suData?.session,
      error: suErr?.message || null,
      status: suErr?.status || null
    });

    if (suData?.user?.id) {
      console.log('Cleaning up diagnostic test user...');
      await adminClient.auth.admin.deleteUser(suData.user.id);
      console.log('Cleaned up diagnostic user successfully.');
    }
  } catch (e: any) {
    console.error('Sign up exception:', e.message);
  }
}

runDiagnostics();
