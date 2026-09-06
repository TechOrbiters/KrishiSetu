/**
 * KRISHISETU — Photo Upload & Produce Listing Image Persistence Test Suite
 *
 * Verifies:
 * 1. POST /api/upload uploads valid JPG/PNG/WEBP to Supabase Storage bucket `produce-photos`.
 * 2. POST /api/upload validates size limits (<= 5MB) and rejects oversized files with HTTP 400.
 * 3. POST /api/upload validates allowed MIME types and rejects unsupported formats with HTTP 400.
 * 4. produce_listings table persists the real Supabase Storage public URL in PostgreSQL `images` text array.
 * 5. GET /api/listings/[id] returns the real uploaded photo URL on refresh/reload.
 * 6. Google Cloud Vision API endpoint (POST /api/ai/vision/analyze) successfully receives and processes the Supabase Storage image URL.
 */

import { supabaseAdmin } from '../src/lib/supabase/server';
import { bootstrapFarmer, createFarmerListing, fetchListingById, deleteFarmerListing } from '../src/lib/api/client';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// 1x1 transparent PNG buffer for real image upload test
const VALID_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runPhotoUploadTests() {
  console.log('📸 Starting AI MANDI Photo Upload & Image Persistence Verification...\n');
  let passed = 0;
  let total = 0;

  // Setup: Bootstrap farmer user
  console.log('Setup: Bootstrapping farmer account for upload verification...');
  await bootstrapFarmer({ full_name: 'फोटो टेस्ट किसान', village: 'बैजनाथपुर', district: 'बाराबंकी' });

  // TEST 1: Valid Image Upload to Supabase Storage
  total++;
  console.log('\nTest 1: Uploading valid PNG image to POST /api/upload...');
  const pngBuffer = Buffer.from(VALID_PNG_BASE64, 'base64');
  const validBlob = new Blob([pngBuffer], { type: 'image/png' });
  const validFormData = new FormData();
  validFormData.append('file', validBlob, 'test-produce.png');

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: validFormData,
  });

  const uploadJson = await uploadRes.json();
  let uploadedUrl = '';
  let uploadedPath = '';

  if (uploadRes.ok && uploadJson.success && uploadJson.url && uploadJson.path) {
    uploadedUrl = uploadJson.url;
    uploadedPath = uploadJson.path;
    if (uploadedUrl.includes('produce-photos') && uploadedUrl.startsWith('http')) {
      console.log('✅ TEST 1 PASSED: Real Supabase Storage upload succeeded!');
      console.log(`   Public URL: ${uploadedUrl}`);
      console.log(`   Bucket Path: ${uploadedPath}`);
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: Unexpected URL format', uploadJson);
    }
  } else {
    console.error('❌ TEST 1 FAILED: Upload failed', uploadJson);
  }

  // TEST 2: Oversized File Rejection (> 5MB)
  total++;
  console.log('\nTest 2: Verifying rejection of oversized files (> 5MB)...');
  // Create a 5.5MB dummy buffer
  const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024);
  const largeBlob = new Blob([largeBuffer], { type: 'image/jpeg' });
  const largeFormData = new FormData();
  largeFormData.append('file', largeBlob, 'oversized.jpg');

  const largeRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: largeFormData,
  });

  const largeJson = await largeRes.json();
  if (largeRes.status === 400 && largeJson.success === false) {
    console.log(`✅ TEST 2 PASSED: Oversized file (>5MB) rejected with HTTP 400: "${largeJson.error}"`);
    passed++;
  } else {
    console.error('❌ TEST 2 FAILED: Expected HTTP 400 for >5MB file', largeJson);
  }

  // TEST 3: Unsupported MIME Type Rejection
  total++;
  console.log('\nTest 3: Verifying rejection of invalid MIME type (text/plain)...');
  const txtBuffer = Buffer.from('hello world not an image');
  const txtBlob = new Blob([txtBuffer], { type: 'text/plain' });
  const txtFormData = new FormData();
  txtFormData.append('file', txtBlob, 'document.txt');

  const txtRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: txtFormData,
  });

  const txtJson = await txtRes.json();
  if (txtRes.status === 400 && txtJson.success === false) {
    console.log(`✅ TEST 3 PASSED: Invalid MIME type rejected with HTTP 400: "${txtJson.error}"`);
    passed++;
  } else {
    console.error('❌ TEST 3 FAILED: Expected HTTP 400 for text/plain', txtJson);
  }

  // TEST 4: Produce Listing Creation with Uploaded Image Attached
  total++;
  console.log('\nTest 4: Creating produce listing with uploaded Supabase Storage image...');
  let createdListingId = '';

  const listingPayload = {
    crop_name: 'ताजा आलू (फोटो टेस्ट)',
    category: 'सब्जी',
    quantity: 450,
    price_per_kg: 22,
    grade: 'A',
    location_name: 'बैजनाथपुर, बाराबंकी',
    harvest_date: new Date().toISOString().split('T')[0],
    shelf_life_days: 10,
    images: [uploadedUrl],
  };

  const createRes = await createFarmerListing(listingPayload);
  if (createRes.success && createRes.data?.id) {
    createdListingId = createRes.data.id;
    console.log(`✅ TEST 4 PASSED: Produce listing created with real ID: ${createdListingId}`);
    passed++;
  } else {
    console.error('❌ TEST 4 FAILED: Listing creation failed', createRes);
  }

  // TEST 5: Direct Supabase PostgreSQL Verification for images column
  total++;
  console.log('\nTest 5: Verifying produce_listings table in PostgreSQL has image attached...');
  const { data: dbRow, error: dbErr } = await supabaseAdmin
    .from('produce_listings')
    .select('id, crop_name, images')
    .eq('id', createdListingId)
    .single();

  if (!dbErr && dbRow && Array.isArray(dbRow.images) && dbRow.images[0] === uploadedUrl) {
    console.log('✅ TEST 5 PASSED: PostgreSQL database contains exact Supabase Storage image URL in images text[]');
    passed++;
  } else {
    console.error('❌ TEST 5 FAILED: Image URL not found in database record', { dbRow, dbErr });
  }

  // TEST 6: Fetch Listing By ID (Persistence across page refresh/reload)
  total++;
  console.log('\nTest 6: Verifying GET /api/listings/[id] returns attached image URL...');
  const fetchRes = await fetchListingById(createdListingId);
  if (fetchRes.success && fetchRes.data && fetchRes.data.imageUrl === uploadedUrl) {
    console.log(`✅ TEST 6 PASSED: fetchListingById returned exact uploaded photo URL: ${fetchRes.data.imageUrl}`);
    passed++;
  } else {
    console.error('❌ TEST 6 FAILED: imageUrl did not match uploaded URL', fetchRes);
  }

  // TEST 7: Google Cloud Vision API Integration with Uploaded Supabase Storage URL
  total++;
  console.log('\nTest 7: Verifying Google Vision API receives uploaded Supabase Storage URL...');
  const visionRes = await fetch(`${BASE_URL}/api/ai/vision/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo_token_farmer',
    },
    body: JSON.stringify({
      imageUrl: uploadedUrl,
    }),
  });

  const visionJson = await visionRes.json();
  if (visionRes.ok && visionJson.success && visionJson.data) {
    console.log('✅ TEST 7 PASSED: Google Vision successfully received and processed Supabase Storage image URL:');
    console.log(`   Detected Crop: ${visionJson.data.detectedCrop}`);
    console.log(`   Visual Condition: ${visionJson.data.visualCondition}`);
    console.log(`   Confidence: ${visionJson.data.confidence * 100}%`);
    passed++;
  } else {
    console.error('❌ TEST 7 FAILED: Vision API failed to analyze uploaded URL', visionJson);
  }

  // CLEANUP
  console.log('\nCleanup: Removing test listing and test image...');
  if (createdListingId) {
    await deleteFarmerListing(createdListingId);
  }
  if (uploadedPath) {
    await supabaseAdmin.storage.from('produce-photos').remove([uploadedPath]);
  }
  console.log('Cleanup complete.');

  console.log(`\n========================================`);
  console.log(`Tests Passed: ${passed}/${total}`);
  console.log(`========================================\n`);

  if (passed === total) {
    console.log('🎉 ALL PHOTO UPLOAD & IMAGE PERSISTENCE TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED.');
    process.exit(1);
  }
}

runPhotoUploadTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
