# Google Cloud Vision Setup Guide — AI MANDI

## Purpose
Google Cloud Vision API provides assistive produce photo analysis for AI MANDI. It detects potential crops, visual condition, and damage indicators from uploaded photos to assist farmers during produce listing creation.

> [!IMPORTANT]
> Vision is strictly an **ASSISTIVE** feature. It does not automatically certify agricultural quality or make legally authoritative grading decisions. The farmer can review and edit all detected fields.

---

## Architecture & Security Classification
- **Classification**: SERVER ONLY (`GOOGLE_VISION_API_KEY`)
- **Client Exposure**: NEVER place `GOOGLE_VISION_API_KEY` in `NEXT_PUBLIC_` variables or browser JavaScript.
- **Upload Flow**:
  1. Client uploads produce photo to `POST /api/ai/vision/produce`.
  2. Server validates file format (JPG, PNG, WebP) and size (max 5MB).
  3. Server stores image in Supabase Storage (`produce-photos` bucket).
  4. Server calls Google Cloud Vision API with `GOOGLE_VISION_API_KEY`.
  5. Server normalizes response into typed domain model:
     ```ts
     {
       detectedCrop: string;
       confidence: number;
       visualCondition: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'UNKNOWN';
       damageIndicators: string[];
       suggestions: string[];
       modelTimestamp: string;
       fallbackUsed: boolean;
     }
     ```
  6. Returns result to client for farmer confirmation.

---

## Google Cloud Console Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create project `ai-mandi-prod`.
3. Navigate to **APIs & Services > Library**.
4. Search for **Cloud Vision API** and click **Enable**.
5. Navigate to **APIs & Services > Credentials**.
6. Create an API Key for Server-Side access:
   - **Key Name**: `AI MANDI Vision Server Key`
   - **API Restrictions**: Restrict key to **Cloud Vision API** only.
   - **Application Restrictions**: IP address restriction (for production server) or restricted server usage.

---

## Environment Variables
Add to `.env.local`:
```env
# GOOGLE VISION — SERVER ONLY
GOOGLE_VISION_API_KEY=AIzaSy... (Keep secret)
```

---

## Fallback Behavior
If Vision API fails, times out, or the API key is not configured, AI MANDI returns:
```json
{
  "detectedCrop": "Unspecified Produce",
  "confidence": 0,
  "visualCondition": "UNKNOWN",
  "damageIndicators": [],
  "suggestions": ["AI photo assistance unavailable. You can enter the details manually."],
  "fallbackUsed": true
}
```
The farmer is never blocked from creating a produce listing manually.
