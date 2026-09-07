/**
 * KRISHISETU — Comprehensive Sarvam AI & AgriSmart Platform Test Suite
 * Validates all AI capabilities end-to-end with the provided Sarvam AI API Key:
 * 1. Sarvam Client & Configuration
 * 2. Text Language Identification (/text-lid)
 * 3. Neural Translation with Mayura v1 (/translate)
 * 4. Neural Text-to-Speech with Bulbul v3 (/text-to-speech)
 * 5. Speech-to-Text with Saaras v3 (/speech-to-text)
 * 6. Chat Completions with Sarvam 105B (/v1/chat/completions)
 * 7. Krishi Assistant Multi-Turn Engine (/api/ai/krishi-assistant)
 * 8. Transporter Voice Command Lifecycle (/api/sarvam/transporter-command)
 * 9. DemandSense & SellSmart Advisory Engines (/api/ai/demandsense & /api/ai/sellsmart)
 * 10. Vision Analysis Quality Grading Contract (/api/ai/vision/analyze)
 */

import { getSarvamApiKey } from '../src/lib/sarvam/client';
import { detectLanguage } from '../src/lib/sarvam/language';
import { translateText } from '../src/lib/sarvam/translate';
import { generateSpeech } from '../src/lib/sarvam/tts';
import { generateChatCompletion } from '../src/lib/sarvam/chat';
import { processKrishiAssistantRequest } from '../src/lib/sarvam/assistant';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runComprehensiveAITests() {
  console.log('🤖 Starting KrishiSetu Comprehensive Sarvam AI Test Suite...\n');
  let passed = 0;
  let total = 0;

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer demo_token_admin',
  };

  // TEST 1: API Key & Client Configuration
  total++;
  console.log('Test 1: Verifying Sarvam AI API Key Configuration...');
  const activeKey = getSarvamApiKey();
  if (activeKey && activeKey.startsWith('sk_')) {
    console.log(`  ✅ TEST 1 PASSED: Active Sarvam API key configured: ${activeKey.slice(0, 10)}...${activeKey.slice(-4)}`);
    passed++;
  } else {
    throw new Error('Test 1 Failed: Sarvam API Key not found or invalid format');
  }

  // TEST 2: Text Language Identification (/text-lid)
  total++;
  console.log('Test 2: Verifying Sarvam Text Language Identification (/text-lid)...');
  try {
    const hindiDetect = await detectLanguage('मेरे पास 500 किलो टमाटर हैं बेचने के लिए');
    const englishDetect = await detectLanguage('I have fresh produce available for bulk trade');
    if (hindiDetect.detectedLanguage === 'hi-IN' && englishDetect.detectedLanguage === 'en-IN') {
      console.log(`  ✅ TEST 2 PASSED: Language ID verified (Hindi: ${hindiDetect.detectedLanguage}, English: ${englishDetect.detectedLanguage})`);
      passed++;
    } else {
      throw new Error(`Unexpected language detection result: Hindi=${hindiDetect.detectedLanguage}, English=${englishDetect.detectedLanguage}`);
    }
  } catch (err: any) {
    throw new Error(`Test 2 Failed: ${err.message}`);
  }

  // TEST 3: Neural Translation with Mayura v1 (/translate)
  total++;
  console.log('Test 3: Verifying Neural Translation with Mayura v1 (/translate)...');
  try {
    const trans = await translateText({
      input: 'Direct trade from farm to mandi without middleman cut.',
      sourceLanguageCode: 'en-IN',
      targetLanguageCode: 'hi-IN',
    });
    if (trans.translatedText && trans.translatedText.length > 0 && !trans.fallbackUsed) {
      console.log(`  ✅ TEST 3 PASSED: Translation successful: "${trans.translatedText}"`);
      passed++;
    } else {
      throw new Error(`Translation failed or used fallback: ${JSON.stringify(trans)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 3 Failed: ${err.message}`);
  }

  // TEST 4: Neural Text-to-Speech with Bulbul v3 (/text-to-speech)
  total++;
  console.log('Test 4: Verifying Neural Text-to-Speech with Bulbul v3 (/text-to-speech)...');
  try {
    const tts = await generateSpeech({
      text: 'कृषि सेतु में आपका स्वागत है। आपकी फसल का सही मूल्य।',
      targetLanguageCode: 'hi-IN',
      speaker: 'aditya',
    });
    if (tts.audioBase64 && tts.audioBase64.length > 1000 && !tts.fallbackUsed) {
      console.log(`  ✅ TEST 4 PASSED: Audio generated via Bulbul v3 (audio size: ${tts.audioBase64.length} chars)`);
      passed++;
    } else {
      throw new Error(`TTS failed or fallback used: ${JSON.stringify(tts)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 4 Failed: ${err.message}`);
  }

  // TEST 5: Speech-to-Text with Saaras v3 (/api/ai/speech-to-text)
  total++;
  console.log('Test 5: Verifying Speech-to-Text with Saaras v3 (/api/ai/speech-to-text)...');
  try {
    const sampleRate = 16000;
    const numSamples = sampleRate * 1;
    const buffer = Buffer.alloc(44 + numSamples * 2);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: 'audio/wav' });
    formData.append('file', blob, 'sample.wav');

    const res = await fetch(`${BASE_URL}/api/ai/speech-to-text`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.provider === 'sarvam') {
      console.log(`  ✅ TEST 5 PASSED: STT processed audio with provider '${data.provider}' (detected language: ${data.languageCode})`);
      passed++;
    } else {
      throw new Error(`STT failed: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 5 Failed: ${err.message}`);
  }

  // TEST 6: Chat Completions with Sarvam 105B (/v1/chat/completions)
  total++;
  console.log('Test 6: Verifying Conversational AI Reasoning with Sarvam 105B...');
  try {
    const chatReply = await generateChatCompletion([
      { role: 'system', content: 'You are an agricultural advisor for KrishiSetu. Reply briefly in Hindi.' },
      { role: 'user', content: 'Tamatar ki fasal me fal chhedak kitak se bachav ka saral upaay kya hai?' },
    ], {
      maxTokens: 120,
    });
    if (chatReply && chatReply.length > 20) {
      console.log(`  ✅ TEST 6 PASSED: Sarvam 105B reasoned and replied: "${chatReply.slice(0, 80)}..."`);
      passed++;
    } else {
      throw new Error(`Chat completion output insufficient: "${chatReply}"`);
    }
  } catch (err: any) {
    throw new Error(`Test 6 Failed: ${err.message}`);
  }

  // TEST 7: Krishi Assistant Multi-Turn Advisory + Voice
  total++;
  console.log('Test 7: Verifying Krishi Assistant Multi-Turn Intent & Voice Engine...');
  try {
    const assistantRes = await processKrishiAssistantRequest({
      userQuery: 'Mere paas 500 kilo tamatar hain',
      isVoice: false,
    });
    if (
      assistantRes.intent === 'CREATE_LISTING' &&
      assistantRes.draftAction?.requiresConfirmation === true &&
      assistantRes.draftAction.params.quantity === 500
    ) {
      console.log('  ✅ TEST 7 PASSED: Krishi Assistant accurately parsed intent and drafted listing with confirmation guardrail');
      passed++;
    } else {
      throw new Error(`Assistant response unexpected: ${JSON.stringify(assistantRes)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 7 Failed: ${err.message}`);
  }

  // TEST 8: Transporter Voice Command Lifecycle (/api/sarvam/transporter-command)
  total++;
  console.log('Test 8: Verifying Transporter Voice Command Lifecycle (/api/sarvam/transporter-command)...');
  try {
    const cmd1 = await fetch(`${BASE_URL}/api/sarvam/transporter-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'फार्म पर पहुंच गए और माल लोड हो गया', currentStatus: 'ACCEPTED' }),
    });
    const d1 = await cmd1.json();

    const cmd2 = await fetch(`${BASE_URL}/api/sarvam/transporter-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'गाड़ी हाईवे पर है रास्ते में हैं', currentStatus: 'PICKED_UP' }),
    });
    const d2 = await cmd2.json();

    if (d1.status === 'PICKED_UP' && d2.status === 'IN_TRANSIT') {
      console.log('  ✅ TEST 8 PASSED: Spoken Hindi transporter commands successfully transitioned trip lifecycle stages');
      passed++;
    } else {
      throw new Error(`Transporter command unexpected: step1=${d1.status}, step2=${d2.status}`);
    }
  } catch (err: any) {
    throw new Error(`Test 8 Failed: ${err.message}`);
  }

  // TEST 9: DemandSense & SellSmart Advisory Engines
  total++;
  console.log('Test 9: Verifying DemandSense & SellSmart Advisory APIs...');
  try {
    const dsRes = await fetch(`${BASE_URL}/api/ai/demandsense`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ crop: 'Tomato', location: 'Lucknow' }),
    });
    const dsData = await dsRes.json();

    const ssRes = await fetch(`${BASE_URL}/api/ai/sellsmart`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ crop: 'Tomato', quantityKg: 500, farmerAskingPrice: 24, location: 'Lucknow' }),
    });
    const ssData = await ssRes.json();

    if (dsData.success && ssData.success && Array.isArray(ssData.sellingOptions)) {
      console.log(`  ✅ TEST 9 PASSED: DemandSense forecast (${dsData.forecast.trendDirection}) and SellSmart price optimization verified`);
      passed++;
    } else {
      throw new Error(`DemandSense or SellSmart failed: ${JSON.stringify({ dsData, ssData })}`);
    }
  } catch (err: any) {
    throw new Error(`Test 9 Failed: ${err.message}`);
  }

  // TEST 10: Vision Analysis Quality Grading Contract (/api/ai/vision/analyze)
  total++;
  console.log('Test 10: Verifying Vision Analysis Quality Grading API (/api/ai/vision/analyze)...');
  try {
    const res = await fetch(`${BASE_URL}/api/ai/vision/analyze`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.data) {
      console.log(`  ✅ TEST 10 PASSED: Vision analysis contract verified (Detected: ${data.data.detectedCrop}, Condition: ${data.data.visualCondition})`);
      passed++;
    } else {
      throw new Error(`Vision analysis failed: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    throw new Error(`Test 10 Failed: ${err.message}`);
  }

  console.log(`\n🎉 Comprehensive Sarvam AI Test Suite Complete: ${passed}/${total} test suites verified successfully!\n`);
}

runComprehensiveAITests().catch((err) => {
  console.error('\n❌ Comprehensive AI Test Suite Failed:');
  console.error(err);
  process.exit(1);
});
