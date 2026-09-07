'use client';

import React, { useState } from 'react';
import {
  Users,
  Building2,
  CheckCircle2,
  Star,
  MapPin,
  Search,
  Filter,
  Heart,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Package,
  Clock,
  Phone,
  ArrowRight,
  UserPlus,
  X,
  Check,
} from 'lucide-react';
import { FPOProfile, ProduceListing } from '@/types';

interface BuyerFarmersViewProps {
  fpos: FPOProfile[];
  listings: ProduceListing[];
  onSelectFarmerProduce?: (farmerName: string) => void;
}

export const BuyerFarmersView: React.FC<BuyerFarmersViewProps> = ({
  fpos,
  listings,
  onSelectFarmerProduce,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'FARMERS' | 'FPOS' | 'FOLLOWED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [followedIds, setFollowedIds] = useState<Record<string, boolean>>({
    'fpo-1': true,
    'fpo-2': true,
  });
  const [selectedFpoModal, setSelectedFpoModal] = useState<FPOProfile | null>(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestFormSubmitted, setSuggestFormSubmitted] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    name: '',
    location: '',
    contactPhone: '',
    membersCount: '',
    primaryCrop: '',
  });

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestFormSubmitted(true);
    setTimeout(() => {
      setSuggestFormSubmitted(false);
      setIsSuggestModalOpen(false);
      setSuggestForm({ name: '', location: '', contactPhone: '', membersCount: '', primaryCrop: '' });
    }, 1600);
  };

  const filteredFpos = fpos.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      item.name.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.district.toLowerCase().includes(q);

    if (!matchesQuery) return false;

    if (filterTab === 'ALL') return true;
    if (filterTab === 'FARMERS') return !item.isFPO;
    if (filterTab === 'FPOS') return item.isFPO;
    if (filterTab === 'FOLLOWED') return !!followedIds[item.id];
    return true;
  });

  const totalFarmers = fpos.filter((f) => !f.isFPO).length;
  const totalFpos = fpos.filter((f) => f.isFPO).length;
  const totalFollowed = Object.values(followedIds).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HEADER SECTION (scr-011) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Direct FPO & Farmer Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            All Farmers & FPOs <span className="text-emerald-700 font-bold">निर्देशिका</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            सीधे पंजीकृत किसान उत्पादक संगठनों (FPOs) व प्रगतिशील किसानों से जुड़ें, पारदर्शिता और थोक दरों का लाभ उठाएं।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSuggestModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>FPO सुझाएं (Suggest FPO)</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: DIRECTORY GRID (LEFT) + OVERVIEW RAIL (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search, Tabs & Directory Cards (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                सभी / All ({fpos.length})
              </button>
              <button
                onClick={() => setFilterTab('FPOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'FPOS'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                FPOs ({totalFpos})
              </button>
              <button
                onClick={() => setFilterTab('FARMERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'FARMERS'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                किसान / Farmers ({totalFarmers})
              </button>
              <button
                onClick={() => setFilterTab('FOLLOWED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'FOLLOWED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Followed ({totalFollowed})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="FPO या किसान खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Directory Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredFpos.map((fpo) => {
              const isFollowed = !!followedIds[fpo.id];
              return (
                <div
                  key={fpo.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all duration-200 p-4.5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Tag + Rating + Heart */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                          fpo.isFPO
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {fpo.isFPO ? 'FPO संघ' : 'प्रगतिशील किसान'}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {fpo.rating} ({fpo.reviewCount})
                        </span>
                        <button
                          onClick={() => toggleFollow(fpo.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                            isFollowed
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-slate-200'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFollowed ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* FPO Info & Avatar */}
                    <div className="flex items-start gap-3 mb-3.5">
                      <img
                        src={fpo.avatar}
                        alt={fpo.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                          <span>{fpo.name}</span>
                          {fpo.isVerified && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{fpo.location}</span>
                        </p>
                      </div>
                    </div>

                    {/* 3 Metric Chips */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center mb-3">
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">
                          {fpo.memberCount}+
                        </p>
                        <p className="text-[10px] text-slate-500">{fpo.isFPO ? 'सदस्य किसान' : 'अनुभव वर्ष'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">
                          {fpo.productCount}+
                        </p>
                        <p className="text-[10px] text-slate-500">उपलब्ध फसलें</p>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-emerald-700">
                          {fpo.onTimeRate}%
                        </p>
                        <p className="text-[10px] text-slate-500">समय पर डिलीवरी</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedFpoModal(fpo)}
                      className="flex-1 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>विवरण देखें</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        if (onSelectFarmerProduce) {
                          onSelectFarmerProduce(fpo.name);
                        } else {
                          setSelectedFpoModal(fpo);
                        }
                      }}
                      className="py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>उपज देखें</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Overview, Why Buy Direct & Top Categories (scr-011) */}
        <div className="space-y-4">
          {/* FPO Overview Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>FPO & Farmer Overview</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-center">
                <p className="text-xl font-extrabold text-emerald-900">{fpos.length}</p>
                <p className="text-[11px] text-emerald-700 font-medium">कुल सूचीबद्ध (Total)</p>
              </div>
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-center">
                <p className="text-xl font-extrabold text-blue-900">{totalFpos}</p>
                <p className="text-[11px] text-blue-700 font-medium">सत्यापित FPOs</p>
              </div>
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-center">
                <p className="text-xl font-extrabold text-amber-900">{totalFarmers}</p>
                <p className="text-[11px] text-amber-700 font-medium">स्वतंत्र किसान</p>
              </div>
              <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100 text-center">
                <p className="text-xl font-extrabold text-purple-900">{totalFollowed}</p>
                <p className="text-[11px] text-purple-700 font-medium">पसंदीदा (Followed)</p>
              </div>
            </div>

            {/* Why Buy Direct (scr-011) */}
            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                सीधे किसानों/FPO से क्यों खरीदें?
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>स्रोत से सीधी खरीद — बिचौलियों का कोई हस्तक्षेप नहीं</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>ताज़ा व गुणवत्ता परीक्षित उपज सीधे आपके दरवाजे पर</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>किसान व खरीदार दोनों के लिए न्यायपूर्ण व पारदर्शी दाम</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>स्थानीय कृषि समुदाय और महिला स्वयं सहायता समूहों को बढ़ावा</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Top Categories Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Top Categories by Sellers</h3>
            <div className="space-y-2">
              {[
                { name: 'ताज़ी सब्जियां (Vegetables)', count: '18 Sellers', pct: '85%' },
                { name: 'अनाज व गेहूं (Grains)', count: '16 Sellers', pct: '75%' },
                { name: 'शुद्ध दालें (Pulses)', count: '12 Sellers', pct: '60%' },
                { name: 'मौसमी फल (Fruits)', count: '10 Sellers', pct: '50%' },
                { name: 'तेल व मसाले (Oil & Spices)', count: '8 Sellers', pct: '40%' },
              ].map((c, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>{c.name}</span>
                    <span className="text-slate-500 font-normal">{c.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: c.pct }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Joined FPOs (scr-011) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>हाल ही में जुड़े FPOs</span>
              <span
                onClick={() => setFilterTab('ALL')}
                className="text-xs text-emerald-700 font-semibold cursor-pointer hover:underline"
              >
                View All
              </span>
            </h3>
            <div className="space-y-3">
              {fpos.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{r.name}</h4>
                    <p className="text-[11px] text-slate-500">{r.location} • {r.memberCount}+ किसान</p>
                  </div>
                  <button
                    onClick={() => setSelectedFpoModal(r)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FPO Detail Modal */}
      {selectedFpoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedFpoModal.avatar}
                  alt={selectedFpoModal.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                    {selectedFpoModal.name}
                    {selectedFpoModal.isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {selectedFpoModal.location}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFpoModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center mb-4">
              <div>
                <p className="text-sm font-extrabold text-emerald-900">
                  {selectedFpoModal.memberCount}+
                </p>
                <p className="text-[11px] text-emerald-700">सत्यापित सदस्य</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-emerald-900">
                  {selectedFpoModal.productCount}+
                </p>
                <p className="text-[11px] text-emerald-700">सक्रिय फसलें</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-emerald-900">
                  {selectedFpoModal.onTimeRate}%
                </p>
                <p className="text-[11px] text-emerald-700">समय पर पूर्ति</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {selectedFpoModal.name} भारत सरकार के कृषि एवं किसान कल्याण मंत्रालय के दिशा-निर्देशों के तहत पंजीकृत है। यह समूह ग्रेड-ए गुणवत्ता वाली खाद्यान्न और ताज़ी सब्जियों की नियमित आपूर्ति करता है।
            </p>

            <div className="flex gap-2">
              <a
                href="tel:+919876543210"
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>कॉल करें (+91 98765 43210)</span>
              </a>
              <button
                onClick={() => {
                  const farmerName = selectedFpoModal.name;
                  setSelectedFpoModal(null);
                  if (onSelectFarmerProduce) onSelectFarmerProduce(farmerName);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                इसकी उपज देखें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUGGEST FPO MODAL */}
      {isSuggestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            {suggestFormSubmitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h3 className="text-base font-bold text-slate-900">सुझाव प्राप्त हुआ!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  हमारी क्षेत्रीय टीम 24 घंटे में इस FPO से सत्यापन हेतु संपर्क करेगी।
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>FPO या किसान का सुझाव दें</span>
                  </h3>
                  <button onClick={() => setIsSuggestModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSuggestSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">FPO अथवा किसान का नाम:</label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. किसान उदय FPO"
                      value={suggestForm.name}
                      onChange={(e) => setSuggestForm({ ...suggestForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">स्थान / जिला (Location):</label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. बाराबंकी, उत्तर प्रदेश"
                      value={suggestForm.location}
                      onChange={(e) => setSuggestForm({ ...suggestForm, location: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">मोबाइल नंबर:</label>
                      <input
                        type="tel"
                        required
                        placeholder="98765 XXXXX"
                        value={suggestForm.contactPhone}
                        onChange={(e) => setSuggestForm({ ...suggestForm, contactPhone: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">अनुमानित सदस्य:</label>
                      <input
                        type="number"
                        placeholder="100+"
                        value={suggestForm.membersCount}
                        onChange={(e) => setSuggestForm({ ...suggestForm, membersCount: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSuggestModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
                    >
                      सुझाव भेजें
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
