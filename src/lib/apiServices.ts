// API Client service for Google Cloud Vision, Maps, Geolocation, and Sarvam AI

export interface VisionAnalysisResult {
  success: boolean;
  source: string;
  cropName: string;
  variety: string;
  grade: string;
  freshnessScore: number;
  freshnessRemainingHours: number;
  defectsFound: string[];
  confidence: number;
  suggestedPrice: number;
  inspectionSummary?: string;
  labels?: string[];
  visionStatus?: string;
}

export interface SarvamChatResponse {
  success: boolean;
  source: string;
  reply: string;
  error?: string;
}

export interface ApiStatusResponse {
  status: string;
  keys: {
    cloudVision: { configured: boolean; prefix: string; name: string };
    maps: { configured: boolean; prefix: string; name: string };
    geolocation: { configured: boolean; prefix: string; name: string };
    sarvam: { configured: boolean; prefix: string; name: string; models: any };
    gemini: { configured: boolean; name: string };
  };
}

// 1. Google Cloud Vision API Crop Quality Grading
export async function analyzeCropPhoto(params: {
  imageBase64?: string;
  imageUrl?: string;
  cropTypeHint?: string;
}): Promise<VisionAnalysisResult> {
  const res = await fetch('/api/vision/crop-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to analyze crop photo');
  }
  return res.json();
}

// 2. Sarvam AI Chat Completion (sarvam-105b)
export async function querySarvamAI(
  messages: Array<{ role: string; content: string }>,
  userRole = 'FARMER'
): Promise<SarvamChatResponse> {
  const res = await fetch('/api/sarvam/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, userRole }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to communicate with Sarvam AI');
  }
  return res.json();
}

// 3. Sarvam AI Text-to-Speech (bulbul:v3)
let currentAudio: HTMLAudioElement | null = null;

export async function speakWithSarvamAI(
  text: string,
  speaker = 'aditya'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const res = await fetch('/api/sarvam/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        speaker,
        target_language_code: 'hi-IN',
      }),
    });

    const data = await res.json();
    if (data.audioBase64) {
      const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
      const audio = new Audio(audioUrl);
      currentAudio = audio;
      await audio.play();
      return { success: true };
    }

    // Fallback to browser Web Speech if needed
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
      return { success: true };
    }

    return { success: false, error: data.error };
  } catch (err: any) {
    console.warn('Sarvam TTS playback notice:', err);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
      return { success: true };
    }
    return { success: false, error: err.message };
  }
}

// 4. Google Geolocation API
export async function getLiveGPSLocation(): Promise<{
  lat: number;
  lng: number;
  accuracy: number;
  source: string;
  regionName: string;
}> {
  // First try browser native high-accuracy GPS if allowed
  if ('geolocation' in navigator) {
    try {
      const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { timeout: 3000, enableHighAccuracy: true }
        );
      });
      return {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        source: 'device-gps',
        regionName: 'Live Device GPS',
      };
    } catch {
      // Continue to Google Geolocation API
    }
  }

  // Google Geolocation API backend route
  const res = await fetch('/api/geolocation/current', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    return {
      lat: 26.9284,
      lng: 81.1834,
      accuracy: 50,
      source: 'fallback-hub',
      regionName: 'बैजनाथपुर, बाराबंकी (UP Mandi Belt)',
    };
  }
  return res.json();
}

// 5. Check Active Key Status
export async function fetchApiStatus(): Promise<ApiStatusResponse> {
  const res = await fetch('/api/status/keys');
  if (!res.ok) {
    throw new Error('Failed to fetch API status');
  }
  return res.json();
}

// 6. Sarvam AI Transporter Voice Status Command
export interface TransporterCommandResult {
  success: boolean;
  status: 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';
  stepNumber: number;
  statusHindi: string;
  hindiFeedback: string;
  source?: string;
}

export async function parseTransporterVoiceCommand(
  command: string,
  currentStatus?: string
): Promise<TransporterCommandResult> {
  const res = await fetch('/api/sarvam/transporter-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, currentStatus }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to process voice command');
  }
  return res.json();
}

// 7. Order Pricing Calculator (Money Separation R-001 & R-004)
export async function calculateOrderPricingApi(params: {
  items: Array<{ pricePerKg: number; quantityKg: number }>;
  deliveryMethod?: 'DELIVERY_PARTNER' | 'SELF_PICKUP';
  distanceKm?: number;
  vehicleType?: 'MINI_TRUCK' | 'PICKUP_VAN' | 'LARGE_TRUCK';
}) {
  const res = await fetch('/api/orders/calculate-pricing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to calculate pricing');
  }
  return res.json();
}

// 8. Order State Machine Transition API
export async function transitionOrderStatusApi(
  orderId: string,
  currentStatus: string,
  targetStatus: string,
  callerRole = 'FARMER',
  isSelfPickup = false
) {
  const res = await fetch(`/api/orders/${orderId}/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': callerRole },
    body: JSON.stringify({ currentStatus, targetStatus, callerRole, isSelfPickup }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'State transition rejected');
  }
  return res.json();
}

// 9. Transporter Acceptance with Freshness Constraint
export async function acceptTransporterTripApi(tripId: string, etaHours = 2, freshnessWindowHours = 24) {
  const res = await fetch('/api/transporters/accept-trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripId, etaHours, freshnessWindowHours }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Transporter acceptance failed');
  }
  return res.json();
}

// 10. AI Services Clients
export async function fetchDemandSenseApi(params: {
  crop?: string;
  mandiLocation?: string;
  historicalDemandKg?: number[];
  currentArrivalKg?: number;
}) {
  const res = await fetch('/api/ai/demandsense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'DemandSense failed');
  }
  return res.json();
}

export async function fetchSellSmartApi(params: {
  crop?: string;
  quantityKg?: number;
  localMandiPriceKg?: number;
  b2bBuyerPriceKg?: number;
}) {
  const res = await fetch('/api/ai/sellsmart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'SellSmart failed');
  }
  return res.json();
}

export async function fetchSmartMatchApi(params: any) {
  const res = await fetch('/api/ai/smartmatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'SmartMatch failed');
  }
  return res.json();
}

export async function fetchSmartTransportApi(params: any) {
  const res = await fetch('/api/ai/smarttransport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'SmartTransport failed');
  }
  return res.json();
}

export async function extractVoiceListingApi(voiceText: string) {
  const res = await fetch('/api/ai/krishi-assistant/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voiceText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Voice extraction failed');
  }
  return res.json();
}

export async function fetchLiveMandiPricesApi(params?: {
  state?: string;
  commodity?: string;
  limit?: number;
  forceRefresh?: boolean;
  signal?: AbortSignal;
}) {
  const query = new URLSearchParams();
  if (params?.state) query.set('state', params.state);
  if (params?.commodity) query.set('commodity', params.commodity);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.forceRefresh) query.set('forceRefresh', 'true');

  try {
    const res = await fetch(`/api/mandi-prices/live?${query.toString()}`, {
      signal: params?.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errorObj: any = new Error(err.error || `Mandi API returned status ${res.status}`);
      errorObj.status = res.status;
      errorObj.fallbackUsed = err.fallbackUsed;
      throw errorObj;
    }
    return res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      const abortErr: any = new Error('Mandi data request timed out or was cancelled');
      abortErr.isTimeout = true;
      throw abortErr;
    }
    throw err;
  }
}

