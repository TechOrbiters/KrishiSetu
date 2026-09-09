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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';

const clientPub = createClient(url, pubKey);
const clientAdmin = createClient(url, serviceKey);

async function testRlsAndUpsert() {
  console.log('Testing anon client upsert to public.users...');
  
  // 1. Create a real user in auth via admin
  const testId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`;
  const testEmail = `test_upsert_${Date.now()}@krishisetu.in`;
  
  const { data: created, error: cErr } = await clientAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: 'Test Upsert User', role: 'BUYER' }
  });

  if (cErr || !created.user) {
    console.error('Failed to create auth user:', cErr);
    return;
  }
  const userId = created.user.id;
  console.log('Created auth user:', userId);

  // Now sign in with clientPub
  const { data: signIn, error: sErr } = await clientPub.auth.signInWithPassword({
    email: testEmail,
    password: 'Password123!'
  });
  console.log('Signed in with clientPub:', { success: !!signIn.session, error: sErr?.message });

  // Now test upsert with authenticated clientPub
  const { data: upsertData, error: uErr } = await clientPub.from('users').upsert({
    id: userId,
    firebase_uid: userId,
    full_name: 'Test Upsert User Authenticated',
    phone: '+919999999999',
    role: 'BUYER',
    location_name: 'Lucknow',
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });

  console.log('clientPub.from(users).upsert result:', { error: uErr });

  // Cleanup
  await clientAdmin.from('users').delete().eq('id', userId);
  await clientAdmin.auth.admin.deleteUser(userId);
  console.log('Cleaned up test user.');
}

testRlsAndUpsert();
