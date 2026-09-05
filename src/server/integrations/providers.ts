import { analyzeProduceImage, VisionAnalysisResult } from "../../lib/google/vision";
import { geocodeAddress, calculateRouteEta, RouteResult, GeocodeResult } from "../../lib/google/maps";
import { transcribeAudio, STTResult } from "../../lib/sarvam/stt";
import { generateSpeech, TTSResult, TTSRequest } from "../../lib/sarvam/tts";
import { translateText, TranslateRequest, TranslateResult } from "../../lib/sarvam/translate";
import { detectLanguage, LanguageDetectionResult } from "../../lib/sarvam/language";

// Provider Interfaces for Future Extensibility / Swappability
export interface VisionProvider {
  analyzeProduce(imageSource: string): Promise<VisionAnalysisResult>;
}

export interface MapsProvider {
  geocode(address: string): Promise<GeocodeResult | null>;
  calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteResult>;
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

export class GoogleMapsProviderImpl implements MapsProvider {
  async geocode(address: string): Promise<GeocodeResult | null> {
    return geocodeAddress(address);
  }

  async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteResult> {
    return calculateRouteEta(origin, destination);
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

// Global Provider Registry (KRISHISETU Provider Manager)
export const activeProviders = {
  vision: new GoogleVisionProviderImpl(),
  maps: new GoogleMapsProviderImpl(),
  stt: new SarvamSTTProviderImpl(),
  tts: new SarvamTTSProviderImpl(),
  translation: new SarvamTranslationProviderImpl(),
  languageDetector: new SarvamLanguageDetectorImpl(),
};
