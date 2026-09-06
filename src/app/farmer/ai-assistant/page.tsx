'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { callKrishiAssistant, transcribeAudioBlob } from '@/lib/api/client';

/* ========================================================
   Types
   ======================================================== */

interface DraftAction {
  actionType: string;
  summary: string;
  params: any;
  requiresConfirmation: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  audioBase64?: string | null;
  draftAction?: DraftAction;
  toolResult?: any;
  actionRoute?: string;
  actionText?: string;
  fallbackUsed?: boolean;
  isLoading?: boolean;
}

/* language code map — LanguageContext uses short codes (hi/en/ta) but Sarvam needs BCP-47 */
const LANG_CODE_MAP: Record<string, string> = {
  hi: 'hi-IN',
  en: 'en-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
};

/* ========================================================
   Audio helpers
   ======================================================== */

function playBase64Audio(base64: string): HTMLAudioElement | null {
  try {
    const clean = base64.replace(/^data:audio\/\w+;base64,/, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(() => null);
    audio.onended = () => URL.revokeObjectURL(url);
    return audio;
  } catch {
    return null;
  }
}

/* ========================================================
   Component
   ======================================================== */

export default function KrishiAIAssistantPage() {
  const { language, setLanguage, languages } = useLanguage();
  const { user } = useFarmerStore();
  const router = useRouter();

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'AI',
      text:
        'नमस्ते! मैं आपका कृषि साथी (AI सहायक) हूँ। आप अपनी बोली में मुझसे पूछ सकते हैं:\n' +
        '• "मेरे पास 500 किलो टमाटर हैं" → उपज सूची बनाएं\n' +
        '• "आज मंडी भाव क्या है?" → लाइव मूल्य\n' +
        '• "खरीदार ढूंढो" → माँग सूची\n' +
        '• "मेरी कमाई बताओ" → भुगतान लेजर',
    },
  ]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ----------------------------------------------------
     Core: send message → real backend
     ---------------------------------------------------- */
  const sendToAssistant = useCallback(
    async (query: string, opts: { isVoice?: boolean } = {}) => {
      if (!query.trim() || isProcessing) return;

      const userMsgId = `u_${Date.now()}`;
      const loadingMsgId = `ai_loading_${Date.now()}`;

      // Add user message + loading placeholder
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, sender: 'USER', text: query },
        { id: loadingMsgId, sender: 'AI', text: '...', isLoading: true },
      ]);
      setInputQuery('');
      setIsProcessing(true);

      try {
        const sarvamLang = LANG_CODE_MAP[language] || 'hi-IN';
        const result = await callKrishiAssistant({
          userQuery: query,
          isVoice: opts.isVoice ?? false,
          languageCode: sarvamLang,
          userId: user?.id || undefined,
        });

        const aiData = result.data;
        const actionRoute = getActionRoute(aiData?.intent);

        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'AI',
          text: aiData?.responseText || 'माफ करें, मुझे समझ नहीं आया। फिर से पूछें।',
          audioBase64: aiData?.audioBase64 || null,
          draftAction: aiData?.draftAction,
          toolResult: aiData?.toolResult,
          fallbackUsed: aiData?.fallbackUsed || false,
          actionRoute: actionRoute?.route,
          actionText: actionRoute?.label,
        };

        // Replace loading placeholder
        setMessages((prev) => prev.filter((m) => m.id !== loadingMsgId).concat(aiMsg));
      } catch {
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== loadingMsgId)
            .concat({
              id: `ai_err_${Date.now()}`,
              sender: 'AI',
              text: 'सहायक से संपर्क करने में त्रुटि हुई। कृपया पुनः प्रयास करें।',
              fallbackUsed: true,
            })
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, language, user]
  );

  /* ----------------------------------------------------
     Voice: MediaRecorder → STT → assistant
     ---------------------------------------------------- */
  const startVoiceInput = async () => {
    if (isListening) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        setIsListening(false);
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        // Show "transcribing..." placeholder
        const transcribingId = `transcribing_${Date.now()}`;
        setMessages((prev) => [...prev, { id: transcribingId, sender: 'AI', text: '🎤 आपकी आवाज़ समझी जा रही है...', isLoading: true }]);
        setIsProcessing(true);

        const sttResult = await transcribeAudioBlob(blob);
        setMessages((prev) => prev.filter((m) => m.id !== transcribingId));
        setIsProcessing(false);

        if (sttResult.success && sttResult.data?.transcript) {
          await sendToAssistant(sttResult.data.transcript, { isVoice: true });
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `stt_err_${Date.now()}`,
              sender: 'AI',
              text: 'आवाज़ पहचानने में समस्या आई। कृपया टाइप करके पूछें।',
              fallbackUsed: true,
            },
          ]);
        }
      };

      mr.start();
      setIsListening(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `mic_err_${Date.now()}`,
          sender: 'AI',
          text: 'माइक्रोफ़ोन एक्सेस नहीं मिली। ब्राउज़र सेटिंग्स में अनुमति दें।',
          fallbackUsed: true,
        },
      ]);
    }
  };

  /* ----------------------------------------------------
     TTS Playback
     ---------------------------------------------------- */
  const handlePlayAudio = (msg: ChatMessage) => {
    if (playingMsgId === msg.id) {
      // Stop current playback
      currentAudio?.pause();
      setPlayingMsgId(null);
      setCurrentAudio(null);
      return;
    }

    if (!msg.audioBase64) return;

    currentAudio?.pause();
    const audio = playBase64Audio(msg.audioBase64);
    if (audio) {
      setPlayingMsgId(msg.id);
      setCurrentAudio(audio);
      audio.onended = () => {
        setPlayingMsgId(null);
        setCurrentAudio(null);
      };
    }
  };

  /* ----------------------------------------------------
     Confirm draft action
     ---------------------------------------------------- */
  const handleConfirmAction = async (draft: DraftAction) => {
    if (draft.actionType === 'CREATE_LISTING') {
      // Notify backend then redirect with pre-filled params
      await callKrishiAssistant({
        userQuery: '',
        userId: user?.id || undefined,
        languageCode: LANG_CODE_MAP[language] || 'hi-IN',
        confirmedAction: { actionType: 'CREATE_LISTING', params: draft.params },
      });

      // Navigate to new listing form with query params pre-filled
      const params = new URLSearchParams({
        crop: draft.params.crop || '',
        quantity: String(draft.params.quantity || ''),
        unit: draft.params.unit || 'kg',
        price: String(draft.params.pricePerKg || ''),
        source: 'assistant',
      });
      router.push(`/farmer/listings/new?${params.toString()}`);
    }
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, draftAction: undefined, text: m.text + '\n\n❌ रद्द किया गया।' } : m
      )
    );
  };

  /* ----------------------------------------------------
     Quick prompt chips
     ---------------------------------------------------- */
  const QUICK_PROMPTS = [
    '500 किलो टमाटर कहाँ बेचूँ?',
    'आज टमाटर का भाव क्या है?',
    'मेरी कमाई बताओ',
    'ट्रांसपोर्टर चाहिए',
    'माँग पूर्वानुमान बताओ',
  ];

  /* ======================================================
     Render
     ====================================================== */
  return (
    <FarmerLayout>
      <div className="space-y-4 max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)]">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-tight">कृषि साथी — AI सहायक</h1>
              <p className="text-xs text-purple-200">वॉयस-फर्स्ट बहुभाषी प्लेटफॉर्म सहायक</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-purple-200 hidden sm:inline">भाषा:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-white/20 text-white p-1.5 rounded-lg border border-white/30 font-bold focus:outline-none cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} className="text-slate-900">
                  {l.localName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none flex-shrink-0">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => sendToAssistant(prompt)}
              disabled={isProcessing}
              className="bg-white hover:bg-purple-50 disabled:opacity-50 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors shadow-2xs"
            >
              🎤 &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-white rounded-2xl border border-brand-border p-4 overflow-y-auto space-y-4 shadow-2xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed space-y-3 ${
                  m.sender === 'USER'
                    ? 'bg-brand-green text-white font-semibold rounded-br-none'
                    : 'bg-purple-50 border border-purple-200 text-slate-900 rounded-bl-none'
                }`}
              >
                {/* AI header */}
                {m.sender === 'AI' && (
                  <div className="flex items-center justify-between text-brand-purple font-bold text-[11px] pb-1 border-b border-purple-200/60">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> कृषि साथी AI
                      {m.fallbackUsed && (
                        <span className="ml-1 text-amber-600 font-normal">(fallback)</span>
                      )}
                    </span>
                    {m.audioBase64 && (
                      <button
                        onClick={() => handlePlayAudio(m)}
                        className="p-0.5 hover:bg-purple-200/50 rounded"
                        title={playingMsgId === m.id ? 'रोकें' : 'आवाज़ सुनें'}
                      >
                        {playingMsgId === m.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-purple-700" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-purple-700" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Loading spinner */}
                {m.isLoading ? (
                  <div className="flex items-center gap-2 text-purple-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{m.text}</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{m.text}</p>
                )}

                {/* Confirmation Card */}
                {m.draftAction?.requiresConfirmation && !m.isLoading && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-800 text-[11px]">पुष्टि करें</p>
                        <p className="text-slate-700 text-[11px] mt-0.5">{m.draftAction.summary}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirmAction(m.draftAction!)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-brand-green text-white font-bold px-3 py-2 rounded-lg text-[11px] hover:bg-brand-deep transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> हाँ, सूची बनाएं
                      </button>
                      <button
                        onClick={() => handleCancelAction(m.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-lg text-[11px] hover:bg-slate-200 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> रद्द करें
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Route Button */}
                {m.actionRoute && !m.isLoading && (
                  <Link
                    href={m.actionRoute}
                    className="inline-flex items-center gap-1.5 bg-brand-purple text-white font-bold px-3.5 py-2 rounded-xl text-xs hover:bg-purple-800 transition-colors shadow-xs"
                  >
                    <span>{m.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-white p-3 rounded-2xl border border-brand-border flex items-center gap-2 shadow-sm flex-shrink-0">
          <button
            onClick={startVoiceInput}
            disabled={isProcessing && !isListening}
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-all ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-purple-100 text-brand-purple hover:bg-purple-200 disabled:opacity-50'
            }`}
            title={isListening ? 'रोकें (रिकॉर्डिंग चल रही है)' : 'बोलकर पूछें'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            placeholder={
              isListening
                ? '🔴 रिकॉर्डिंग चल रही है — माइक बटन दबाएं रोकने के लिए...'
                : isProcessing
                ? 'प्रतीक्षा करें...'
                : 'अपनी बात यहाँ लिखें या बोलें...'
            }
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && sendToAssistant(inputQuery)}
            disabled={isListening || isProcessing}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-purple font-medium disabled:opacity-60"
          />

          <button
            onClick={() => sendToAssistant(inputQuery)}
            disabled={isProcessing || isListening || !inputQuery.trim()}
            className="w-11 h-11 rounded-xl bg-brand-green text-white flex items-center justify-center hover:bg-brand-deep transition-colors shadow-xs disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </FarmerLayout>
  );
}

/* ======================================================
   Route mapping helper
   ====================================================== */
function getActionRoute(intent?: string): { route: string; label: string } | null {
  switch (intent) {
    case 'FIND_BUYER':
      return { route: '/farmer/ai-recommendations', label: 'SmartMatch खरीदार देखें →' };
    case 'CHECK_PRICES':
      return { route: '/farmer/market-prices', label: 'पूरा मंडी भाव चार्ट →' };
    case 'GET_TRANSPORTERS':
      return { route: '/farmer/transport', label: 'ट्रांसपोर्ट पेज →' };
    case 'TRACK_ORDER':
      return { route: '/farmer/orders', label: 'ऑर्डर विवरण देखें →' };
    case 'GET_EARNINGS':
      return { route: '/farmer/payments', label: 'भुगतान लेजर →' };
    case 'DEMAND_FORECAST':
      return { route: '/farmer/ai-recommendations', label: 'AI माँग विश्लेषण →' };
    default:
      return null;
  }
}
