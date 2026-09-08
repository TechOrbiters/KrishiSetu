'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  MapPin,
  Calendar,
  ChevronDown,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { getMarketPrices, getMarketPriceSummary, syncMarketPrices } from '@/lib/api/client';
import { MarketPriceRecord, MarketPriceSummaryCard } from '@/lib/types/market';

export default function MarketPricesPage() {
  const [selectedMandi, setSelectedMandi] = useState<string>('लखनऊ, उत्तर प्रदेश');
  const [selectedCrop, setSelectedCrop] = useState<string>('सभी फसलें');
  const [selectedDate, setSelectedDate] = useState<string>('आज का भाव');

  const [prices, setPrices] = useState<MarketPriceRecord[]>([]);
  const [summaryCards, setSummaryCards] = useState<MarketPriceSummaryCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('आज, AGMARKNET');
  const [currentDateText, setCurrentDateText] = useState<string>('आज का भाव');

  useEffect(() => {
    setCurrentDateText(`${new Date().toLocaleDateString('hi-IN')} (आज का भाव)`);
  }, []);

  const mandiOptions = [
    { label: 'लखनऊ, उत्तर प्रदेश', district: 'Lucknow' },
    { label: 'बाराबंकी, उत्तर प्रदेश', district: 'Barabanki' },
    { label: 'सीतापुर, उत्तर प्रदेश', district: 'Sitapur' },
    { label: 'कानपुर, उत्तर प्रदेश', district: 'Kanpur' },
    { label: 'सभी मंडी (उत्तर प्रदेश)', district: '' },
  ];

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const selectedMandiObj = mandiOptions.find((m) => m.label === selectedMandi);
      const district = selectedMandiObj?.district || undefined;

      // 1. Fetch Mandi Table Records
      const res = await getMarketPrices({
        state: 'Uttar Pradesh',
        district,
        commodity: selectedCrop === 'सभी फसलें' ? undefined : selectedCrop,
        limit: 50,
      });

      if (res.success && res.data) {
        setPrices(res.data.prices);
        if (res.data.meta.lastUpdated) {
          setLastUpdated(`आज, ${new Date(res.data.meta.lastUpdated).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}`);
        }
      }

      // 2. Fetch 4 Top KPI Cards
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

  const cropOptions = [
    'सभी फसलें',
    'Wheat',
    'Potato',
    'Paddy(Common)',
    'Mustard',
    'Tomato',
    'Onion',
    'Garlic',
    'Gram',
  ];

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
              <BarChart2 className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">बाजार भाव</h1>
              <p className="text-xs text-slate-500 font-medium">
                सत्यापित सरकारी मंडी भाव (data.gov.in / AGMARKNET)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              Government OGD Data
            </span>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 w-full">
              <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <select
                value={selectedMandi}
                onChange={(e) => setSelectedMandi(e.target.value)}
                className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer w-full"
              >
                {mandiOptions.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer w-full"
            >
              {cropOptions.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span suppressHydrationWarning>{currentDateText}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.length > 0 ? (
            summaryCards.map((card, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                      card.trend === 'UP' ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-slate-900'
                    }`}
                  >
                    {card.trend === 'UP' ? '↗' : '↘'}
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-sm text-slate-900">{card.crop}</h3>
                    <div className="font-extrabold text-base text-slate-900">
                      ₹{card.modalPrice.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">/क्विंटल</span>
                    </div>
                  </div>
                </div>
                <div
                  className={`text-xs font-bold pt-1 ${
                    card.trend === 'UP' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {card.changeText}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 py-8 text-center text-xs text-slate-400 font-semibold bg-white rounded-2xl border border-slate-200">
              मंडी भाव लोड हो रहे हैं...
            </div>
          )}
        </div>

        {/* Mandi Table Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-emerald-700">मंडी के ताज़ा भाव</h2>
              <p className="text-[10px] text-slate-400 font-semibold">
                स्रोत: Government of India OGD / AGMARKNET (प्रति क्विंटल)
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold hover:text-emerald-700 transition-colors"
              title="डाटा रीफ्रेश करें"
            >
              <span>{lastUpdated}</span>
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3.5">फसल / Variety</th>
                  <th className="p-3.5">मंडी</th>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">
                      सरकारी API (data.gov.in) से ताज़ा भाव प्राप्त हो रहे हैं...
                    </td>
                  </tr>
                ) : prices.length > 0 ? (
                  prices.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-3">
                        <img
                          src={row.cropImage}
                          alt={row.commodity}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <span>{row.commodity}</span>
                          <p className="text-[10px] text-slate-400 font-normal">{row.variety}</p>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {row.market}
                        <p className="text-[10px] text-slate-400">{row.district}</p>
                      </td>
                      <td className="p-3.5 text-slate-800">₹{row.minPrice.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-slate-800">₹{row.maxPrice.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-extrabold text-sm text-emerald-700">
                        ₹{row.modalPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">₹{row.pricePerKg}/kg</td>
                      <td className="p-3.5 text-center font-bold text-slate-600">
                        {row.rawArrivalDate || row.priceDate}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">
                      कोई मंडी भाव उपलब्ध नहीं है।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
