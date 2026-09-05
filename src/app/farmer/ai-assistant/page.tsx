'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Mic,
  Send,
  Sparkles,
  Volume2,
  CheckCircle,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  actionRoute?: string;
  actionText?: string;
}

export default function KrishiAIAssistantPage() {
  const { language, setLanguage, languages } = useLanguage();
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'AI',
      text: 'नमस्ते रामेश जी! मैं आपका कृषि साथी (AI सहायक) हूँ। आप अपनी बोली में मुझसे पूछ सकते हैं, जैसे: "मेरे पास 500 किलो टमाटर हैं, कहाँ बेचूँ?" या "आज का मंडी भाव क्या है?"',
    },
  ]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'USER',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');

    // Simulate AI Intent Recognition & Platform Tool Routing
    setTimeout(() => {
      let aiResponse: ChatMessage = {
        id: `a_${Date.now()}`,
        sender: 'AI',
        text: 'मैंने आपकी जानकारी प्राप्त कर ली है। क्या आप कोई अन्य प्रश्न पूछना चाहते हैं?',
      };

      const lower = query.toLowerCase();

      if (lower.includes('टमाटर') || lower.includes('500') || lower.includes('bechna') || lower.includes('बेचूँ')) {
        aiResponse = {
          id: `a_${Date.now()}`,
          sender: 'AI',
          text: 'फसल: टमाटर (Tomato) | मात्रा: 500 kg पहचाना गया।\n\nAI विश्लेषण के अनुसार, लखनऊ में फ्रेशमार्ट आपको ₹24/kg देने को तैयार है। कुल अनुमानित आय: ₹12,000 (बिना किसी ट्रांसपोर्ट कटौती के)।',
          actionRoute: '/farmer/ai-recommendations',
          actionText: 'स्मार्ट खरीदार ऑफ़र देखें →',
        };
      } else if (lower.includes('भाव') || lower.includes('rate') || lower.includes('price')) {
        aiResponse = {
          id: `a_${Date.now()}`,
          sender: 'AI',
          text: 'आज लखनऊ मंडी में टमाटर का भाव ₹22–₹26/kg (औसत ₹24/kg) चल रहा है। गेंहूं का भाव ₹2,225/क्विंटल (+₹25 बढ़ोत्तरी) है।',
          actionRoute: '/farmer/market-prices',
          actionText: 'पूरा मंडी भाव चार्ट देखें →',
        };
      } else if (lower.includes('earning') || lower.includes('कमाई') || lower.includes('पैसा')) {
        aiResponse = {
          id: `a_${Date.now()}`,
          sender: 'AI',
          text: 'इस माह आपकी कुल कमाई ₹28,450 है (पिछले माह से 18% अधिक)। 24 सफल ऑर्डर पूरे हो चुके हैं।',
          actionRoute: '/farmer/payments',
          actionText: 'भुगतान लेजर खोलें →',
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
    }, 600);
  };

  const startVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSend('मेरे पास 500 किलो टमाटर हैं, कहाँ बेचूँ?');
    }, 2500);
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)]">
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

        {/* Quick Sample Voice Prompt Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none flex-shrink-0">
          {[
            '500 किलो टमाटर कहाँ बेचूँ?',
            'आज टमाटर का भाव क्या है?',
            'मेरी अर्निंग बताओ',
            'मेरा ऑर्डर कहाँ पहुँचा?',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors shadow-2xs"
            >
              🎤 "{prompt}"
            </button>
          ))}
        </div>

        {/* Chat Messages Container */}
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
                {m.sender === 'AI' && (
                  <div className="flex items-center justify-between text-brand-purple font-bold text-[11px] pb-1 border-b border-purple-200/60">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> कृषि साथी AI
                    </span>
                    <button
                      onClick={() => alert('वॉयस प्लेबैक शुरू किया जा रहा है...')}
                      className="p-0.5 hover:bg-purple-200/50 rounded"
                      title="आवाज़ सुनें"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-purple-700" />
                    </button>
                  </div>
                )}

                <p className="whitespace-pre-line">{m.text}</p>

                {m.actionRoute && (
                  <Link
                    href={m.actionRoute}
                    className="inline-flex items-center gap-1.5 bg-brand-purple text-white font-bold px-3.5 py-2 rounded-xl text-xs hover:bg-purple-800 transition-colors shadow-xs"
                  >
                    <span>{m.actionText}</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="bg-white p-3 rounded-2xl border border-brand-border flex items-center gap-2 shadow-sm flex-shrink-0">
          <button
            onClick={startVoiceInput}
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-all ${
              isListening
                ? 'bg-red-600 text-white animate-bounce'
                : 'bg-purple-100 text-brand-purple hover:bg-purple-200'
            }`}
            title="बोलकर पूछें"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            placeholder={isListening ? 'आपकी बात सुनी जा रही है...' : 'अपनी बात यहाँ लिखें या बोलें...'}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-purple font-medium"
          />

          <button
            onClick={() => handleSend()}
            className="w-11 h-11 rounded-xl bg-brand-green text-white flex items-center justify-center hover:bg-brand-deep transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </FarmerLayout>
  );
}
