'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  PhoneCall,
  MessageCircle,
  Mic,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';

export default function HelpCenterPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'मेरी उपज का भुगतान कब और कैसे प्राप्त होगा?',
      a: 'खरीदार द्वारा ऑर्डर स्वीकार करने और डिलीवरी पूर्ण होने के तुरंत बाद पूरा फसल मूल्य आपके पंजीकृत बैंक खाते में स्थानांतरित कर दिया जाता है।',
    },
    {
      q: 'क्या परिवहन खर्च (Delivery Fee) मेरी कमाई से काटा जाता है?',
      a: 'नहीं! KRISHISETU में परिवहन खर्च का भुगतान खरीदार अलग से करता है। किसान को पूरी तय राशि प्राप्त होती है।',
    },
    {
      q: 'ताज़गी समय सीमा (Freshness Window) क्या है?',
      a: 'यह वह समय सीमा है जब तक आपकी उपज ताज़ा और अच्छी स्थिति में रहेगी। केवल वही ट्रांसपोर्टर ऑर्डर स्वीकार कर सकते हैं जिनकी डिलीवरी ETA इस विंडो के अंदर हो।',
    },
    {
      q: 'क्या मैं अपनी उपज का मूल्य स्वयं तय कर सकता हूँ?',
      a: 'हाँ, आप अपनी इच्छानुसार कोई भी मूल्य तय कर सकते हैं। KRISHISETU आपको आज का मंडी भाव और उचित विक्रय मूल्य का सुझाव भी देता है।',
    },
  ];

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-brand-green" />
            <h1 className="text-xl font-bold text-slate-900">सहायता केंद्र (Help Center)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            24x7 किसान सहायता — हम आपकी हर समस्या के समाधान के लिए तत्पर हैं
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="tel:18001801551"
            className="bg-brand-green text-white p-4 rounded-2xl shadow-sm hover:bg-brand-deep transition-all flex flex-col items-center text-center space-y-2"
          >
            <PhoneCall className="w-6 h-6 animate-bounce" />
            <span className="font-bold text-sm">टोल-फ्री कॉल करें</span>
            <span className="text-xs opacity-90">1800-180-1551</span>
          </a>

          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-600 text-white p-4 rounded-2xl shadow-sm hover:bg-emerald-700 transition-all flex flex-col items-center text-center space-y-2"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="font-bold text-sm">WhatsApp पर बात करें</span>
            <span className="text-xs opacity-90">+91 98765 43210</span>
          </a>

          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-4 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-2">
            <Mic className="w-6 h-6" />
            <span className="font-bold text-sm">वॉयस सहायता</span>
            <span className="text-xs opacity-90">अपनी भाषा में बोलकर पूछें</span>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            अक्सर पूछे जाने वाले प्रश्न (FAQ)
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {openFaq === idx && (
                  <div className="p-4 bg-white text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
