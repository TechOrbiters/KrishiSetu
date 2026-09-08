'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Bell,
  Sparkles,
  Search,
  RotateCcw,
  Bookmark,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  MapPin,
  HelpCircle,
  Clock,
  Layers,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { MarketPrice } from '@/types';

interface BuyerPricesViewProps {
  marketPrices: MarketPrice[];
  onRefresh?: () => void;
}

export const BuyerPricesView: React.FC<BuyerPricesViewProps> = ({
  marketPrices,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'TODAY' | 'TRENDS' | 'COMPARE' | 'ALERTS'>('TODAY');
  const [selectedMandi, setSelectedMandi] = useState('लखनऊ मंडी (Lucknow)');
  const [timeframe, setTimeframe] = useState<'7D' | '15D' | '1M' | '3M'>('7D');
  const [bookmarkedCrops, setBookmarkedCrops] = useState<Record<string, boolean>>({
    'mp-1': true,
    'mp-5': true,
  });
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertCrop, setAlertCrop] = useState('टमाटर (Tomato)');
  const [alertCondition, setAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [alertTargetPrice, setAlertTargetPrice] = useState('1600');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [alertsList, setAlertsList] = useState([
    { id: 1, text: 'टमाटर का भाव ₹1,600/क्विंटल से ऊपर हो जाए', active: true, crop: 'टमाटर' },
    { id: 2, text: 'आलू का भाव ₹1,100/क्विंटल से नीचे आ जाए', active: true, crop: 'आलू' },
    { id: 3, text: 'गेहूं का भाव ₹2,400/क्विंटल से ऊपर जाए', active: true, crop: 'गेहूं' },
  ]);

  const toggleBookmark = (id: string) => {
    setBookmarkedCrops((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert = {
      id: Date.now(),
      text: `${alertCrop} का भाव ₹${alertTargetPrice}/क्विंटल से ${
        alertCondition === 'ABOVE' ? 'ऊपर हो जाए' : 'नीचे आ जाए'
      }`,
      active: true,
      crop: alertCrop,
    };
    setAlertsList((prev) => [newAlert, ...prev]);
    setIsAlertModalOpen(false);
    showToast(`✅ ${alertCrop} के लिए भाव अलर्ट सक्रिय कर दिया गया है!`);
  };

  const toggleAlertActive = (id: number) => {
    setAlertsList((prev) =>
      prev.map((al) => (al.id === id ? { ...al, active: !al.active } : al))
    );
  };

  const deleteAlert = (id: number) => {
    setAlertsList((prev) => prev.filter((al) => al.id !== id));
    showToast('भाव अलर्ट हटा दिया गया।');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER (scr-003) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>Real-Time Mandi Price Discovery & Spreads</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            बाजार भाव <span className="text-slate-500 font-normal text-xl">(Baazar Bhav)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ताज़ा मंडी भाव देखें, पिछले रुझान समझें और सही समय पर किसान से सीधे खरीदकर अधिकतम बचत करें।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4 text-amber-600" />
            <span>+ भाव अलर्ट सेट करें</span>
          </button>
          {onRefresh && (
            <button
              onClick={() => {
                onRefresh();
                showToast('ताज़ा AGMARKNET मंडी भाव अपडेट हो गए हैं।');
              }}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="रिफ्रेश करें"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB PILLS & MANDI FILTER (scr-003) */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Pill tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'TODAY'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            आज का भाव (Today)
          </button>
          <button
            onClick={() => setActiveTab('TRENDS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'TRENDS'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            रुझान (Trends)
          </button>
          <button
            onClick={() => setActiveTab('COMPARE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'COMPARE'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            मंडी तुलना (Comparison)
          </button>
          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ALERTS'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            फसल अलर्ट ({alertsList.length})
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-xs">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={selectedMandi}
              onChange={(e) => {
                setSelectedMandi(e.target.value);
                showToast(`${e.target.value} का डेटा लोड हुआ`);
              }}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option>लखनऊ मंडी (Lucknow)</option>
              <option>सीतापुर नवीन गल्ला मंडी</option>
              <option>बाराबंकी मंडी समिति</option>
              <option>कानपुर गल्ला मंडी</option>
            </select>
          </div>

          <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
            अपडेट: आज 09:30 AM
          </span>
        </div>
      </div>

      {/* 3. CONDITIONAL VIEWS BASED ON TAB */}
      {activeTab === 'ALERTS' ? (
        /* Alerts Management View */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">सक्रिय फसल भाव अलर्ट्स (Active Price Alerts)</h3>
              <p className="text-xs text-slate-500">मंडी भाव लक्ष्य तक पहुँचने पर सीधे SMS व पुश अलर्ट प्राप्त करें</p>
            </div>
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>नया अलर्ट जोड़ें</span>
            </button>
          </div>

          <div className="space-y-3">
            {alertsList.map((al) => (
              <div
                key={al.id}
                className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${al.active ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{al.text}</h4>
                    <p className="text-[11px] text-slate-400">लक्षित मंडी: {selectedMandi} • स्थिति: {al.active ? 'सक्रिय' : 'निष्क्रिय'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAlertActive(al.id)}
                    className="cursor-pointer"
                    title={al.active ? 'अलर्ट बंद करें' : 'अलर्ट चालू करें'}
                  >
                    {al.active ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-300" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteAlert(al.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="हटाएं"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'COMPARE' ? (
        /* Mandi Comparison Table View */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs overflow-hidden">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">क्षेत्रीय मंडियों की दर तुलना (Cross-Mandi Price Comparison)</h3>
            <p className="text-xs text-slate-500">देखें कि लखनऊ, सीतापुर, बाराबंकी और कानपुर मंडियों में प्रति क्विंटल क्या अंतर है</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">फसल</th>
                  <th className="p-3">लखनऊ मंडी</th>
                  <th className="p-3">सीतापुर मंडी</th>
                  <th className="p-3">बाराबंकी मंडी</th>
                  <th className="p-3">कानपुर मंडी</th>
                  <th className="p-3 bg-emerald-50 text-emerald-900">किसान सेतु मूल्य</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { crop: 'टमाटर (Tomato)', lko: '₹1,525', stp: '₹1,480', bbk: '₹1,440', knp: '₹1,610', best: '₹1,250' },
                  { crop: 'आलू (Potato)', lko: '₹1,275', stp: '₹1,210', bbk: '₹1,180', knp: '₹1,320', best: '₹1,050' },
                  { crop: 'प्याज (Onion)', lko: '₹1,300', stp: '₹1,280', bbk: '₹1,250', knp: '₹1,360', best: '₹1,080' },
                  { crop: 'गेहूं (Wheat)', lko: '₹2,225', stp: '₹2,200', bbk: '₹2,190', knp: '₹2,280', best: '₹2,000' },
                  { crop: 'सरसों (Mustard)', lko: '₹5,350', stp: '₹5,300', bbk: '₹5,280', knp: '₹5,420', best: '₹5,000' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{row.crop}</td>
                    <td className="p-3 text-slate-700">{row.lko}</td>
                    <td className="p-3 text-slate-700">{row.stp}</td>
                    <td className="p-3 text-slate-700">{row.bbk}</td>
                    <td className="p-3 text-slate-700">{row.knp}</td>
                    <td className="p-3 bg-emerald-50/50 font-black text-emerald-800">{row.best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'TRENDS' ? (
        /* Trends & Analytics View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">टमाटर व आलू 15-दिवसीय मूल्य रुझान</h3>
            <p className="text-xs text-slate-500 mb-4">आवक में वृद्धि के कारण सब्जियों के भाव स्थिर रहने का अनुमान</p>
            <div className="h-48 bg-slate-50 rounded-xl p-4 flex flex-col justify-between border border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>टमाटर: ₹1,525 ↓3.2%</span>
                <span>आलू: ₹1,275 ↓2.3%</span>
              </div>
              <div className="text-center text-xs text-emerald-700 font-semibold py-8">
                📊 AI DemandSense: अगले 5 दिनों में टमाटर की मांग में +12% वृद्धि संभावित है।
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>20 मई</span>
                <span>25 मई</span>
                <span>30 मई</span>
                <span>04 जून</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">खाद्यान्न व तिलहन मूल्य प्रवृत्तियां</h3>
            <p className="text-xs text-slate-500 mb-4">गेहूं और सरसों के भाव न्यूनतम समर्थन मूल्य (MSP) से ऊपर स्थिर</p>
            <div className="h-48 bg-slate-50 rounded-xl p-4 flex flex-col justify-between border border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>गेहूं: ₹2,225 ↑1.1%</span>
                <span>सरसों: ₹5,350 ↑1.2%</span>
              </div>
              <div className="text-center text-xs text-blue-700 font-semibold py-8">
                🌾 SellSmart Forecast: मानसून आगमन से पूर्व थोक भंडारण के लिए सर्वोत्तम समय।
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>20 मई</span>
                <span>25 मई</span>
                <span>30 मई</span>
                <span>04 जून</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TODAY'S TABLE VIEW (scr-003) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: The Comprehensive Price Table (scr-003) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    मंडी के ताज़ा भाव व किसान सेतु मूल्य
                  </h3>
                  <p className="text-xs text-slate-500">
                    सीधे किसान से खरीद पर आपकी वास्तविक बचत की गणना (प्रति क्विंटल)
                  </p>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-100">
                  Live AGMARKNET
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">फसल / उत्पाद</th>
                      <th className="py-3 px-3">न्यूनतम</th>
                      <th className="py-3 px-3">अधिकतम</th>
                      <th className="py-3 px-3">मंडी औसत</th>
                      <th className="py-3 px-3">24h बदलाव</th>
                      <th className="py-3 px-3 text-emerald-800 bg-emerald-50/40">किसान मूल्य</th>
                      <th className="py-3 px-3 text-emerald-800 bg-emerald-50/40">आपकी बचत</th>
                      <th className="py-3 px-3 text-center">सेव</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {marketPrices.map((row) => {
                      const isBookmarked = bookmarkedCrops[row.id] || false;
                      const savingsAmount = Math.round(row.avgPrice - row.platformPriceKg * 100);
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Crop Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm">
                              {row.cropHindi}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {row.crop} • {row.category}
                            </div>
                          </td>

                          {/* Min */}
                          <td className="py-3 px-3 font-medium text-slate-600">
                            ₹{row.minPrice}
                          </td>

                          {/* Max */}
                          <td className="py-3 px-3 font-medium text-slate-600">
                            ₹{row.maxPrice}
                          </td>

                          {/* Mandi Avg */}
                          <td className="py-3 px-3 font-extrabold text-slate-800">
                            ₹{row.avgPrice}
                          </td>

                          {/* Delta */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-0.5 font-bold ${
                                row.trend === 'UP' ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {row.trend === 'UP' ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                              )}
                              ₹{Math.abs(row.change)}
                            </span>
                          </td>

                          {/* Platform Direct Price */}
                          <td className="py-3 px-3 bg-emerald-50/40 font-extrabold text-emerald-900">
                            <div>₹{row.platformPriceKg * 100}/क्विंटल</div>
                            <div className="text-[10px] text-emerald-700 font-normal">
                              (₹{row.platformPriceKg}/kg)
                            </div>
                          </td>

                          {/* Savings Percentage */}
                          <td className="py-3 px-3 bg-emerald-50/40">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900">
                              ₹{savingsAmount} ({row.savingsPercentage}%)
                            </span>
                          </td>

                          {/* Bookmark */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                toggleBookmark(row.id);
                                showToast(
                                  isBookmarked
                                    ? `${row.cropHindi} पसंदीदा से हटाया गया`
                                    : `${row.cropHindi} पसंदीदा में जोड़ा गया`
                                );
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Bookmark
                                className={`w-4 h-4 ${
                                  isBookmarked ? 'fill-emerald-600 text-emerald-600' : ''
                                }`}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Banner (scr-003): "सही समय पर खरीदें, ज्यादा बचत करें!" */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-2xl p-6 text-white shadow-md">
              <h3 className="text-base sm:text-lg font-bold mb-1 text-white">
                सही समय पर खरीदें, ज्यादा बचत करें!
              </h3>
              <p className="text-xs text-emerald-200/90 mb-4">
                KrishiSetu मूल्य-रुझान मॉडल आपको आगामी भाव का पूर्वानुमान देकर थोक खरीद में सहायता करता है।
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                  <Bell className="w-5 h-5 text-amber-400 mb-1" />
                  <h4 className="text-xs font-bold text-white">भाव अलर्ट सेट करें</h4>
                  <p className="text-[11px] text-emerald-200 mt-0.5">मनचाहे भाव पर तुरंत एसएमएस व नोटिफिकेशन</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mb-1" />
                  <h4 className="text-xs font-bold text-white">रुझान अनुसार निर्णय</h4>
                  <p className="text-[11px] text-emerald-200 mt-0.5">आगमन व मांग के आधार पर सही समय पर खरीद</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                  <Sparkles className="w-5 h-5 text-teal-400 mb-1" />
                  <h4 className="text-xs font-bold text-white">प्रत्यक्ष किसान खरीद</h4>
                  <p className="text-[11px] text-emerald-200 mt-0.5">बिना किसी मंडी सेस अथवा दलाली के</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Favorites, Price Alerts, and 7-day Line Chart (scr-003) */}
          <div className="space-y-4">
            {/* Favorite Crops Card (scr-003) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                <span>मेरी पसंदीदा फसलें</span>
                <span
                  onClick={() => setActiveTab('TODAY')}
                  className="text-xs text-emerald-700 font-semibold cursor-pointer hover:underline"
                >
                  सभी देखें
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { name: 'टमाटर', price: '₹1,525', delta: '↓ 3.2%', isUp: false },
                  { name: 'आलू', price: '₹1,275', delta: '↓ 2.3%', isUp: false },
                  { name: 'गेहूं', price: '₹2,225', delta: '↑ 1.1%', isUp: true },
                  { name: 'प्याज', price: '₹1,300', delta: '↑ 3.2%', isUp: true },
                ].map((f, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 text-xs">{f.name}</span>
                      <Bookmark className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">{f.price}</span>
                      <span
                        className={`text-[10px] font-bold block ${
                          f.isUp ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {f.delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Price Alerts Card (scr-003) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>⚡ भाव अलर्ट्स (Alerts)</span>
                </span>
                <span className="text-xs font-bold text-emerald-700">{alertsList.length} सक्रिय</span>
              </h3>

              <div className="space-y-2.5 my-3">
                {alertsList.map((al) => (
                  <div
                    key={al.id}
                    className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between gap-2"
                  >
                    <p className="text-xs font-medium text-amber-950 leading-snug">
                      ⚠️ {al.text}
                    </p>
                    <button
                      onClick={() => toggleAlertActive(al.id)}
                      className="cursor-pointer"
                    >
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          al.active ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {al.active ? 'सक्रिय' : 'बंद'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsAlertModalOpen(true)}
                className="w-full py-2 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ नया अलर्ट बनाएं</span>
              </button>
            </div>

            {/* 7-Day Interactive SVG Price Trend Line Chart (scr-003) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  टमाटर का भाव रुझान (7 दिन)
                </h3>
                <span className="text-xs font-bold text-emerald-700">₹1,525/क्विंटल</span>
              </div>

              {/* Timeframe Pills */}
              <div className="flex items-center gap-1 mb-3">
                {(['7D', '15D', '1M', '3M'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      setTimeframe(tf);
                      showToast(`${tf} का मूल्य ग्राफ अपडेट हुआ`);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                      timeframe === tf
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tf === '7D' ? '7 दिन' : tf === '15D' ? '15 दिन' : tf === '1M' ? '1 महीना' : '3 महीने'}
                  </button>
                ))}
              </div>

              {/* SVG Chart */}
              <div className="h-40 w-full bg-slate-50/60 rounded-xl p-2 border border-slate-100 flex flex-col justify-between">
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>₹1,600</span>
                  <span>₹1,500</span>
                  <span>₹1,400</span>
                </div>

                {/* Chart Line with Points */}
                <svg viewBox="0 0 300 100" className="w-full h-24 overflow-visible">
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <polygon
                    points="20,70 60,60 105,45 150,38 195,25 240,15 285,32 285,90 20,90"
                    fill="url(#priceGradient)"
                  />

                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="20,70 60,60 105,45 150,38 195,25 240,15 285,32"
                  />

                  {[
                    { cx: 20, cy: 70 },
                    { cx: 60, cy: 60 },
                    { cx: 105, cy: 45 },
                    { cx: 150, cy: 38 },
                    { cx: 195, cy: 25 },
                    { cx: 240, cy: 15 },
                    { cx: 285, cy: 32 },
                  ].map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.cx}
                      cy={pt.cy}
                      r="3.5"
                      className="fill-white stroke-emerald-600 stroke-2 hover:r-5 transition-all"
                    />
                  ))}
                </svg>

                <div className="flex justify-between text-[9px] text-slate-400 font-medium px-1">
                  <span>29 मई</span>
                  <span>31 मई</span>
                  <span>02 जून</span>
                  <span>04 जून</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 text-center">
                💡 सुझाव: 2 दिन पूर्व टमाटर की आवक बढ़ी है, भाव में 2% सुधार की संभावना।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. CREATE ALERT MODAL */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              नया भाव अलर्ट बनाएं (Create Price Alert)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              जब भी चयनित मंडी में भाव आपकी निर्धारित सीमा तक पहुँचेगा, आपको अलर्ट मिलेगा।
            </p>

            <form onSubmit={handleCreateAlert} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">फसल चुनें:</label>
                <select
                  value={alertCrop}
                  onChange={(e) => setAlertCrop(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50"
                >
                  <option>टमाटर (Tomato)</option>
                  <option>आलू (Potato)</option>
                  <option>प्याज (Onion)</option>
                  <option>गेहूं (Wheat)</option>
                  <option>सरसों (Mustard)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">शर्त (Condition):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertCondition('ABOVE')}
                    className={`p-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      alertCondition === 'ABOVE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    मूल्य इससे अधिक हो जाए (Above)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertCondition('BELOW')}
                    className={`p-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      alertCondition === 'BELOW'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    मूल्य इससे कम हो जाए (Below)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  लक्षित मूल्य (₹ प्रति क्विंटल):
                </label>
                <input
                  type="number"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAlertModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  अलर्ट सक्रिय करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
