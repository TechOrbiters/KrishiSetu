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
  const speechRecognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>("");

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
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
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

  // Convert browser-captured WebM/Opus audio to standard PCM 16-bit WAV for Sarvam STT
  const convertBlobToWav = async (blob: Blob): Promise<Blob> => {
    try {
      const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;
      if (!AudioCtx) return blob;
      const ctx = new AudioCtx();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      ctx.close().catch(() => {});

      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const dataLength = channelData.length * 2;
      const buffer = new ArrayBuffer(44 + dataLength);
      const view = new DataView(buffer);

      const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };

      writeStr(0, "RIFF");
      view.setUint32(4, 36 + dataLength, true);
      writeStr(8, "WAVE");
      writeStr(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); // byte rate
      view.setUint16(32, 2, true); // block align
      view.setUint16(34, 16, true); // 16-bit
      writeStr(36, "data");
      view.setUint32(40, dataLength, true);

      let offset = 44;
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }

      return new Blob([view], { type: "audio/wav" });
    } catch (e) {
      console.warn("[useVoiceInput] WAV conversion notice:", e);
      return blob;
    }
  };

  const uploadAndTranscribe = async (audioBlob: Blob, field: string | null) => {
    setState("processing");
    try {
      if (audioBlob.size === 0 && !liveTranscriptRef.current) {
        throw new Error("कोई आवाज़ रिकॉर्ड नहीं हुई (No audio recorded). कृपया दोबारा बोलें।");
      }

      let transcript = "";
      let languageCode = "hi-IN";
      let provider = "sarvam";

      // 1. Try Sarvam AI STT directly with compliant 16-bit PCM WAV
      try {
        const wavBlob = await convertBlobToWav(audioBlob);
        const formData = new FormData();
        const file = new File([wavBlob], "recording.wav", { type: "audio/wav" });
        formData.append("file", file);
        formData.append("language_code", "hi-IN");
        formData.append("model", "saaras:v3");
        formData.append("mode", "transcribe");

        const sttRes = await fetch("https://api.sarvam.ai/speech-to-text", {
          method: "POST",
          headers: { "api-subscription-key": "sk_rsyrmj5p_FJlxTNuiqLJA1y3RpMVNZrJo" },
          body: formData,
        });
        if (sttRes.ok) {
          const sttData = await sttRes.json();
          const sttTranscript = sttData.transcript || sttData.transcription || "";
          if (sttTranscript.trim()) {
            transcript = sttTranscript.trim();
            languageCode = sttData.language_code || "hi-IN";
            provider = "sarvam_stt_live";
          }
        } else {
          const errData = await sttRes.json().catch(() => ({}));
          console.warn("[useVoiceInput] Sarvam STT returned status:", sttRes.status, errData);
        }
      } catch (sttErr) {
        console.warn("[useVoiceInput] Sarvam STT notice:", sttErr);
      }

      // 2. Native SpeechRecognition in-browser fallback
      if (!transcript && liveTranscriptRef.current.trim()) {
        transcript = liveTranscriptRef.current.trim();
        provider = "browser_speech_recognition";
      }

      if (!transcript) {
        throw new Error("कोई स्पष्ट आवाज़ सुनाई नहीं दी। कृपया माइक के पास बोलें या टाइप करें।");
      }

      setState("success");
      setErrorMessage(null);

      const result: VoiceInputResult = {
        transcript,
        languageCode,
        provider,
        extractedIntent: undefined,
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
        liveTranscriptRef.current = "";

        // Start browser Web Speech API in parallel for instant Hindi speech capture fallback
        try {
          const SpeechRec = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
          if (SpeechRec) {
            const recognizer = new SpeechRec();
            recognizer.continuous = true;
            recognizer.interimResults = true;
            recognizer.lang = "hi-IN";
            recognizer.onresult = (event: any) => {
              let text = "";
              for (let i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript + " ";
              }
              liveTranscriptRef.current = text.trim();
            };
            recognizer.onerror = () => {};
            recognizer.start();
            speechRecognitionRef.current = recognizer;
          }
        } catch (recErr) {
          // Web Speech API not available or blocked, fallback to Sarvam wav STT
        }

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
