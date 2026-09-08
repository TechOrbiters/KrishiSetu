'use client';

import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  ShieldCheck,
  Truck,
  Heart,
  Plus,
  Minus,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Filter,
  CheckCircle2,
  Wheat,
  Leaf,
  Layers,
  ArrowRight,
  Flame,
  Award,
  Clock,
} from 'lucide-react';
import { ProduceListing, MarketPrice } from '@/types';
import { getAccurateCropImage } from '@/lib/cropImages';

interface BuyerHomeViewProps {
  listings: ProduceListing[];
  marketPrices: MarketPrice[];
  onAddToCart: (listing: ProduceListing, qty: number) => void;
  onOpenPrices: () => void;
  onOpenFarmers: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  selectedFarmerFilter?: string | null;
  onClearFarmerFilter?: () => void;
}

export const BuyerHomeView: React.FC<BuyerHomeViewProps> = ({
  listings,
  marketPrices,
  onAddToCart,
  onOpenPrices,
  onOpenFarmers,
  searchQuery: externalSearchQuery,
  onSearchChange,
  selectedFarmerFilter,
  onClearFarmerFilter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = (q: string) => {
    setInternalSearchQuery(q);
    if (onSearchChange) onSearchChange(q);
  };
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [addedAnimation, setAddedAnimation] = useState<string | null>(null);

  const categories = [
    { id: 'ALL', labelHindi: 'सभी उत्पाद', labelEng: 'All Produce', icon: Layers, count: listings.length },
    { id: 'VEGETABLES', labelHindi: 'ताज़ी सब्जियां', labelEng: 'Vegetables', icon: Leaf, count: listings.filter(l => l.crop.toLowerCase().includes('tomato') || l.crop.toLowerCase().includes('potato') || l.crop.toLowerCase().includes('onion') || l.crop.toLowerCase().includes('bhindi')).length },
    { id: 'GRAINS', labelHindi: 'अनाज व खाद्यान्न', labelEng: 'Grains', icon: Wheat, count: listings.filter(l => l.crop.toLowerCase().includes('wheat') || l.crop.toLowerCase().includes('paddy')).length },
    { id: 'PULSES', labelHindi: 'शुद्ध दालें', labelEng: 'Pulses', icon: Award, count: listings.filter(l => l.crop.toLowerCase().includes('dal') || l.crop.toLowerCase().includes('chana')).length },
    { id: 'FRUITS', labelHindi: 'मौसमी फल', labelEng: 'Fruits', icon: Flame, count: listings.filter(l => l.crop.toLowerCase().includes('mango') || l.crop.toLowerCase().includes('banana')).length },
  ];

  const getQty = (item: ProduceListing) => {
    return quantities[item.id] || item.minOrderKg || 20;
  };

  const setQty = (id: string, newQty: number, minQty: number, maxQty: number) => {
    const validQty = Math.max(minQty, Math.min(maxQty, newQty));
    setQuantities(prev => ({ ...prev, [id]: validQty }));
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = (item: ProduceListing) => {
    const qty = getQty(item);
    onAddToCart(item, qty);
    setAddedAnimation(item.id);
    setTimeout(() => setAddedAnimation(null), 1200);
  };

  const filteredListings = listings.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.crop.toLowerCase().includes(q) ||
      item.cropHindi.includes(q) ||
      item.cultivationLocation.toLowerCase().includes(q) ||
      (item.fpoName && item.fpoName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (selectedFarmerFilter) {
      const farmerMatches =
        (item.fpoName && item.fpoName.toLowerCase().includes(selectedFarmerFilter.toLowerCase())) ||
        (item.farmerName && item.farmerName.toLowerCase().includes(selectedFarmerFilter.toLowerCase()));
      if (!farmerMatches) return false;
    }

    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'VEGETABLES') {
      return ['tomato', 'potato', 'onion', 'bhindi', 'garlic'].some(k => item.crop.toLowerCase().includes(k));
    }
    if (selectedCategory === 'GRAINS') {
      return ['wheat', 'paddy', 'rice', 'mustard'].some(k => item.crop.toLowerCase().includes(k));
    }
    if (selectedCategory === 'PULSES') {
      return ['dal', 'chana', 'pulse'].some(k => item.crop.toLowerCase().includes(k));
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HERO BANNER (scr-009) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(52,211,153,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 px-6 sm:px-8 py-8 md:py-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>AI Mandi • किसान-क्रेता सेतु (Direct Farm Network)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-2 text-white">
            सीधे किसानों और FPO से, <span className="text-emerald-400">सस्ते दाम</span> में, भरोसे के साथ
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base font-normal mb-6 max-w-2xl">
            बिचौलियों की फीस खत्म। शुद्ध, ताज़ी खेत की उपज सीधे आपके दरवाजे तक स्मार्ट ट्रांसपोर्ट पूलिंग के साथ।
          </p>

          {/* 3 Trust Feature Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">न्यायपूर्ण मूल्य</p>
                <p className="text-[11px] text-emerald-200">मंडी से 10-20% कम दाम</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">ताज़ा व गुणवत्तापूर्ण</p>
                <p className="text-[11px] text-emerald-200">सीधे खेत से ग्रेड-A उपज</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">स्मार्ट डिलीवरी</p>
                <p className="text-[11px] text-emerald-200">SmartMatch व पूल्ड किराया</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY TILES (scr-009 & scr-008) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>श्रेणी के अनुसार खोजें</span>
              <span className="text-xs text-slate-500 font-normal">(Categories)</span>
            </h2>
          </div>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1"
          >
            सभी देखें <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3.5 rounded-xl text-left border transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50/60 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      isActive ? 'bg-emerald-200/80 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </div>
                <div>
                  <h3 className={`text-sm font-bold leading-snug ${isActive ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {cat.labelHindi}
                  </h3>
                  <p className="text-[11px] text-slate-500">{cat.labelEng}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SEARCH & QUICK FILTER BAR */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="खोजें (जैसे – 20 किलो टमाटर, आलू, गेहूं)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-xs text-slate-600">
          <span className="font-medium text-slate-500">
            दिखाए गए उत्पाद: <strong className="text-slate-800">{filteredListings.length}</strong>
          </span>
          <button
            onClick={onOpenFarmers}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-emerald-700 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>किसान व FPO सूची</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. PRODUCE GRID "आस-पास उपलब्ध (Near You)" (scr-009 & scr-008) */}
      <div>
        {selectedFarmerFilter && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 mb-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
              <span>🌾 फ़िल्टर सक्रिय: केवल <strong>{selectedFarmerFilter}</strong> की उपज दिखाई जा रही है</span>
            </div>
            <button
              onClick={onClearFarmerFilter}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
            >
              सभी फसलें देखें ✕
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>आपके आस-पास उपलब्ध</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Near You
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              सीधे लखनऊ, बाराबंकी और सीतापुर के प्रमाणित FPO किसानों से
            </p>
          </div>
          <button
            onClick={onOpenPrices}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            मंडी भाव तुलना <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((item) => {
            const currentQty = getQty(item);
            const isFav = favorites[item.id] || false;
            const marketRef = item.marketPricePerKg || Math.round(item.pricePerKg * 1.2);
            const diffPerKg = Math.max(0, marketRef - item.pricePerKg);
            const totalItemSavings = diffPerKg * currentQty;
            const isLowStock = item.status === 'LOW_STOCK';
            const isAdded = addedAnimation === item.id;

            return (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Image & Badges */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={getAccurateCropImage(item.crop, item.image, item.cropHindi)}
                    alt={item.cropHindi || item.crop}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getAccurateCropImage(item.crop, undefined, item.cropHindi);
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Gradient Overlay for badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-800 shadow-xs backdrop-blur-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {item.distanceKm || 14} km दूर
                    </span>
                    {isLowStock && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                        कम स्टॉक
                      </span>
                    )}
                  </div>

                  {/* Heart / Favorite */}
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-slate-600 hover:text-red-500 shadow-xs transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  {/* Bottom Image Tag */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-600/95 text-white backdrop-blur-xs flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> सीधे किसान से
                    </span>
                    {item.variety && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-white backdrop-blur-xs">
                        {item.variety}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title & Seller */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {item.cropHindi}{' '}
                          <span className="text-xs font-medium text-slate-500">({item.crop})</span>
                        </h3>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <span className="font-semibold text-emerald-800">{item.fpoName || 'Kisan FPO'}</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                          <span className="text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500">{item.cultivationLocation}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                          ★ {item.rating || 4.8}
                        </span>
                      </div>
                    </div>

                    {/* Stock & Freshness */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 my-2 pt-1 border-t border-slate-100">
                      <span>
                        उपलब्ध मात्रा: <strong className="text-slate-700">{item.quantityKg} kg</strong>
                      </span>
                      <span>•</span>
                      <span>
                        न्यूनतम: <strong className="text-slate-700">{item.minOrderKg} kg</strong>
                      </span>
                    </div>

                    {/* Price & Savings Display */}
                    <div className="bg-emerald-50/50 rounded-xl p-2.5 border border-emerald-100 my-2 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-extrabold text-emerald-800">
                            ₹{item.pricePerKg}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">/ kg</span>
                          {marketRef > item.pricePerKg && (
                            <span className="text-xs text-slate-400 line-through font-normal ml-1">
                              ₹{marketRef}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          बाजार भाव से ₹{diffPerKg}/kg सस्ता
                        </p>
                      </div>

                      {totalItemSavings > 0 && (
                        <div className="text-right">
                          <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full">
                            ₹{totalItemSavings} बचत
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Add Button */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs text-slate-600 font-medium">मात्रा चुनें:</span>
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          onClick={() => setQty(item.id, currentQty - (item.minOrderKg || 10), item.minOrderKg || 10, item.quantityKg)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-12 text-center text-xs font-bold text-slate-800">
                          {currentQty} kg
                        </span>
                        <button
                          onClick={() => setQty(item.id, currentQty + (item.minOrderKg || 10), item.minOrderKg || 10, item.quantityKg)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-r-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdd(item)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                        isAdded
                          ? 'bg-emerald-800 text-white scale-98 shadow-inner'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-xs hover:shadow-md'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>कार्ट में जोड़ा गया ✓</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>कार्ट में जोड़ें (₹{item.pricePerKg * currentQty})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TRUST STRIP (scr-009) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          AI Mandi गारंटी • Why Buy Direct
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">बाजार से सस्ता</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">औसत 10–20% कम दाम सीधे खेत से</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">AI-स्मार्ट मैच</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">सर्वश्रेष्ठ दाम, निकटतम आपूर्ति व गति</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">कृषक से सीधी खरीद</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">बिचौलियों की कमीशन शून्य</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">ट्रांसपोर्ट पूलिंग</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">कम किराया, सत्यापित वाहन व PoD</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. TODAY'S MARKET PRICE CHIPS TICKER (scr-009) */}
      <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              आज का बाज़ार भाव (Today Mandi Price per kg)
            </h3>
          </div>
          <button
            onClick={onOpenPrices}
            className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            सभी 8+ फसलों का भाव देखें <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {marketPrices.slice(0, 6).map((mp) => (
            <div
              key={mp.id}
              className="bg-white rounded-xl px-3 py-2 border border-slate-200/80 shrink-0 flex items-center gap-2 text-xs shadow-2xs"
            >
              <span className="font-bold text-slate-800">{mp.cropHindi}:</span>
              <span className="font-extrabold text-emerald-700">₹{mp.retailMandiPriceKg}/kg</span>
              <span
                className={`flex items-center text-[10px] font-semibold ${
                  mp.trend === 'UP' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {mp.trend === 'UP' ? (
                  <TrendingUp className="w-3 h-3 inline mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 inline mr-0.5" />
                )}
                {mp.change > 0 ? `+${mp.change}` : mp.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
