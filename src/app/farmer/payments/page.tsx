'use client';

import React from 'react';
import {
  CreditCard,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { formatINR } from '@/lib/domain/pricing';

export default function PaymentsPage() {
  const { orders } = useFarmerStore();

  const totalEarnings = orders.reduce((sum, o) => sum + o.productAmount, 0) + 12050;
  const pendingPayouts = orders
    .filter((o) => o.status === 'IN_TRANSIT' || o.status === 'ACCEPTED')
    .reduce((sum, o) => sum + o.productAmount, 0);

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-border shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-brand-green" />
              <h1 className="text-xl font-bold text-slate-900">भुगतान एवं कमाई (Payments & Earnings)</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              बिना किसी मध्यस्थ कटौती के आपका पूरा फसल मूल्य सीधे आपके बैंक खाते में
            </p>
          </div>

          <button
            onClick={() => alert('पेमेंट लेजर रिपोर्ट डाउनलोड की जा रही है...')}
            className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>रिपोर्ट डाउनलोड करें</span>
          </button>
        </div>

        {/* Zero Transport Deduction Protection Banner */}
        <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
            🛡️
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-emerald-300">100% पारदर्शी किसान आय गारंटी</h3>
            <p className="text-xs text-emerald-100 leading-relaxed">
              KRISHISETU में किसान को उसकी उपज का पूरा तय मूल्य प्राप्त होता है। 
              परिवहन (Delivery Fee) का भुगतान खरीदार द्वारा अलग से किया जाता है। आपकी कमाई से ₹1 भी नहीं काटा जाता।
            </p>
          </div>
        </div>

        {/* 4 Revenue Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-1">
            <span className="text-xs text-slate-400 font-medium block">इस माह की कुल कमाई</span>
            <span className="text-2xl font-extrabold text-brand-green">{formatINR(totalEarnings)}</span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>↑ 18% पिछले माह से</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-1">
            <span className="text-xs text-slate-400 font-medium block">लंबित भुगतान (Pending)</span>
            <span className="text-2xl font-extrabold text-amber-600">{formatINR(pendingPayouts)}</span>
            <span className="text-[11px] text-slate-400 block">डिलीवरी पूर्ण होने पर जारी</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-1">
            <span className="text-xs text-slate-400 font-medium block">सफल लेन-देन</span>
            <span className="text-2xl font-extrabold text-slate-900">24 ऑर्डर</span>
            <span className="text-[11px] text-slate-400 block">100% समय पर भुगतान</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-1">
            <span className="text-xs text-slate-400 font-medium block">प्लेटफॉर्म कमीशन</span>
            <span className="text-2xl font-extrabold text-emerald-600">₹0</span>
            <span className="text-[11px] text-emerald-600 font-bold block">MVP सेवा शुल्क ₹0</span>
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            लेन-देन इतिहास (Transaction Ledger)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-3">ऑर्डर आईडी</th>
                  <th className="p-3">दिनांक</th>
                  <th className="p-3">खरीदार</th>
                  <th className="p-3">फसल व मात्रा</th>
                  <th className="p-3">फसल मूल्य (Farmer Payout)</th>
                  <th className="p-3">परिवहन शुल्क (Buyer Paid)</th>
                  <th className="p-3">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">#{ord.orderNumber}</td>
                    <td className="p-3 text-slate-500">{new Date(ord.createdAt).toLocaleDateString('hi-IN')}</td>
                    <td className="p-3 font-medium text-slate-800">{ord.buyerName} ({ord.buyerLocation})</td>
                    <td className="p-3 text-slate-800">{ord.cropNameHindi} ({ord.quantityKg} kg)</td>
                    <td className="p-3 font-extrabold text-brand-green text-sm">{formatINR(ord.productAmount)}</td>
                    <td className="p-3 text-slate-600">{formatINR(ord.deliveryCharge)} (Paid by Buyer)</td>
                    <td className="p-3">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-full text-[10px] ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status === 'DELIVERED' ? '✓ खाते में जमा (Settled)' : '⏳ एस्क्रौ में सुरक्षित'}
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
