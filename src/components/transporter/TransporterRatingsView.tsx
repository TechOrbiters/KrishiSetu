import React from 'react';
import {
  Star,
  Award,
  ShieldCheck,
  CheckCircle,
  ThumbsUp,
  Clock,
  Sparkles,
  TrendingUp,
  Gift,
  HeartHandshake,
} from 'lucide-react';

export const TransporterRatingsView: React.FC = () => {
  const reviews = [
    {
      id: 'rev-1',
      reviewerName: 'रामेश्वर वर्मा (FPO अध्यक्ष, बाराबंकी)',
      orderCode: 'ORD-2026-9812',
      crop: 'टमाटर (देसी लाल)',
      rating: 5,
      date: 'आज 10:15 AM',
      comment: 'राजेश जी ने बिल्कुल समय पर फार्म से माल उठाया और नवीन मंडी में बिना किसी नुकसान के सुरक्षित पहुंचाया। बहुत विनम्र और जिम्मेदार ट्रांसपोर्टर।',
      tag: 'सुरक्षित लोडिंग',
    },
    {
      id: 'rev-2',
      reviewerName: 'सीतापुर गल्ला मंडी खरीदार (अग्रवाल ट्रेडर्स)',
      orderCode: 'ORD-2026-9784',
      crop: 'आलू (चिपसोना)',
      rating: 5,
      date: 'कल शाम',
      comment: 'FreshRoute समय सीमा के भीतर डिलीवरी मिली। आलू की बोरियां बिल्कुल सही स्थिति में अनलोड हुईं।',
      tag: 'समय पर डिलीवरी',
    },
    {
      id: 'rev-3',
      reviewerName: 'दिनेश कुमार (किसान, बख्शी का तालाब)',
      orderCode: 'ORD-2026-9650',
      crop: 'हरी मिर्च व धनिया',
      rating: 4.8,
      date: '3 दिन पहले',
      comment: 'गाड़ी में तिरपाल और सुरक्षा की अच्छी व्यवस्था थी। बारिश के मौसम में भी माल सुरक्षित रहा।',
      tag: 'उत्कृष्ट वाहन स्वच्छता',
    },
  ];

  return (
    <div className="space-y-6" id="transporter-ratings-container">
      {/* Top Hero Rating Card */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-emerald-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-300" />
              <span>ट्रांसपोर्टर परफॉरमेंस व रेटिंग प्रोफ़ाइल</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-4xl sm:text-5xl font-black text-white flex items-center gap-1.5">
                <span>4.8</span>
                <span className="text-amber-400 text-3xl">★</span>
              </div>
              <div>
                <div className="font-extrabold text-sm text-amber-100">उत्कृष्ट रेटिंग (Excellent)</div>
                <div className="text-xs text-amber-200/90">128 सत्यापित किसान व खरीदार समीक्षाएं</div>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="bg-amber-400 text-amber-950 p-3.5 rounded-2xl shadow-md space-y-0.5 text-center shrink-0">
            <div className="text-xs font-black uppercase flex items-center justify-center gap-1">
              <Award className="w-4 h-4" />
              <span>गोल्ड डिलीवरी पार्टनर (Gold Partner)</span>
            </div>
            <div className="text-[11px] font-medium text-amber-900">
              शीर्ष 5% ट्रांसपोर्टर्स में शामिल | प्राथमिकता SmartMatch मैचिंग
            </div>
          </div>
        </div>

        {/* 4 Performance Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-amber-600/50 text-xs">
          <div>
            <div className="text-amber-200 text-[10px]">समय पर डिलीवरी</div>
            <div className="font-bold text-white text-base">98.4%</div>
          </div>
          <div>
            <div className="text-amber-200 text-[10px]">फसल ताजगी सुरक्षा</div>
            <div className="font-bold text-white text-base">99.1%</div>
          </div>
          <div>
            <div className="text-amber-200 text-[10px]">रद्द की गई ट्रिप्स</div>
            <div className="font-bold text-emerald-300 text-base">0% (शून्य कैंसिलेशन)</div>
          </div>
          <div>
            <div className="text-amber-200 text-[10px]">कुल सफल ट्रिप्स</div>
            <div className="font-bold text-white text-base">182 ट्रिप्स</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Performance Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-600 fill-current" />
            <span>श्रेणीवार रेटिंग विवरण (Category Ratings)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>समयबद्धता (On-Time Delivery)</span>
                <span className="text-amber-700 font-bold">4.9 ★ (98%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[98%] bg-emerald-600 h-full rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>फसल सुरक्षा व देखभाल (Produce Handling)</span>
                <span className="text-amber-700 font-bold">4.8 ★ (96%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[96%] bg-emerald-600 h-full rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>व्यवहार और संचार (Politeness & Communication)</span>
                <span className="text-amber-700 font-bold">4.9 ★ (99%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[99%] bg-emerald-600 h-full rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>वाहन स्वच्छता और फिटनेस (Vehicle Hygiene)</span>
                <span className="text-amber-700 font-bold">4.7 ★ (94%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[94%] bg-amber-500 h-full rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Incentive & Reward Program */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Gift className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">
              सुपर ड्राइवर प्रोत्साहन योजना (Incentive Program)
            </h3>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-amber-950 flex items-center justify-between">
              <span>🎯 साप्ताहिक सुपर ड्राइवर बोनस (Weekly Bonus)</span>
              <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
                +₹500 नकद
              </span>
            </div>
            <p className="text-amber-900 text-[11px]">
              इस सप्ताह 15 में से 11 ट्रिप्स पूरी हुईं। आगामी 4 ऑन-टाइम ट्रिप्स पूरी करते ही ₹500 सीधे आपके बैंक खाते में जमा होंगे।
            </p>
            <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
              <div className="w-[73%] bg-amber-600 h-full rounded-full" />
            </div>
            <div className="text-[10px] text-amber-800 font-semibold text-right">
              11/15 ट्रिप्स (73% पूर्ण)
            </div>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>गोल्ड स्टेटस के साथ ईंधन डिस्काउंट कूपन व टोल कैशबैक सक्रिय हैं।</span>
          </div>
        </div>
      </div>

      {/* Verified Reviews Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="font-extrabold text-sm text-slate-900">
            सत्यापित किसान और खरीदार समीक्षाएं (Verified Feedback)
          </div>
          <span className="text-xs text-slate-500">128 कुल समीक्षाएं</span>
        </div>

        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                    {r.reviewerName[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{r.reviewerName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {r.orderCode} • {r.crop}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {r.tag}
                  </span>
                  <div className="flex items-center text-amber-500 font-bold">
                    <span>{r.rating}</span>
                    <Star className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              <p className="text-slate-700 text-xs leading-relaxed">
                "{r.comment}"
              </p>

              <div className="text-[10px] text-slate-400 text-right">
                समीक्षा दिनांक: {r.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
