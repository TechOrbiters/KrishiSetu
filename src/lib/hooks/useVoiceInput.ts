"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { parseMandiIntent, ExtractedIntent as MandiExtractedIntent } from "@/lib/mandiIntent";

export interface VoiceIntent {
  intent: string;
  crop?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  pricePerKg?: number;
  minOrder?: number;
  quality?: 'सामान्य' | 'अच्छी' | 'प्रीमियम';
  location?: string;
  rawText?: string;
}

export interface VoiceInputResult {
  transcript: string;
  languageCode: string;
  provider: string;
  extractedIntent?: VoiceIntent;
  field?: string;
}

export type VoiceState =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "processing"
  | "success"
  | "error";

interface UseVoiceInputOptions {
  onSuccess?: (result: VoiceInputResult) => void;
  onError?: (error: string) => void;
  maxDurationSeconds?: number;
  languageCode?: string;
}

/**
 * Dynamic MIME type detection for browser MediaRecorder.
 * Prefers WebM Opus without forced WAV conversions.
 */
function getBestSupportedMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }
  const candidateTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/wav",
  ];
  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

/**
 * Custom React hook for Voice Input.
 *
 * Flow:
 * MIC CLICK -> permission -> RECORDING -> STOP -> WEBM BLOB
 * -> POST /api/ai/speech-to-text -> Server -> Sarvam Saaras v3 -> transcript
 * -> onSuccess() -> Active field updated in form
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { onSuccess, onError, maxDurationSeconds = 30, languageCode = "hi-IN" } = options;

  const [state, setState] = useState<VoiceState>("idle");
  const [activeField, setActiveField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeFieldRef = useRef<string | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const fallbackTranscriptRef = useRef<string>("");

  // Clean up media tracks and duration counters
  const cleanupMedia = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setRecordingSeconds(0);
  }, []);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  /**
   * Uploads the recorded audio Blob to our secure server-side endpoint.
   * NEVER sends API keys from browser.
   */
  const uploadAndTranscribe = async (audioBlob: Blob, field: string | null) => {
    setState("processing");

    try {
      // Validate recorded audio size
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("कोई आवाज़ रिकॉर्ड नहीं हुई (No audio recorded). कृपया दोबारा बोलें।");
      }

      let transcript = "";
      let resLanguage = languageCode;
      let resProvider = "sarvam";
      let extractedIntent: VoiceIntent | undefined;

      const formData = new FormData();
      // Send original recorded WebM Blob directly to /api/ai/speech-to-text
      const fileExt = audioBlob.type.includes("webm") ? "webm" : audioBlob.type.includes("wav") ? "wav" : "webm";
      const file = new File([audioBlob], `recording.${fileExt}`, {
        type: audioBlob.type || "audio/webm",
      });
      formData.append("file", file);
      formData.append("language_code", languageCode);
      formData.append("model", "saaras:v3");
      formData.append("mode", "transcribe");

      // Post to our own backend API proxy (no trailing slash redirect issues)
      const res = await fetch("/api/ai/speech-to-text", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && json?.transcript) {
        transcript = json.transcript.trim();
        resLanguage = json.languageCode || languageCode;
        resProvider = "sarvam";
        extractedIntent = json.extractedIntent;
      } else {
        // Log safe server error response (no API keys)
        console.warn("[useVoiceInput] Server STT response:", res.status, json);

        // Optional UX fallback: use browser SpeechRecognition if it captured the speech
        if (fallbackTranscriptRef.current.trim()) {
          console.info("[useVoiceInput] Utilizing browser SpeechRecognition fallback.");
          transcript = fallbackTranscriptRef.current.trim();
          resProvider = "browser_speech_recognition";
        } else {
          const userMsg =
            json?.error?.message ||
            "आवाज़ पहचानने में समस्या हुई। कृपया पुनः प्रयास करें या मैन्युअल रूप से लिखें।";
          throw new Error(userMsg);
        }
      }

      if (!transcript) {
        throw new Error("कोई स्पष्ट आवाज़ सुनाई नहीं दी। कृपया माइक के पास बोलें या टाइप करें।");
      }

      // Always parse Mandi entities from transcript to guarantee full entity extraction
      const localIntent = parseMandiIntent(transcript);
      if (!extractedIntent) {
        extractedIntent = localIntent;
      } else {
        extractedIntent = {
          ...localIntent,
          ...extractedIntent,
          crop: extractedIntent.crop || localIntent.crop,
          category: extractedIntent.category || localIntent.category,
          quantity: extractedIntent.quantity || localIntent.quantity,
          pricePerKg: extractedIntent.pricePerKg || localIntent.pricePerKg,
          minOrder: extractedIntent.minOrder || localIntent.minOrder,
          quality: extractedIntent.quality || localIntent.quality,
        };
      }

      setState("success");
      setErrorMessage(null);

      const result: VoiceInputResult = {
        transcript,
        languageCode: resLanguage,
        provider: resProvider,
        extractedIntent,
        field: field || undefined,
      };

      if (onSuccess) {
        onSuccess(result);
      }

      // Reset to idle after brief indicator
      setTimeout(() => {
        setState("idle");
        setActiveField(null);
      }, 1200);
    } catch (err: any) {
      console.error("[useVoiceInput] Transcription error:", err);
      const msg = err.message || "आवाज़ पहचानने में त्रुटि हुई।";
      setState("error");
      setErrorMessage(msg);
      if (onError) onError(msg);
    } finally {
      cleanupMedia();
    }
  };

  /**
   * Starts microphone recording with standard MediaRecorder.
   */
  const startRecording = useCallback(
    async (fieldId?: string) => {
      // Check browser MediaDevices support
      if (
        typeof window === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        const msg = "आपका ब्राउज़र माइक्रोफ़ोन सपोर्ट नहीं करता (Microphone not supported).";
        setState("error");
        setErrorMessage(msg);
        if (onError) onError(msg);
        return;
      }

      // If already recording, stop first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        return;
      }

      cleanupMedia();
      setErrorMessage(null);
      setState("requesting-permission");
      const targetField = fieldId || null;
      setActiveField(targetField);
      activeFieldRef.current = targetField;
      fallbackTranscriptRef.current = "";

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        audioStreamRef.current = stream;
        audioChunksRef.current = [];

        const selectedMime = getBestSupportedMimeType();
        const options: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        // Collect all data chunks as they become available
        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        // Wait for final recording stop event before constructing Blob
        mediaRecorder.onstop = () => {
          const finalMime = mediaRecorder.mimeType || selectedMime || "audio/webm";
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });

          // Stop all audio hardware tracks immediately after recording stops
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach((track) => track.stop());
            audioStreamRef.current = null;
          }

          // Upload and transcribe the real audio blob
          uploadAndTranscribe(audioBlob, activeFieldRef.current);
        };

        // Optional parallel Web Speech API fallback for zero-loss UX
        try {
          const SpeechRec =
            typeof window !== "undefined"
              ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
              : null;
          if (SpeechRec) {
            const recognizer = new SpeechRec();
            recognizer.continuous = true;
            recognizer.interimResults = true;
            recognizer.lang = languageCode;
            recognizer.onresult = (e: any) => {
              let text = "";
              for (let i = 0; i < e.results.length; i++) {
                text += e.results[i][0].transcript + " ";
              }
              fallbackTranscriptRef.current = text.trim();
            };
            recognizer.onerror = () => {};
            recognizer.start();
            speechRecognitionRef.current = recognizer;
          }
        } catch (recErr) {
          // Browser SpeechRecognition not available; standard backend STT will handle audio
        }

        // Start recording and slice data every 250ms
        mediaRecorder.start(250);
        setState("recording");

        // Duration counter
        setRecordingSeconds(0);
        durationTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        // Auto-stop safety timer at max duration (e.g. 30 seconds)
        autoStopTimerRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }, maxDurationSeconds * 1000);
      } catch (err: any) {
        console.error("[useVoiceInput] Permission/access error:", err);
        cleanupMedia();
        setState("error");
        setActiveField(null);

        let msg = "माइक्रोफ़ोन एक्सेस करने में असमर्थ।";
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg = "माइक्रोफ़ोन की अनुमति अस्वीकार कर दी गई है। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          msg = "कोई माइक्रोफ़ोन नहीं मिला। कृपया माइक कनेक्ट करें।";
        } else if (err.name === "NotReadableError") {
          msg = "माइक्रोफ़ोन किसी अन्य ऐप द्वारा उपयोग किया जा रहा है।";
        }
        setErrorMessage(msg);
        if (onError) onError(msg);
      }
    },
    [cleanupMedia, languageCode, maxDurationSeconds, onError]
  );

  /**
   * Manually stops the recording; triggers mediaRecorder.onstop.
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Cancels the active recording without uploading.
   */
  const cancelRecording = useCallback(() => {
    cleanupMedia();
    setState("idle");
    setActiveField(null);
    setErrorMessage(null);
  }, [cleanupMedia]);

  return {
    state,
    isRecording: state === "recording",
    isProcessing: state === "processing",
    isRequestingPermission: state === "requesting-permission",
    activeField,
    errorMessage,
    recordingSeconds,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError: () => setErrorMessage(null),
  };
}
