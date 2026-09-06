"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceIntent {
  intent: string;
  crop?: string;
  quantity?: number;
  unit?: string;
  pricePerKg?: number;
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
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { onSuccess, onError, maxDurationSeconds = 30 } = options;

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

  // Clean up media tracks and timers
  const cleanupMedia = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
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

  const getBestSupportedMimeType = (): string => {
    if (typeof MediaRecorder === "undefined") return "audio/webm";
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/wav",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const uploadAndTranscribe = async (audioBlob: Blob, field: string | null) => {
    setState("processing");
    try {
      if (audioBlob.size === 0) {
        throw new Error("कोई आवाज़ रिकॉर्ड नहीं हुई (No audio recorded). कृपया दोबारा बोलें।");
      }

      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch("/api/ai/speech-to-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg =
          data?.error?.message || "आवाज़ पहचानने में समस्या आई। कृपया दोबारा प्रयास करें।";
        throw new Error(errorMsg);
      }

      const transcript = (data.transcript || "").trim();
      if (!transcript) {
        throw new Error("कोई स्पष्ट आवाज़ सुनाई नहीं दी। कृपया माइक के पास बोलें।");
      }

      setState("success");
      setErrorMessage(null);

      const result: VoiceInputResult = {
        transcript,
        languageCode: data.languageCode || "hi-IN",
        provider: data.provider || "sarvam",
        extractedIntent: data.extractedIntent,
        field: field || undefined,
      };

      if (onSuccess) {
        onSuccess(result);
      }

      // Reset to idle after a brief indicator
      setTimeout(() => {
        setState("idle");
        setActiveField(null);
      }, 1500);
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

  const startRecording = useCallback(
    async (fieldId?: string) => {
      // Check browser support
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
      const field = fieldId || null;
      setActiveField(field);
      activeFieldRef.current = field;

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

        const mimeType = getBestSupportedMimeType();
        const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
        const mediaRecorder = new MediaRecorder(stream, recorderOptions);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const finalMimeType = mediaRecorder.mimeType || mimeType || "audio/webm";
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
          uploadAndTranscribe(audioBlob, activeFieldRef.current);
        };

        mediaRecorder.start(250); // Slice data every 250ms
        setState("recording");

        // Duration timer
        setRecordingSeconds(0);
        durationTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        // Auto-stop safety timeout
        autoStopTimerRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }, maxDurationSeconds * 1000);
      } catch (err: any) {
        console.error("[useVoiceInput] Permission/start error:", err);
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
    [cleanupMedia, maxDurationSeconds, onError]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

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
