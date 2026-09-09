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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

interface SeedUser {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'ADMIN' | 'FPO_ADMIN';
  locationName: string;
  meta?: Record<string, any>;
}

const seedUsers: SeedUser[] = [
  {
    email: 'buyer.laxmi@krishisetu.in',
    password: 'buyer123',
    fullName: 'लक्ष्मी फूड्स (Laxmi Foods)',
    phone: '+919876543211',
    role: 'BUYER',
    locationName: 'आलमबाग, लखनऊ',
    meta: {
      business_name: 'लक्ष्मी एग्रो प्रोक्योरमेंट',
      buyer_type: 'WHOLESALER',
      district: 'लखनऊ',
      gstin: '09AABCL1234F1Z1',
    }
  },
  {
    email: 'rohit.traders@krishisetu.in',
    password: 'buyer123',
    fullName: 'रोहित वर्मा (Rohit Traders)',
    phone: '+919876543210',
    role: 'BUYER',
    locationName: 'अमीनाबाद, लखनऊ',
    meta: {
      business_name: 'रोहित ट्रेडर्स',
      buyer_type: 'RETAILER',
      district: 'लखनऊ',
      gstin: '09AABCV1234F1Z5',
    }
  },
  {
    email: 'transporter.raj@krishisetu.in',
    password: 'transport123',
    fullName: 'राज ट्रांसपोर्ट (राजेश कुमार)',
    phone: '+919876543212',
    role: 'TRANSPORTER',
    locationName: 'लखनऊ - बाराबंकी कॉरिडोर',
    meta: {
      vehicle_number: 'UP 32 AB 1234',
      vehicle_type: 'बोलेरो मैक्सी ट्रक (2.5 - 3 टन)',
      capacity_kg: 2500,
      rating: 4.9,
    }
  },
  {
    email: 'admin@krishisetu.in',
    password: 'admin123',
    fullName: 'National Platform Administrator',
    phone: '+919999999999',
    role: 'FPO_ADMIN',
    locationName: 'DoCA Surveillance Center, Lucknow',
    meta: {
      designation: 'DoCA Surveillance Officer',
      role: 'ADMIN',
    }
  },
  {
    email: 'user_admin_9999999999@krishisetu.in',
    password: 'admin123',
    fullName: 'National Platform Administrator',
    phone: '+919999999999',
    role: 'FPO_ADMIN',
    locationName: 'DoCA Surveillance Center, Lucknow',
    meta: {
      designation: 'DoCA Surveillance Officer',
      role: 'ADMIN',
    }
  },
  {
    email: 'user_farmer_9140627603@krishisetu.in',
    password: 'kisan123',
    fullName: 'रामेश्वर यादव (Rameshwar Yadav)',
    phone: '+919140627603',
    role: 'FARMER',
    locationName: 'बैजनाथपुर, बाराबंकी',
    meta: {
      village: 'बैजनाथपुर',
      district: 'बाराबंकी',
      state: 'उत्तर प्रदेश',
    }
  },
  {
    email: 'user_farmer_9874563210@krishisetu.in',
    password: 'kisan123',
    fullName: 'सुरेश कुमार (Suresh Kumar)',
    phone: '+919874563210',
    role: 'FARMER',
    locationName: 'हरख, बाराबंकी',
    meta: {
      village: 'हरख',
      district: 'बाराबंकी',
      state: 'उत्तर प्रदेश',
    }
  },
];

async function seedAll() {
  console.log('--- Provisioning Canonical Demo Users in Supabase Auth ---');

  // List existing auth users
  const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const existingUsers = listData?.users || [];
  const userByEmail = new Map(existingUsers.map(u => [u.email?.toLowerCase(), u]));

  for (const s of seedUsers) {
    const emailLower = s.email.toLowerCase();
    let uid: string;

    if (userByEmail.has(emailLower)) {
      const existing = userByEmail.get(emailLower)!;
      uid = existing.id;
      console.log(`User ${s.email} already exists (${uid}). Updating password & metadata...`);
      const { error: updErr } = await adminClient.auth.admin.updateUserById(uid, {
        password: s.password,
        email_confirm: true,
        user_metadata: {
          full_name: s.fullName,
          phone: s.phone,
          role: s.role,
          ...s.meta,
        }
      });
      if (updErr) console.error(`Error updating ${s.email}:`, updErr.message);
      else console.log(`✓ Updated auth user ${s.email}`);
    } else {
      console.log(`Creating auth user ${s.email}...`);
      const { data: newU, error: cErr } = await adminClient.auth.admin.createUser({
        email: s.email,
        password: s.password,
        email_confirm: true,
        user_metadata: {
          full_name: s.fullName,
          phone: s.phone,
          role: s.role,
          ...s.meta,
        }
      });
      if (cErr) {
        console.error(`Error creating auth user ${s.email}:`, cErr.message);
        continue;
      }
      uid = newU.user.id;
      console.log(`✓ Created auth user ${s.email} (${uid})`);
    }

    // Upsert into public.users table
    try {
      const { error: uErr } = await adminClient.from('users').upsert({
        id: uid,
        firebase_uid: uid,
        full_name: s.fullName,
        phone: s.phone,
        role: s.role,
        location_name: s.locationName,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (uErr) {
        console.warn(`users table sync error for ${s.email}:`, uErr.message);
      } else {
        console.log(`✓ Synced public.users row for ${s.email}`);
      }

      // Upsert role-specific profiles
      if (s.role === 'FARMER') {
        await adminClient.from('farmer_profiles').upsert({
          user_id: uid,
          village: s.meta?.village || 'बैजनाथपुर',
          district: s.meta?.district || 'बाराबंकी',
          state: s.meta?.state || 'उत्तर प्रदेश',
          verification_status: 'VERIFIED',
        }, { onConflict: 'user_id' });
        console.log(`✓ Synced farmer_profiles row for ${s.email}`);
      } else if (s.role === 'BUYER') {
        await adminClient.from('buyer_profiles').upsert({
          user_id: uid,
          business_name: s.meta?.business_name || s.fullName,
          buyer_type: s.meta?.buyer_type || 'RETAILER',
          gstin: s.meta?.gstin || '09AABCV1234F1Z5',
        }, { onConflict: 'user_id' });
        console.log(`✓ Synced buyer_profiles row for ${s.email}`);
      } else if (s.role === 'TRANSPORTER') {
        await adminClient.from('transporter_profiles').upsert({
          user_id: uid,
          full_name: s.fullName,
          phone: s.phone,
          vehicle_type: s.meta?.vehicle_type || 'Mini Truck',
          vehicle_number: s.meta?.vehicle_number || 'UP 32 AB 1234',
          capacity_kg: s.meta?.capacity_kg || 2500,
          location_name: s.locationName,
        }, { onConflict: 'user_id' });
        console.log(`✓ Synced transporter_profiles row for ${s.email}`);
      }
    } catch (e: any) {
      console.error(`DB sync exception for ${s.email}:`, e.message);
    }
  }

  console.log('\n🎉 ALL CANONICAL DEMO USERS PROVISIONED SUCCESSFULLY IN SUPABASE!');
}

seedAll();
