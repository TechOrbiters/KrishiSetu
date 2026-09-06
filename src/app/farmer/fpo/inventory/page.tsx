'use client';

import React from 'react';
import { Package, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';

export default function FPOInventoryPage() {
  const { listings } = useFarmerStore();

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-brand-purple" />
              <h1 className="text-xl font-bold text-slate-900">एफपीओ इन्वेंटरी (FPO Inventory)</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              एफपीओ द्वारा प्रबंधित सभी एकीकृत लॉट, उपलब्ध स्टॉक और ताज़गी स्थिति
            </p>
          </div>

          <div className="bg-purple-50 text-brand-purple border border-purple-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>1.2T tomato demand detected nearby</span>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            वर्तमान इन्वेंटरी लॉट सूची (Current Inventory Lots)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-3">लॉट आईडी / फसल</th>
                  <th className="p-3">कुल मात्रा</th>
                  <th className="p-3">आवंटित (Allocated)</th>
                  <th className="p-3">उपलब्ध स्टॉक</th>
                  <th className="p-3">ताज़गी विंडो</th>
                  <th className="p-3">मांग स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      LOT-{item.id.slice(0, 8).toUpperCase()} ({item.cropNameHindi})
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{item.quantityKg} kg</td>
                    <td className="p-3 text-slate-600">{item.quantityKg - item.availableQtyKg} kg</td>
                    <td className="p-3 font-bold text-brand-green">{item.availableQtyKg} kg</td>
                    <td className="p-3 text-slate-600">{item.freshnessWindowHours} घंटे</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                        उच्च मांग (High Demand)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
