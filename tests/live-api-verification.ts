/**
 * KRISHISETU — Live End-to-End API Verification Script
 * Validates active HTTP endpoints on http://localhost:3000
 */

async function runLiveApiVerification() {
  console.log("🚀 Starting KRISHISETU Live End-to-End API Verification...\n");
  const baseUrl = "http://localhost:3000";
  let passed = 0;
  let total = 0;

  // 1. Health API Check
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    const json = await res.json();
    if (res.status === 200 && json.status) {
      console.log(`✅ TEST 1 PASSED: GET /api/health returned 200 OK (Status: ${json.status})`);
      passed++;
    } else {
      console.error("❌ TEST 1 FAILED:", res.status, json);
    }
  } catch (err: any) {
    console.error("❌ TEST 1 FAILED:", err.message);
  }

  // 2. Health Providers Check
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/health/providers`);
    const json = await res.json();
    if (res.status === 200 && json.providers && json.providers.data_gov_mandi && json.providers.openstreetmap && json.providers.osrm_routing) {
      console.log(`✅ TEST 2 PASSED: GET /api/health/providers returned 200 OK with Open Map Stack & Mandi provider status`);
      passed++;
    } else {
      console.error("❌ TEST 2 FAILED:", res.status, json);
    }
  } catch (err: any) {
    console.error("❌ TEST 2 FAILED:", err.message);
  }

  // 3. Government Mandi Market Prices API
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/market-prices?commodity=Wheat`);
    const json = await res.json();
    if (res.status === 200 && json.success && Array.isArray(json.data.prices) && json.data.prices.length > 0) {
      const first = json.data.prices[0];
      console.log(`✅ TEST 3 PASSED: GET /api/market-prices returned ${json.data.prices.length} records (Sample: ${first.commodity} in ${first.market} @ ₹${first.modalPrice}/quintal / ₹${first.pricePerKg}/kg, Source: ${json.data.meta.source})`);
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED:", res.status, json);
    }
  } catch (err: any) {
    console.error("❌ TEST 3 FAILED:", err.message);
  }

  // 4. Market Price Summary Cards API
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/market-prices/summary`);
    const json = await res.json();
    if (res.status === 200 && json.success && Array.isArray(json.data) && json.data.length >= 4) {
      console.log(`✅ TEST 4 PASSED: GET /api/market-prices/summary returned ${json.data.length} top KPI cards (${json.data.map((c: any) => c.crop).join(", ")})`);
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED:", res.status, json);
    }
  } catch (err: any) {
    console.error("❌ TEST 4 FAILED:", err.message);
  }

  // 5. Open Map Stack OSRM Route API
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/location/route?originLat=26.9268&originLng=81.1868&destLat=26.7944&destLng=80.8912`);
    const json = await res.json();
    if (res.status === 200 && json.success && json.data && json.data.routeAvailable && json.data.geometry) {
      console.log(`✅ TEST 5 PASSED: GET /api/location/route returned OSRM road route (${json.data.distanceKm} km, ${json.data.durationMinutes} mins, GeoJSON polyline)`);
      passed++;
    } else {
      console.error("❌ TEST 5 FAILED:", res.status, json);
    }
  } catch (err: any) {
    console.error("❌ TEST 5 FAILED:", err.message);
  }

  // 6. Straight-Line Distance API
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/location/distance?originLat=26.9268&originLng=81.1868&destLat=26.7944&destLng=80.8912`);
    const json = await res.json();
    if (res.status === 200 && json.success && json.data.distanceKm > 0) {
      console.log(`✅ TEST 6 PASSED: GET /api/location/distance returned Haversine distance (${json.data.distanceKm} km)`);
      passed++;
    } else {
      console.error("❌ TEST 6 FAILED:", res.status, json);
    }
  } catch (err: any) {
    console.error("❌ TEST 6 FAILED:", err.message);
  }

  // 7. Geocoding Local Dictionary API
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/location/geocode?address=Barabanki`);
    const json = await res.json();
    if (res.status === 200 && json.success && json.data.location.lat > 0) {
      console.log(`✅ TEST 7 PASSED: GET /api/location/geocode resolved Barabanki to (${json.data.location.lat}, ${json.data.location.lng})`);
      passed++;
    } else {
      console.error("❌ TEST 7 FAILED:", res.status, json);
    }
  } catch (err: any) {
    console.error("❌ TEST 7 FAILED:", err.message);
  }

  console.log(`\n🎉 Verification Summary: ${passed}/${total} Live API routes passed successfully!`);

  if (passed !== total) {
    process.exit(1);
  }
}

runLiveApiVerification();
