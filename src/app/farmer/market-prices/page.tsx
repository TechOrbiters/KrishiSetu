'use client';

import React, { useState } from 'react';
import {
  BarChart2,
  MapPin,
  Calendar,
  ChevronDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';

export default function MarketPricesPage() {
  const [selectedMandi, setSelectedMandi] = useState<string>('लखनऊ, उत्तर प्रदेश');
  const [selectedCrop, setSelectedCrop] = useState<string>('सभी फसलें');
  const [selectedDate, setSelectedDate] = useState<string>('आज का भाव');

  const mandiRows = [
    {
      crop: 'गेहूँ',
      mandi: 'लखनऊ मंडी',
      minPrice: '2,150',
      maxPrice: '2,300',
      avgPrice: '2,225',
      change: '+25',
      trend: 'UP',
      img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=100',
    },
    {
      crop: 'आलू',
      mandi: 'लखनऊ मंडी',
      minPrice: '1,350',
      maxPrice: '1,550',
      avgPrice: '1,450',
      change: '-30',
      trend: 'DOWN',
      img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=100',
    },
    {
      crop: 'धान (साधारण)',
      mandi: 'लखनऊ मंडी',
      minPrice: '1,950',
      maxPrice: '2,150',
      avgPrice: '2,050',
      change: '+18',
      trend: 'UP',
      img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=100',
    },
    {
      crop: 'सरसों',
      mandi: 'लखनऊ मंडी',
      minPrice: '5,150',
      maxPrice: '5,550',
      avgPrice: '5,350',
      change: '+65',
      trend: 'UP',
      img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100',
    },
    {
      crop: 'टमाटर',
      mandi: 'लखनऊ मंडी',
      minPrice: '800',
      maxPrice: '1,100',
      avgPrice: '950',
      change: '-20',
      trend: 'DOWN',
      img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100',
    },
    {
      crop: 'प्याज',
      mandi: 'लखनऊ मंडी',
      minPrice: '1,200',
      maxPrice: '1,500',
      avgPrice: '1,350',
      change: '+10',
      trend: 'UP',
      img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=100',
    },
    {
      crop: 'चना',
      mandi: 'लखनऊ मंडी',
      minPrice: '5,400',
      maxPrice: '5,900',
      avgPrice: '5,650',
      change: '+40',
      trend: 'UP',
      img: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&q=80&w=100',
    },
    {
      crop: 'लहसुन',
      mandi: 'लखनऊ मंडी',
      minPrice: '10,500',
      maxPrice: '11,500',
      avgPrice: '11,000',
      change: '+100',
      trend: 'UP',
      img: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=100',
    },
  ];

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Title Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
            <BarChart2 className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">बाजार भाव</h1>
            <p className="text-xs text-slate-500 font-medium">ताज़ा मंडी भाव जानें और सही दाम पर बेचें</p>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>{selectedMandi}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <span className="text-xs font-semibold text-slate-800">{selectedCrop}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{selectedDate}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 게हूँ */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                ↗
              </div>
              <div className="text-right">
                <h3 className="font-bold text-sm text-slate-900">गेहूँ</h3>
                <div className="font-extrabold text-base text-slate-900">
                  ₹2,225 <span className="text-[10px] text-slate-400 font-normal">/क्विंटल</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-600 pt-1">
              ↑ 25 (1.14%)
            </div>
          </div>

          {/* Card 2: आलू */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-sm">
                ↘
              </div>
              <div className="text-right">
                <h3 className="font-bold text-sm text-slate-900">आलू</h3>
                <div className="font-extrabold text-base text-slate-900">
                  ₹1,450 <span className="text-[10px] text-slate-400 font-normal">/क्विंटल</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-bold text-red-600 pt-1">
              ↓ 30 (2.03%)
            </div>
          </div>

          {/* Card 3: धान (साधारण) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                ↗
              </div>
              <div className="text-right">
                <h3 className="font-bold text-sm text-slate-900">धान (साधारण)</h3>
                <div className="font-extrabold text-base text-slate-900">
                  ₹2,050 <span className="text-[10px] text-slate-400 font-normal">/क्विंटल</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-600 pt-1">
              ↑ 18 (0.88%)
            </div>
          </div>

          {/* Card 4: सरसों */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                ↗
              </div>
              <div className="text-right">
                <h3 className="font-bold text-sm text-slate-900">सरसों</h3>
                <div className="font-extrabold text-base text-slate-900">
                  ₹5,350 <span className="text-[10px] text-slate-400 font-normal">/क्विंटल</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-600 pt-1">
              ↑ 65 (1.23%)
            </div>
          </div>
        </div>

        {/* Mandi Table Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-base text-emerald-700">मंडी के ताज़ा भाव</h2>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <span>आखिरी अपडेट: आज, 08:30 AM</span>
              <RefreshCw className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3.5">फसल</th>
                  <th className="p-3.5">मंडी</th>
                  <th className="p-3.5">न्यूनतम भाव<br /><span className="text-[10px] text-slate-400 font-normal">(₹/क्विंटल)</span></th>
                  <th className="p-3.5">अधिकतम भाव<br /><span className="text-[10px] text-slate-400 font-normal">(₹/क्विंटल)</span></th>
                  <th className="p-3.5">औसत भाव<br /><span className="text-[10px] text-slate-400 font-normal">(₹/क्विंटल)</span></th>
                  <th className="p-3.5">बदलाव<br /><span className="text-[10px] text-slate-400 font-normal">(₹)</span></th>
                  <th className="p-3.5 text-center">रुझान</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mandiRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-3">
                      <img src={row.img} alt={row.crop} className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
                      <span>{row.crop}</span>
                    </td>
                    <td className="p-3.5 text-slate-600">{row.mandi}</td>
                    <td className="p-3.5 text-slate-800">{row.minPrice}</td>
                    <td className="p-3.5 text-slate-800">{row.maxPrice}</td>
                    <td className={`p-3.5 font-extrabold text-sm ${row.trend === 'UP' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {row.avgPrice}
                    </td>
                    <td className={`p-3.5 font-bold ${row.trend === 'UP' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {row.change}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                          row.trend === 'UP'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {row.trend === 'UP' ? '↗' : '↘'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Full Width Button */}
          <button className="w-full py-3 bg-white border border-emerald-600 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs">
            <span>और फसलें देखें</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </FarmerLayout>
  );
}
