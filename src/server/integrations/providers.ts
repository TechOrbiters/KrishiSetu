import { analyzeProduceImage, VisionAnalysisResult } from "../../lib/google/vision";
import { calculateRoute } from "../../lib/maps/routing";
import { LatLng, RouteResult } from "../../lib/maps/types";
import { getManualLocationFallback } from "../../lib/location/geolocation";
import { transcribeAudio, STTResult } from "../../lib/sarvam/stt";
import { generateSpeech, TTSResult, TTSRequest } from "../../lib/sarvam/tts";
import { translateText, TranslateRequest, TranslateResult } from "../../lib/sarvam/translate";
import { detectLanguage, LanguageDetectionResult } from "../../lib/sarvam/language";

// Provider Interfaces for Future Extensibility / Swappability
export interface VisionProvider {
  analyzeProduce(imageSource: string): Promise<VisionAnalysisResult>;
}

export interface GeocodeResult {
  formattedAddress: string;
  location: LatLng;
  placeId?: string;
}

export interface MapsProvider {
  geocode(address: string): Promise<GeocodeResult | null>;
  calculateRoute(origin: LatLng, destination: LatLng): Promise<RouteResult>;
}

export interface SpeechToTextProvider {
  transcribe(audio: Buffer | string): Promise<STTResult>;
}

export interface TextToSpeechProvider {
  synthesize(request: TTSRequest): Promise<TTSResult>;
}

export interface TranslationProvider {
  translate(request: TranslateRequest): Promise<TranslateResult>;
}

export interface LanguageDetectorProvider {
  detect(text: string): Promise<LanguageDetectionResult>;
}

// Concrete Implementations
export class GoogleVisionProviderImpl implements VisionProvider {
  async analyzeProduce(imageSource: string): Promise<VisionAnalysisResult> {
    return analyzeProduceImage(imageSource);
  }
}

export class OSRMMapsProviderImpl implements MapsProvider {
  async geocode(address: string): Promise<GeocodeResult | null> {
    const pos = getManualLocationFallback(address);
    return {
      formattedAddress: address,
      location: { lat: pos.latitude, lng: pos.longitude },
    };
  }

  async calculateRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
    return calculateRoute(origin, destination);
  }
}

export class SarvamSTTProviderImpl implements SpeechToTextProvider {
  async transcribe(audio: Buffer | string): Promise<STTResult> {
    return transcribeAudio(audio);
  }
}

export class SarvamTTSProviderImpl implements TextToSpeechProvider {
  async synthesize(request: TTSRequest): Promise<TTSResult> {
    return generateSpeech(request);
  }
}

export class SarvamTranslationProviderImpl implements TranslationProvider {
  async translate(request: TranslateRequest): Promise<TranslateResult> {
    return translateText(request);
  }
}

export class SarvamLanguageDetectorImpl implements LanguageDetectorProvider {
  async detect(text: string): Promise<LanguageDetectionResult> {
    return detectLanguage(text);
  }
}

import { activeDataGovProvider } from "./market/dataGovProvider";

// Global Provider Registry (KRISHISETU Provider Manager)
export const activeProviders = {
  vision: new GoogleVisionProviderImpl(),
  maps: new OSRMMapsProviderImpl(),
  market: activeDataGovProvider,
  stt: new SarvamSTTProviderImpl(),
  tts: new SarvamTTSProviderImpl(),
  translation: new SarvamTranslationProviderImpl(),
  languageDetector: new SarvamLanguageDetectorImpl(),
};
