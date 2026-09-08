'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  MapPin,
  Calendar,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  Search,
  Printer,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { getMarketPrices, getMarketPriceSummary, syncMarketPrices } from '@/lib/api/client';
import { MarketPriceRecord, MarketPriceSummaryCard } from '@/lib/types/market';

type CategoryFilter = 'ALL' | 'VEGETABLES' | 'GRAINS' | 'FRUITS' | 'PULSES_OILSEEDS' | 'OTHERS';

export default function MarketPricesPage() {
  const [selectedMandi, setSelectedMandi] = useState<string>('सभी प्रमुख मंडियां (उत्तर प्रदेश - 200+ OGD उत्पाद)');
  const [selectedCrop, setSelectedCrop] = useState<string>('सभी फसलें');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');

  const [prices, setPrices] = useState<MarketPriceRecord[]>([]);
  const [summaryCards, setSummaryCards] = useState<MarketPriceSummaryCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('आज, AGMARKNET');
  const [currentDateText, setCurrentDateText] = useState<string>('आज का भाव');
  const [selectedProduct, setSelectedProduct] = useState<MarketPriceRecord | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 40;

  useEffect(() => {
    setCurrentDateText(`${new Date().toLocaleDateString('hi-IN')} (आज का भाव)`);
  }, []);

  const mandiOptions = [
    { label: 'सभी प्रमुख मंडियां (उत्तर प्रदेश - 200+ OGD उत्पाद)', district: '' },
    { label: 'लखनऊ (Lucknow APMC)', district: 'Lucknow' },
    { label: 'बाराबंकी (Barabanki APMC)', district: 'Barabanki' },
    { label: 'कानपुर नगर (Kanpur APMC)', district: 'Kanpur' },
    { label: 'सीतापुर (Sitapur APMC)', district: 'Sitapur' },
    { label: 'वाराणसी (Varanasi APMC)', district: 'Varanasi' },
    { label: 'आगरा (Agra APMC)', district: 'Agra' },
    { label: 'प्रयागराज (Prayagraj APMC)', district: 'Prayagraj' },
    { label: 'सहारनपुर (Saharanpur APMC)', district: 'Saharanpur' },
    { label: 'मेरठ (Meerut APMC)', district: 'Meerut' },
    { label: 'बरेली (Bareilly APMC)', district: 'Bareilly' },
    { label: 'अयोध्या (Ayodhya / Faizabad)', district: 'Faizabad' },
    { label: 'गोरखपुर (Gorakhpur APMC)', district: 'Gorakhpur' },
    { label: 'मुरादाबाद (Moradabad APMC)', district: 'Moradabad' },
    { label: 'झांसी (Jhansi APMC)', district: 'Jhansi' },
    { label: 'अलीगढ़ (Aligarh APMC)', district: 'Aligarh' },
  ];

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const selectedMandiObj = mandiOptions.find((m) => m.label === selectedMandi);
      const district = selectedMandiObj?.district || undefined;

      // 1. Fetch live comprehensive data from data.gov.in (up to 300 records)
      const res = await getMarketPrices({
        state: 'Uttar Pradesh',
        district,
        commodity: selectedCrop === 'सभी फसलें' ? undefined : selectedCrop,
        limit: 300,
      });

      if (res.success && res.data) {
        setPrices(res.data.prices);
        if (res.data.meta.lastUpdated) {
          setLastUpdated(`आज, ${new Date(res.data.meta.lastUpdated).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}`);
        }
      }

      // 2. Fetch Top KPI Cards
      const summaryRes = await getMarketPriceSummary();
      if (summaryRes.success && summaryRes.data) {
        setSummaryCards(summaryRes.data);
      }
    } catch (err) {
      console.warn('[MarketPricesPage] Error loading market data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncMarketPrices('Uttar Pradesh');
      await fetchMarketData();
    } catch (err) {
      console.warn('[MarketPricesPage] Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [selectedCrop, selectedMandi]);

  // Dynamically extract all unique crops present in the returned dataset
  const cropOptions = useMemo(() => {
    const unique = Array.from(new Set(prices.map((p) => p.commodity))).filter(Boolean).sort();
    return ['सभी फसलें', ...unique];
  }, [prices]);

  // Filter prices by category and search query
  const filteredPrices = useMemo(() => {
    let result = prices;

    // Category filtering
    if (activeCategory !== 'ALL') {
      if (activeCategory === 'PULSES_OILSEEDS') {
        result = result.filter((p) => p.category === 'PULSES' || p.category === 'OILSEEDS');
      } else {
        result = result.filter((p) => p.category === activeCategory);
      }
    }

    // Search query filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        return (
          p.commodity.toLowerCase().includes(q) ||
          (p.commodityHindi && p.commodityHindi.toLowerCase().includes(q)) ||
          p.variety.toLowerCase().includes(q) ||
          p.market.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [prices, activeCategory, searchQuery]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, selectedMandi, selectedCrop]);

  const totalPages = Math.ceil(filteredPrices.length / itemsPerPage) || 1;
  const paginatedPrices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPrices.slice(start, start + itemsPerPage);
  }, [filteredPrices, currentPage]);

  // Count per category
  const categoryCounts = useMemo(() => {
    return {
      ALL: prices.length,
      VEGETABLES: prices.filter((p) => p.category === 'VEGETABLES').length,
      GRAINS: prices.filter((p) => p.category === 'GRAINS').length,
      FRUITS: prices.filter((p) => p.category === 'FRUITS').length,
      PULSES_OILSEEDS: prices.filter((p) => p.category === 'PULSES' || p.category === 'OILSEEDS').length,
      OTHERS: prices.filter((p) => p.category === 'OTHERS' || !p.category).length,
    };
  }, [prices]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-200">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">मंडी के ताज़ा भाव</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Government of India OGD Live
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Layers className="w-3 h-3 text-slate-500" />
                  {prices.length > 0 ? `${prices.length} भाव रिकॉर्ड्स उपलब्ध` : 'डाटा सिंक...'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                KrishiSetu पर AGMARKNET व data.gov.in के माध्यम से उत्तर प्रदेश व देश के संपूर्ण मंडी उत्पादों की वास्तविक रिपोर्ट
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200"
              title="मंडी रिपोर्ट प्रिंट करें"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              रिपोर्ट प्रिंट करें
            </button>
            <Link
              href="/farmer/listings/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-200 hover:shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              अपनी फसल लिस्ट करें
            </Link>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.length > 0 ? (
            summaryCards.map((card, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                      card.trend === 'UP' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                    }`}
                  >
                    {card.trend === 'UP' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-sm text-slate-900">{card.crop}</h3>
                    <div className="font-extrabold text-base text-slate-900">
                      ₹{card.modalPrice.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">/क्विंटल</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{card.mandi}</span>
                  <div
                    className={`text-xs font-bold ${
                      card.trend === 'UP' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {card.changeText}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 py-6 text-center text-xs text-slate-400 font-semibold bg-white rounded-2xl border border-slate-200">
              मंडी भाव लोड हो रहे हैं...
            </div>
          )}
        </div>

        {/* Filter Dropdowns & Live Search Row */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="फसल, मंडी, या जिला खोजें..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mandi Dropdown */}
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 w-full">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <select
                  value={selectedMandi}
                  onChange={(e) => setSelectedMandi(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer w-full truncate"
                >
                  {mandiOptions.map((opt) => (
                    <option key={opt.label} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 pointer-events-none" />
            </div>

            {/* Dynamic Crop Dropdown */}
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer w-full truncate"
              >
                {cropOptions.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop === 'सभी फसलें' ? '🌾 सभी फसलें (All Crops)' : crop}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 pointer-events-none" />
            </div>

            {/* Date Display */}
            <div className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span suppressHydrationWarning className="truncate">{currentDateText}</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            </div>
          </div>

          {/* Category Filter Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-thin">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>सभी फसलें</span>
              <span className="text-[10px] opacity-80 font-normal">({categoryCounts.ALL})</span>
            </button>
            <button
              onClick={() => setActiveCategory('VEGETABLES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'VEGETABLES'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🥬 सब्जियां</span>
              <span className="text-[10px] opacity-80 font-normal">({categoryCounts.VEGETABLES})</span>
            </button>
            <button
              onClick={() => setActiveCategory('GRAINS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'GRAINS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🌾 अनाज</span>
              <span className="text-[10px] opacity-80 font-normal">({categoryCounts.GRAINS})</span>
            </button>
            <button
              onClick={() => setActiveCategory('FRUITS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'FRUITS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🍎 फल</span>
              <span className="text-[10px] opacity-80 font-normal">({categoryCounts.FRUITS})</span>
            </button>
            <button
              onClick={() => setActiveCategory('PULSES_OILSEEDS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'PULSES_OILSEEDS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🫘 दालें व तिलहन</span>
              <span className="text-[10px] opacity-80 font-normal">({categoryCounts.PULSES_OILSEEDS})</span>
            </button>
            <button
              onClick={() => setActiveCategory('OTHERS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'OTHERS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>📦 अन्य उत्पाद</span>
              <span className="text-[10px] opacity-80 font-normal">({categoryCounts.OTHERS})</span>
            </button>
          </div>
        </div>

        {/* Mandi Table Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-emerald-800">मंडी के ताज़ा भाव</h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {filteredPrices.length} उत्पाद मिले
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                स्रोत: Government of India OGD / AGMARKNET (प्रति क्विंटल) • KrishiSetu सत्यापित डाटा
              </p>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold hover:text-emerald-700 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
                title="सरकारी API से ताज़ा डाटा रीफ्रेश करें"
              >
                <span>{lastUpdated}</span>
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3.5 min-w-[200px]">फसल / Variety</th>
                  <th className="p-3.5 min-w-[150px]">मंडी व जिला</th>
                  <th className="p-3.5">
                    न्यूनतम भाव
                    <br />
                    <span className="text-[10px] text-slate-400 font-normal">(₹/क्विंटल)</span>
                  </th>
                  <th className="p-3.5">
                    अधिकतम भाव
                    <br />
                    <span className="text-[10px] text-slate-400 font-normal">(₹/क्विंटल)</span>
                  </th>
                  <th className="p-3.5">
                    मॉडल भाव (Modal)
                    <br />
                    <span className="text-[10px] text-slate-400 font-normal">(₹/क्विंटल)</span>
                  </th>
                  <th className="p-3.5">
                    ₹/kg
                    <br />
                    <span className="text-[10px] text-slate-400 font-normal">(सटीक)</span>
                  </th>
                  <th className="p-3.5 text-center">आगमन तिथि</th>
                  <th className="p-3.5 text-center">रिपोर्ट / विवरण</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400 font-semibold space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                      <p>सरकारी API (data.gov.in) से व्यापक मंडी डाटा (300+ उत्पाद) लोड हो रहे हैं...</p>
                    </td>
                  </tr>
                ) : paginatedPrices.length > 0 ? (
                  paginatedPrices.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedProduct(row)}
                      className={`hover:bg-emerald-50/40 transition-colors cursor-pointer ${
                        row.isLocal ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.cropImage}
                            alt={row.commodity}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-2xs"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{row.commodity}</span>
                              {row.commodityHindi && (
                                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                  {row.commodityHindi}
                                </span>
                              )}
                              {row.isLocal && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                  📍 स्थानीय मंडी
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-normal">{row.variety}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        <div className="font-semibold">{row.market}</div>
                        <p className="text-[11px] text-slate-400">{row.district}, {row.state}</p>
                      </td>
                      <td className="p-3.5 text-slate-800 font-semibold">₹{row.minPrice.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-slate-800 font-semibold">₹{row.maxPrice.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-extrabold text-sm text-emerald-700">
                        ₹{row.modalPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">₹{row.pricePerKg}/kg</td>
                      <td className="p-3.5 text-center font-bold text-slate-600 whitespace-nowrap">
                        {row.rawArrivalDate || row.priceDate}
                      </td>
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedProduct(row)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1"
                        >
                          विवरण
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium space-y-2">
                      <p className="font-semibold text-slate-700">कोई उत्पाद या मंडी भाव नहीं मिला</p>
                      <p className="text-xs text-slate-400">कृपया खोज फ़िल्टर बदलें या &apos;सभी प्रमुख मंडियां&apos; चुनें।</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setActiveCategory('ALL');
                          setSelectedCrop('सभी फसलें');
                          setSelectedMandi('सभी प्रमुख मंडियां (उत्तर प्रदेश - 200+ OGD उत्पाद)');
                        }}
                        className="mt-2 px-4 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200"
                      >
                        सभी फ़िल्टर साफ़ करें
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {filteredPrices.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                दिखाए जा रहे हैं{' '}
                <span className="font-bold text-slate-800">
                  {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filteredPrices.length)}
                </span>{' '}
                / कुल <span className="font-bold text-slate-800">{filteredPrices.length}</span> उत्पाद
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="पिछला पेज"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 px-2">
                  पृष्ठ {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="अगला पेज"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product Details & Direct KrishiSetu Selling Intelligence Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <img
                    src={selectedProduct.cropImage}
                    alt={selectedProduct.commodity}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900">{selectedProduct.commodity}</h3>
                      {selectedProduct.commodityHindi && (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {selectedProduct.commodityHindi}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      किस्म (Variety): {selectedProduct.variety} • {selectedProduct.market}, {selectedProduct.district}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Price Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">न्यूनतम भाव</div>
                  <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                    ₹{selectedProduct.minPrice.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400">/क्विंटल</div>
                </div>
                <div className="border-x border-slate-200 px-2">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">मॉडल भाव (Modal)</div>
                  <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                    ₹{selectedProduct.modalPrice.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600">₹{selectedProduct.pricePerKg}/kg</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">अधिकतम भाव</div>
                  <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                    ₹{selectedProduct.maxPrice.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400">/क्विंटल</div>
                </div>
              </div>

              {/* KrishiSetu Direct Advantage Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    KrishiSetu डायरेक्ट बिक्री लाभ
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    +15% अधिक आय
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  यदि आप यह फसल सीधे KrishiSetu सत्यापित खरीदारों (होटल, व्यापारी, सुपरमार्केट) को बेचते हैं, तो बिचौलियों का कमीशन बचता है।
                </p>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200 font-bold text-slate-800">
                  <span>अनुमानित सीधा दाम:</span>
                  <span className="text-emerald-700 text-sm">
                    ₹{Math.round(selectedProduct.modalPrice * 1.15).toLocaleString('en-IN')} /क्विंटल (₹{Math.round(selectedProduct.pricePerKg * 1.15 * 10) / 10}/kg)
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  बंद करें
                </button>
                <Link
                  href={`/farmer/listings/new?crop=${encodeURIComponent(selectedProduct.commodity)}&basePrice=${selectedProduct.pricePerKg}`}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  KrishiSetu पर लिस्ट करें
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
}
