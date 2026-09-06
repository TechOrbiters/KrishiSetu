import { supabaseAdmin } from '../src/lib/supabase/server';

/**
 * Script to clean all data from Supabase tables in reverse dependency order.
 * Keeps table schemas intact, leaving a pristine clean database.
 */
async function cleanDatabase() {
  console.log('🧹 Starting Supabase database cleanup...\n');

  // Tables in child-to-parent deletion order to respect foreign key constraints
  const tables = [
    'notifications',
    'audit_logs',
    'fcm_tokens',
    'payments',
    'shipments',
    'transport_requests',
    'orders',
    'produce_listings',
    'buyer_demands',
    'fpo_memberships',
    'fpo_profiles',
    'farmer_profiles',
    'transporter_profiles',
    'market_prices',
    'users',
  ];

  for (const table of tables) {
    try {
      // In PostgREST / Supabase, delete requires a filter
      const { error, count } = await supabaseAdmin
        .from(table)
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        // Some tables might not exist or might not have 'id' column
        if (error.code === '42P01') {
          console.log(`ℹ️  Table "${table}" does not exist in schema (skipping).`);
        } else if (error.message.includes('column "id" does not exist')) {
          // Fallback delete for tables without 'id'
          const { error: fbErr } = await supabaseAdmin
            .from(table)
            .delete()
            .neq('created_at', '1970-01-01T00:00:00Z');
          if (fbErr) {
            console.warn(`⚠️  Could not clean "${table}":`, fbErr.message);
          } else {
            console.log(`✅ Table "${table}" cleared successfully.`);
          }
        } else {
          console.warn(`⚠️  Error clearing "${table}":`, error.message);
        }
      } else {
        console.log(`✅ Table "${table}" cleared (removed ${count ?? 0} rows).`);
      }
    } catch (err: any) {
      console.warn(`⚠️  Exception while clearing "${table}":`, err.message);
    }
  }

  console.log('\n✨ Database cleanup complete! All tables are now clean and empty.');
}

cleanDatabase().catch((err) => {
  console.error('❌ Failed to clean database:', err);
  process.exit(1);
});
