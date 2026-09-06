/**
 * KRISHISETU — OpenWeather API Integration Test Suite
 * Verifies GET /api/weather, coordinates handling, validation, and data formatting.
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local into process.env if running outside Next.js
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
} catch (e) {}

import { fetchCurrentWeather } from '../src/lib/weather/openweather';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runWeatherTests() {
  console.log('🌤️ Starting OpenWeather Integration Verification...\n');
  let passed = 0;
  let total = 0;

  // TEST 1: Direct Unit Test - fetchCurrentWeather
  total++;
  console.log('Test 1: Calling fetchCurrentWeather() directly...');
  try {
    const weather = await fetchCurrentWeather(26.9038, 81.1852, 'Barabanki');
    if (
      typeof weather.temp === 'number' &&
      typeof weather.humidity === 'number' &&
      typeof weather.condition === 'string' &&
      typeof weather.conditionHindi === 'string' &&
      weather.city.length > 0
    ) {
      console.log(`✅ TEST 1 PASSED: Got weather for ${weather.city}: ${weather.temp}°C, ${weather.conditionHindi} (${weather.condition}), Live=${weather.isLive}`);
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: Incomplete weather data structure', weather);
    }
  } catch (err: any) {
    console.error('❌ TEST 1 FAILED with exception:', err.message);
  }

  // TEST 2: GET /api/weather Endpoint (Default Barabanki)
  total++;
  console.log('\nTest 2: GET /api/weather endpoint (default coordinates)...');
  try {
    const res = await fetch(`${BASE_URL}/api/weather`);
    const json = await res.json();

    if (res.status === 200 && json.success === true && json.data) {
      console.log(`✅ TEST 2 PASSED: HTTP 200, Weather: ${json.data.temp}°C, Condition: ${json.data.conditionHindi}`);
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Response was not OK or success=false', json);
    }
  } catch (err: any) {
    console.error('❌ TEST 2 FAILED with exception:', err.message);
  }

  // TEST 3: GET /api/weather with custom query coordinates (Delhi)
  total++;
  console.log('\nTest 3: GET /api/weather with custom coordinates (Delhi)...');
  try {
    const res = await fetch(`${BASE_URL}/api/weather?lat=28.6139&lon=77.2090&city=Delhi`);
    const json = await res.json();

    if (res.status === 200 && json.success === true && json.data) {
      console.log(`✅ TEST 3 PASSED: Custom location: ${json.data.city}, ${json.data.temp}°C, Humidity: ${json.data.humidity}%`);
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: Could not fetch custom coordinates', json);
    }
  } catch (err: any) {
    console.error('❌ TEST 3 FAILED with exception:', err.message);
  }

  // TEST 4: Invalid coordinates validation (lat=invalid)
  total++;
  console.log('\nTest 4: Validation on invalid coordinates...');
  try {
    const res = await fetch(`${BASE_URL}/api/weather?lat=not_a_number&lon=81.1852`);
    const json = await res.json();

    if (res.status === 400 && json.success === false) {
      console.log('✅ TEST 4 PASSED: Correctly returned HTTP 400 for invalid lat/lon');
      passed++;
    } else {
      console.error('❌ TEST 4 FAILED: Expected HTTP 400, got:', res.status, json);
    }
  } catch (err: any) {
    console.error('❌ TEST 4 FAILED with exception:', err.message);
  }

  // TEST 5: Verify OpenWeather API key configuration
  total++;
  console.log('\nTest 5: Checking OpenWeather API key environment variable...');
  const key = process.env.OPENWEATHER_API_KEY;
  if (key && key.length === 32) {
    console.log(`✅ TEST 5 PASSED: OPENWEATHER_API_KEY is configured with length 32 (${key.substring(0, 4)}...${key.substring(28)})`);
    passed++;
  } else {
    console.log(`⚠️ Note: OPENWEATHER_API_KEY is ${key ? 'configured' : 'not present in current process env'}`);
    // If running in ts-node without dotenv, check if key is set in .env.local
    const fs = require('fs');
    const path = require('path');
    const envContent = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
    if (envContent.includes('OPENWEATHER_API_KEY=') && /OPENWEATHER_API_KEY=\s*[a-zA-Z0-9_-]{20,}/.test(envContent)) {
      console.log('✅ TEST 5 PASSED: OPENWEATHER_API_KEY is present in .env.local');
      passed++;
    } else {
      console.error('❌ TEST 5 FAILED: OPENWEATHER_API_KEY not found in .env.local');
    }
  }

  console.log(`\n========================================`);
  console.log(`OpenWeather Verification Results: ${passed}/${total} PASSED`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runWeatherTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
