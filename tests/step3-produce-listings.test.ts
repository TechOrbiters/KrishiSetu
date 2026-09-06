/**
 * KRISHISETU — Step 3 Produce Listing Workflow Verification Test Suite
 * Tests:
 * 1. Domain Validation (price > 0, quantity > 0, crop_name non-empty)
 * 2. Real Listing Creation via POST /api/listings (persisting to Supabase PostgreSQL produce_listings)
 * 3. Direct Supabase Database Verification of created produce_listings row
 * 4. GET /api/listings/[id] read by ID
 * 5. GET /api/listings farmer listing catalog synchronization
 * 6. PATCH /api/listings/[id] update verification in DB
 * 7. Pause/Unpause status toggle verification in DB
 * 8. Server-side ownership verification (403 Forbidden for non-owner)
 * 9. DELETE /api/listings/[id] deletion and DB absence confirmation
 */

import {
  fetchFarmerListings,
  fetchListingById,
  createFarmerListing,
  updateFarmerListing,
  deleteFarmerListing,
  pauseFarmerListing,
} from '../src/lib/api/client';
import { supabaseAdmin } from '../src/lib/supabase/server';

async function runStep3Tests() {
  console.log('🧪 Starting AI MANDI Step 3 Produce Listing Workflow Verification Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`✅ TEST ${total} PASSED: ${message}`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  let createdListingId: string | null = null;

  // 1. Validation Test: Reject negative or zero quantity/price & empty crop name
  try {
    const invalidQtyRes = await createFarmerListing({
      crop_name: 'आलू',
      quantity: -50,
      price_per_kg: 20,
    });
    assert(
      invalidQtyRes.success === false && invalidQtyRes.error !== undefined,
      'Validation correctly rejected negative quantity with HTTP 400'
    );

    const invalidPriceRes = await createFarmerListing({
      crop_name: 'आलू',
      quantity: 100,
      price_per_kg: 0,
    });
    assert(
      invalidPriceRes.success === false && invalidPriceRes.error !== undefined,
      'Validation correctly rejected zero price with HTTP 400'
    );

    const emptyNameRes = await createFarmerListing({
      crop_name: '   ',
      quantity: 100,
      price_per_kg: 20,
    });
    assert(
      emptyNameRes.success === false && emptyNameRes.error !== undefined,
      'Validation correctly rejected whitespace crop name with HTTP 400'
    );
  } catch (err: any) {
    assert(false, `Validation tests failed unexpectedly: ${err.message}`);
  }

  // 2. CREATE Listing: Valid payload with freshness and location fields
  try {
    const createRes = await createFarmerListing({
      crop_name: 'ताज़ा टमाटर (Fresh Tomato)',
      category: 'सब्जी',
      quantity: 750,
      price_per_kg: 22,
      grade: 'A',
      harvest_date: new Date().toISOString().split('T')[0],
      shelf_life_days: 7,
      location_name: 'बाराबंकी मंडी, यूपी',
    });

    assert(
      createRes.success === true && !!createRes.data?.id,
      'Created produce listing successfully and received DB listing UUID'
    );
    createdListingId = createRes.data.id;
  } catch (err: any) {
    assert(false, `Create listing test failed: ${err.message}`);
  }

  if (!createdListingId) {
    throw new Error('Cannot continue without createdListingId');
  }

  // 3. Direct Supabase Database Verification
  try {
    const { data: dbListing, error } = await supabaseAdmin
      .from('produce_listings')
      .select('*')
      .eq('id', createdListingId)
      .single();

    assert(
      !error && dbListing !== null,
      'Direct Supabase check confirmed record exists in produce_listings table'
    );
    assert(
      dbListing.crop_name === 'ताज़ा टमाटर (Fresh Tomato)' &&
      Number(dbListing.total_quantity) === 750 &&
      Number(dbListing.price_per_kg) === 22 &&
      Number(dbListing.shelf_life_days) === 7 &&
      dbListing.status === 'ACTIVE',
      'Direct Supabase record contains exact expected fields (crop_name, quantity, price, shelf_life, status)'
    );
  } catch (err: any) {
    assert(false, `Direct database check failed: ${err.message}`);
  }

  // 4. READ Listing: Fetch by ID
  try {
    const readRes = await fetchListingById(createdListingId);
    assert(
      readRes.success === true && readRes.data?.id === createdListingId,
      'Fetched produce listing by ID successfully with matching UUID'
    );
    assert(
      readRes.data?.quantityKg === 750 && readRes.data?.askingPricePerKg === 22,
      'Fetched produce item has correct quantityKg (750) and askingPricePerKg (22)'
    );
  } catch (err: any) {
    assert(false, `Read listing by ID test failed: ${err.message}`);
  }

  // 5. GET Farmer Listings: Listing is present in farmer list
  try {
    const listRes = await fetchFarmerListings();
    assert(
      listRes.success === true && Array.isArray(listRes.data),
      'Fetched farmer listings list successfully'
    );
    const found = listRes.data?.some((item) => item.id === createdListingId);
    assert(
      found === true,
      'Newly created listing is present in farmer produce listings list'
    );
  } catch (err: any) {
    assert(false, `Farmer listings list test failed: ${err.message}`);
  }

  // 6. UPDATE Listing: Price & Quantity modification
  try {
    const updateRes = await updateFarmerListing(createdListingId, {
      price_per_kg: 25,
      quantity: 800,
    });
    assert(
      updateRes.success === true,
      'Updated listing asking price (25) and quantity (800) successfully'
    );

    // Verify update directly in database
    const { data: updatedDbListing } = await supabaseAdmin
      .from('produce_listings')
      .select('price_per_kg, total_quantity, available_quantity')
      .eq('id', createdListingId)
      .single();

    assert(
      Number(updatedDbListing?.price_per_kg) === 25 &&
      Number(updatedDbListing?.total_quantity) === 800,
      'Direct Supabase verification confirmed price (25) and quantity (800) updated in PostgreSQL'
    );
  } catch (err: any) {
    assert(false, `Update listing test failed: ${err.message}`);
  }

  // 7. PAUSE / UNPAUSE Listing: Status toggle
  try {
    const pauseRes = await pauseFarmerListing(createdListingId, 'ACTIVE');
    if (!pauseRes.success) {
      console.error('pauseRes error details:', pauseRes);
    }
    assert(
      pauseRes.success === true,
      `Paused listing successfully via API (error: ${pauseRes.error})`
    );

    const { data: pausedDbListing } = await supabaseAdmin
      .from('produce_listings')
      .select('status')
      .eq('id', createdListingId)
      .single();

    assert(
      pausedDbListing?.status === 'INACTIVE',
      'Direct Supabase check confirmed status is INACTIVE (paused) in PostgreSQL produce_listings'
    );

    const unpauseRes = await pauseFarmerListing(createdListingId, 'PAUSED');
    assert(
      unpauseRes.success === true,
      'Resumed (unpaused) listing successfully via API'
    );

    const { data: activeDbListing } = await supabaseAdmin
      .from('produce_listings')
      .select('status')
      .eq('id', createdListingId)
      .single();

    assert(
      activeDbListing?.status === 'ACTIVE',
      'Direct Supabase check confirmed status restored to ACTIVE in PostgreSQL'
    );
  } catch (err: any) {
    assert(false, `Pause/unpause listing test failed: ${err.message}`);
  }

  // 8. SECURITY: Server-side ownership verification (Non-owner gets 403)
  try {
    const res = await fetch(`http://localhost:3000/api/listings/${createdListingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo_token_buyer', // Different user/role
      },
      body: JSON.stringify({ price_per_kg: 99 }),
    });
    assert(
      res.status === 403,
      'Non-owner unauthorized user received HTTP 403 Forbidden when attempting to modify listing'
    );
  } catch (err: any) {
    assert(false, `Security authorization test failed: ${err.message}`);
  }

  // 9. DELETE Listing: Remove listing by ID
  try {
    const deleteRes = await deleteFarmerListing(createdListingId);
    assert(
      deleteRes.success === true,
      'Deleted produce listing via API successfully'
    );

    // Verify deletion directly in Supabase
    const { data: deletedRow } = await supabaseAdmin
      .from('produce_listings')
      .select('id')
      .eq('id', createdListingId)
      .maybeSingle();

    assert(
      deletedRow === null,
      'Direct Supabase check confirmed record is deleted from produce_listings PostgreSQL table'
    );

    // Verify 404 from fetch by ID
    const fetchAfterDelete = await fetchListingById(createdListingId);
    assert(
      fetchAfterDelete.success === false,
      'fetchListingById returns not found / error for deleted listing'
    );
  } catch (err: any) {
    assert(false, `Delete listing test failed: ${err.message}`);
  }

  console.log(`\n🎉 Step 3 Complete Verification Summary: ${passed}/${total} tests passed successfully!`);
}

runStep3Tests().catch((err) => {
  console.error('\n❌ Step 3 Test Suite execution failed:', err);
  process.exit(1);
});
