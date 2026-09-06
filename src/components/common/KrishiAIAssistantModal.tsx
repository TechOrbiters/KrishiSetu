import React, { useState } from 'react';
import { Mic, Send, X, Bot, Sparkles, Volume2, ArrowRight, RefreshCw } from 'lucide-react';
import { querySarvamAI, speakWithSarvamAI } from '../../lib/apiServices';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface KrishiAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  onApplyAction?: (action: string, data?: any) => void;
}

export const KrishiAIAssistantModal: React.FC<KrishiAIAssistantModalProps> = ({
  isOpen,
  onClose,
  userRole = 'FARMER_FPO',
  onApplyAction,
}) => {
  const { t } = useLanguage();
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; actionText?: string; actionType?: string }>>([
    {
      sender: 'ai',
      text: 'नमस्ते रामेश जी! 🙏 मैं हूँ आपका कृषि साथी AI सहायक, जो Sarvam AI (sarvam-105b) द्वारा संचालित है। आप मुझसे फसल के ताज़ा मंडी भाव, लखनऊ में मांग (DemandSense), सही बिक्री मूल्य (SellSmart), या आवाज़ से नई उपज लिस्ट करने में मदद ले सकते हैं।',
    },
  ]);

  if (!isOpen) return null;

  const quickQuestions = [
    'लखनऊ मंडी में टमाटर का आज क्या भाव है?',
    'मेरी 500 किलो गेहूं की उपज को सबसे ज्यादा मुनाफे पर कहां बेचें?',
    'अगले 7 दिनों में किस फसल की मांग सबसे ज्यादा रहने वाली है?',
    'बोलकर 300 किलो आलू ₹20/kg पर लिस्ट करें',
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || isLoading) return;

    // Add user message
    const updatedMessages = [...messages, { sender: 'user' as const, text: q }];
    setMessages(updatedMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Prepare conversation history for Sarvam AI
      const conversationHistory = updatedMessages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await querySarvamAI(conversationHistory, userRole);
      let reply = res.reply || '';
      let actionText = '';
      let actionType = '';

      const queryLower = q.toLowerCase();
      if (queryLower.includes('टमाटर') || queryLower.includes('tomato')) {
        actionText = 'टमाटर खरीदार मैच देखें (SmartMatch)';
        actionType = 'VIEW_BUYERS';
      } else if (queryLower.includes('गेहूं') || queryLower.includes('wheat') || queryLower.includes('मुनाफे')) {
        actionText = '₹11,000 का ऑर्डर स्वीकार करें';
        actionType = 'ACCEPT_WHEAT_ORDER';
      } else if (queryLower.includes('आलू') || queryLower.includes('लिस्ट')) {
        actionText = 'लिस्टिंग की पुष्टि करें और प्रकाशित करें';
        actionType = 'PUBLISH_POTATO';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          actionText,
          actionType,
        },
      ]);
    } catch (err: any) {
      console.warn('Sarvam call notice, using local fallback:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '📊 DemandSense विश्लेषण: लखनऊ मंडी में आज टमाटर का भाव ₹1,525/क्विंटल है। KisanSetu B2B पर सीधे बेचने पर आपको ₹24/kg तक का भाव मिल सकता है।',
          actionText: 'खरीदार देखें',
          actionType: 'VIEW_BUYERS',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayVoice = async (text: string, idx: number) => {
    setIsSpeaking(idx);
    try {
      await speakWithSarvamAI(text, 'aditya');
    } catch (e) {
      console.warn('Voice play error:', e);
    } finally {
      setIsSpeaking(null);
    }
  };

  const handleVoiceSimulate = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSend('बोलकर 300 किलो आलू ₹20/kg पर लिस्ट करें');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-emerald-100 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center border border-white/20">
              <Bot className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="font-bold text-base flex items-center gap-2">
                कृषि साथी (Krishi AI Assistant)
                <span className="text-[10px] bg-emerald-500/40 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Sarvam AI • Indic LLM
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                sarvam-105b व bulbul:v3 आवाज़ द्वारा संचालित
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="dark" showLabel={false} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9FBFA]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-emerald-100 shadow-2xs rounded-bl-xs'
                }`}
              >
                {m.sender === 'ai' && (
                  <div className="flex items-center justify-between gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Sarvam AI उत्तर</span>
                    </div>
                    <button
                      onClick={() => handlePlayVoice(m.text, idx)}
                      disabled={isSpeaking !== null}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors"
                      title="Sarvam AI आवाज़ में सुनें"
                    >
                      <Volume2 className={`w-3 h-3 ${isSpeaking === idx ? 'animate-bounce text-emerald-600' : ''}`} />
                      <span>{isSpeaking === idx ? 'बोल रहा है...' : 'सुनें'}</span>
                    </button>
                  </div>
                )}
                <div className="whitespace-pre-line">{m.text}</div>

                {m.actionText && (
                  <button
                    onClick={() => {
                      if (onApplyAction) onApplyAction(m.actionType || '', m);
                      onClose();
                    }}
                    className="mt-2.5 w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 flex items-center justify-between transition-colors"
                  >
                    <span>{m.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-emerald-100 text-emerald-800 text-xs font-medium shadow-2xs">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Sarvam AI (sarvam-105b) सोच रहा है...</span>
            </div>
          )}

          {isListening && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-medium animate-pulse">
              <Mic className="w-4 h-4 text-emerald-600 animate-bounce" />
              <span>सुन रहा हूँ... बोलिए (Sarvam AI STT सक्रिय)</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex gap-2 overflow-x-auto no-scrollbar">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-xs shrink-0 px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-full border border-slate-200 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
          <button
            onClick={handleVoiceSimulate}
            title="बोलकर पूछें"
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="अपनी भाषा में पूछें या बोलें (जैसे: टमाटर का भाव...)"
            className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isLoading}
            className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

