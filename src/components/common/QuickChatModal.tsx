import React, { useState } from 'react';
import { X, Send, MessageSquare, Phone, CheckCircle2 } from 'lucide-react';

interface QuickChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  counterpartName: string;
  role: 'buyer' | 'farmer';
}

interface ChatMessage {
  id: string;
  sender: 'buyer' | 'farmer' | 'system';
  text: string;
  timestamp: string;
}

export const QuickChatModal: React.FC<QuickChatModalProps> = ({
  isOpen,
  onClose,
  orderCode,
  counterpartName,
  role,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'system',
      text: `ऑर्डर #${orderCode} के लिए चैट शुरू हो गई है। आप पिकअप और लॉजिस्टिक्स पर चर्चा कर सकते हैं।`,
      timestamp: 'अभी अभी',
    },
    {
      id: '2',
      sender: role === 'buyer' ? 'farmer' : 'buyer',
      text: `नमस्ते! आपका ऑर्डर तैयार किया जा रहा है। समय पर पिकअप सुनिश्चित है।`,
      timestamp: '10 मिनट पहले',
    },
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: role,
      text: inputText.trim(),
      timestamp: 'अभी',
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate auto-reply after 2 seconds
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: role === 'buyer' ? 'farmer' : 'buyer',
        text: 'संदेश मिल गया है। धन्यवाद!',
        timestamp: 'अभी',
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 2000);
  };

  const quickSuggestions = [
    'पिकअप का सही समय क्या है?',
    'क्या लोडिंग वाहन तैयार है?',
    'गुणवत्ता और वजन की पुष्टि करें',
    'रास्ते में कोई समस्या तो नहीं?',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#03542B] text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white font-bold">
              💬
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                {counterpartName}
              </h3>
              <p className="text-[11px] text-emerald-100">ऑर्डर #{orderCode} • लाइव चैट</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="tel:9876543210"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              title="कॉल करें"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.map((msg) => {
            const isMe = msg.sender === role;
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 inline-block shadow-2xs">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-[#03542B] text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 font-semibold">
                  {msg.timestamp}
                </span>
              </div>
            );
          })}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto shrink-0">
          {quickSuggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(sug)}
              className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-[11px] font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer border border-slate-200 shrink-0"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="संदेश लिखें..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-2xl bg-[#03542B] hover:bg-[#023e1f] text-white flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
