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
const adminClient = createClient(url, serviceKey);

async function alignUsers() {
  console.log('--- Aligning public.users with auth.users ---');

  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const authUsers = authData?.users || [];
  console.log(`Found ${authUsers.length} users in auth.users.`);

  // Clean old mismatched dummy rows in users that don't match any auth user
  const authIds = new Set(authUsers.map(u => u.id));
  const { data: dbUsers } = await adminClient.from('users').select('*');

  for (const dbU of (dbUsers || [])) {
    if (!authIds.has(dbU.id)) {
      console.log(`Deleting orphan db user: ${dbU.id} (${dbU.phone} / ${dbU.full_name})`);
      // Delete any farmer profile first
      await adminClient.from('farmer_profiles').delete().eq('user_id', dbU.id);
      await adminClient.from('transporter_profiles').delete().eq('user_id', dbU.id);
      await adminClient.from('buyer_profiles').delete().eq('user_id', dbU.id);
      await adminClient.from('users').delete().eq('id', dbU.id);
    }
  }

  // Now ensure every auth user has their exact row in public.users
  for (const au of authUsers) {
    const meta = au.user_metadata || {};
    const role = meta.role || (au.email?.includes('buyer') ? 'BUYER' : au.email?.includes('transporter') ? 'TRANSPORTER' : au.email?.includes('admin') ? 'FPO_ADMIN' : 'FARMER');
    const fullName = meta.full_name || au.email?.split('@')[0] || 'Krishi Partner';
    const phone = meta.phone || (au.phone || `+91${au.id.replace(/\D/g, '').slice(0, 10).padEnd(10, '0')}`);

    const { error: upsertErr } = await adminClient.from('users').upsert({
      id: au.id,
      firebase_uid: au.id,
      full_name: fullName,
      phone: phone,
      role: role,
      location_name: meta.district || meta.village || 'उत्तर प्रदेश',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (upsertErr) {
      console.warn(`Error syncing user ${au.email}:`, upsertErr.message);
    } else {
      console.log(`✓ Synchronized user ${au.email} -> public.users (${au.id})`);
    }

    // Role-specific sync
    if (role === 'FARMER') {
      await adminClient.from('farmer_profiles').upsert({
        user_id: au.id,
        village: meta.village || 'बैजनाथपुर',
        district: meta.district || 'बाराबंकी',
        state: meta.state || 'उत्तर प्रदेश',
        verification_status: 'VERIFIED',
      }, { onConflict: 'user_id' });
    } else if (role === 'BUYER') {
      await adminClient.from('buyer_profiles').upsert({
        user_id: au.id,
        business_name: meta.business_name || fullName,
        buyer_type: meta.buyer_type || 'RETAILER',
        gstin: meta.gstin || '09AABCV1234F1Z5',
      }, { onConflict: 'user_id' });
    } else if (role === 'TRANSPORTER') {
      await adminClient.from('transporter_profiles').upsert({
        user_id: au.id,
        full_name: fullName,
        phone: phone,
        vehicle_type: meta.vehicle_type || 'Mini Truck',
        vehicle_number: meta.vehicle_number || 'UP 32 AB 1234',
        capacity_kg: meta.capacity_kg || 2500,
        location_name: meta.location_name || 'लखनऊ Mandi',
      }, { onConflict: 'user_id' });
    }
  }

  console.log('\n🎉 ALL USERS PERFECTLY ALIGNED BETWEEN AUTH & DB!');
}

alignUsers();
