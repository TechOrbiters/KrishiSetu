import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Fuel,
  Coins,
  ArrowUpRight,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TransporterEarningsView: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'WEEK' | 'MONTH' | 'YEAR'>('MONTH');
  const [isCashoutProcessing, setIsCashoutProcessing] = useState(false);
  const [cashoutSuccess, setCashoutSuccess] = useState(false);

  // Settlement history rows
  const settlements = [
    {
      id: 'SET-901',
      date: '05 Sep 2026',
      orderCode: 'ORD-2026-9812',
      route: 'बाराबंकी FPO → नवीन गल्ला मंडी',
      distanceKm: 42,
      grossPay: 850,
      fuelEst: 280,
      toll: 0,
      netProfit: 570,
      status: 'SETTLED',
      upiTxnId: 'UPI/628901824/HDFC',
    },
    {
      id: 'SET-900',
      date: '04 Sep 2026',
      orderCode: 'ORD-2026-9784',
      route: 'मोहनलालगंज → आलमबाग मंडी',
      distanceKm: 65,
      grossPay: 1450,
      fuelEst: 480,
      toll: 80,
      netProfit: 890,
      status: 'SETTLED',
      upiTxnId: 'UPI/628771920/HDFC',
    },
    {
      id: 'SET-899',
      date: '03 Sep 2026',
      orderCode: 'ORD-2026-9650',
      route: 'बख्शी का तालाब → दुबग्गा मंडी',
      distanceKm: 34,
      grossPay: 650,
      fuelEst: 220,
      toll: 0,
      netProfit: 430,
      status: 'SETTLED',
      upiTxnId: 'UPI/628540112/HDFC',
    },
    {
      id: 'SET-898',
      date: '02 Sep 2026',
      orderCode: 'ORD-2026-9520',
      route: 'हरदोई रोड क्लस्टर → सीतापुर मंडी',
      distanceKm: 58,
      grossPay: 1200,
      fuelEst: 390,
      toll: 60,
      netProfit: 750,
      status: 'SETTLED',
      upiTxnId: 'UPI/628330919/HDFC',
    },
  ];

  const handleInstantCashout = () => {
    setIsCashoutProcessing(true);
    setTimeout(() => {
      setIsCashoutProcessing(false);
      setCashoutSuccess(true);
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      setTimeout(() => setCashoutSuccess(false), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6" id="transporter-earnings-container">
      {/* Top Banner with Balance & Quick Payout */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-emerald-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>कुल कमाई और वित्तीय विवरण (Financials)</span>
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-3xl sm:text-4xl font-black text-white">
                ₹42,850
              </div>
              <span className="text-xs font-bold bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                +18.4% पिछले माह से अधिक
              </span>
            </div>
            <p className="text-xs text-amber-100/90">
              इस महीने 28 सफल ट्रिप्स | उपलब्ध तत्काल नकद शेष (Available Balance): <strong>₹4,850</strong>
            </p>
          </div>

          {/* Instant UPI Cashout button */}
          <div className="flex flex-col sm:items-end gap-2">
            <button
              onClick={handleInstantCashout}
              disabled={isCashoutProcessing}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-emerald-950" />
              <span>{isCashoutProcessing ? 'UPI ट्रांसफर हो रहा है...' : 'तुरंत UPI बैंक खाता में ट्रांसफर करें (₹4,850)'}</span>
            </button>
            <span className="text-[10px] text-amber-200">
              UPI आईडी: <strong>rajtrans@upi (HDFC Bank)</strong>
            </span>
          </div>
        </div>

        {cashoutSuccess && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-300/50 rounded-xl text-xs text-emerald-100 flex items-center gap-2 font-bold animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>₹4,850 सीधे आपके UPI बैंक खाते में स्थानांतरित कर दिए गए हैं! संदर्भ आईडी: UPI/2026/09/8934</span>
          </div>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-400">आज की कमाई (Today)</div>
          <div className="text-xl font-bold text-slate-900">₹3,850</div>
          <div className="text-[10px] text-emerald-700 font-semibold">3 ट्रिप्स पूर्ण</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-400">इस सप्ताह (Weekly)</div>
          <div className="text-xl font-bold text-slate-900">₹14,600</div>
          <div className="text-[10px] text-blue-700 font-semibold">11 ट्रिप्स पूर्ण</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-400">औसत कमाई/ट्रिप</div>
          <div className="text-xl font-bold text-amber-800">₹1,530</div>
          <div className="text-[10px] text-slate-500">₹18-22 प्रति किमी</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-400">लाइफटाइम कमाई</div>
          <div className="text-xl font-bold text-emerald-800">₹2,84,000</div>
          <div className="text-[10px] text-slate-500">182 कुल ट्रिप्स</div>
        </div>
      </div>

      {/* Rule R-003 / R-004 Transparent Pricing & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transparent Pricing Policy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">
              पारदर्शी किराया संरचना (Rule R-003 & R-004 Compliance)
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            KrishiSetu प्लेटफॉर्म पर किसान और खरीदार द्वारा दिया जाने वाला पूरा डिलीवरी शुल्क <strong>100% बिना किसी कमीशन कटौती</strong> के सीधे ट्रांसपोर्टर को मिलता है।
          </p>

          <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">बेस पिकअप शुल्क (Base Fare):</span>
              <strong className="text-slate-800">₹350.00</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">प्रति किमी मानक दर (Per Km Rate):</span>
              <strong className="text-slate-800">₹18.00 / km</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">वजन अधिभार (Weight Surcharge &gt; 500kg):</span>
              <strong className="text-slate-800">+₹0.50 / kg</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
              <span className="text-emerald-800">प्लेटफ़ॉर्म कमीशन (Platform Fee):</span>
              <strong className="text-emerald-800">₹0 (शून्य कमीशन)</strong>
            </div>
          </div>
        </div>

        {/* Vehicle Expense & Net Profit Calculator */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Fuel className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">
              डीजल खर्च व शुद्ध लाभ विश्लेषण (Expense & Profit)
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>कुल ग्रॉस आय: ₹42,850</span>
                <span className="text-emerald-700">शुद्ध मुनाफा: ₹29,400 (68.6%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="w-[68%] bg-emerald-600 h-full" title="शुद्ध लाभ 68.6%" />
                <div className="w-[24%] bg-amber-500 h-full" title="डीजल/ईंधन 24%" />
                <div className="w-[8%] bg-blue-500 h-full" title="टोल व मेंटेनेंस 8%" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-center">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="text-slate-400">डीजल खर्च (24%)</div>
                <div className="font-bold text-slate-800">₹10,280</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="text-slate-400">टोल व सर्विस (8%)</div>
                <div className="font-bold text-slate-800">₹3,170</div>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <div className="text-emerald-800 font-bold">शुद्ध बचत (68%)</div>
                <div className="font-black text-emerald-900">₹29,400</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Payout Settlement Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-extrabold text-sm text-slate-900">
            हालिया ट्रिप भुगतान इतिहास (Trip Settlements)
          </div>
          <span className="text-xs text-slate-500">सभी भुगतान 100% संपन्न</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">तारीख व ऑर्डर</th>
                <th className="py-3 px-4">मार्ग (Route)</th>
                <th className="py-3 px-4">दूरी</th>
                <th className="py-3 px-4">कुल किराया</th>
                <th className="py-3 px-4">शुद्ध मुनाफा</th>
                <th className="py-3 px-4">स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    <div>{s.orderCode}</div>
                    <div className="text-[10px] font-normal text-slate-400">{s.date}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{s.route}</td>
                  <td className="py-3 px-4 text-slate-600">{s.distanceKm} km</td>
                  <td className="py-3 px-4 font-bold text-amber-800">₹{s.grossPay}</td>
                  <td className="py-3 px-4 font-bold text-emerald-800">₹{s.netProfit}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>बैंक में जमा</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
