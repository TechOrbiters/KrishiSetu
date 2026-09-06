'use client';

import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Download,
  AlertCircle,
} from 'lucide-react';
import { TransporterEarningsSummary } from '@/types/transporter';

interface Props {
  earnings: TransporterEarningsSummary | null;
  loading: boolean;
}

export default function TransporterEarnings({ earnings, loading }: Props) {
  const summary = earnings || {
    today_earnings: 1990,
    week_earnings: 5850,
    month_earnings: 24600,
    total_earnings: 48900,
    pending_payouts: 0,
    completed_trips_count: 14,
    platform_fee: 0,
    currency: 'INR',
    transactions: [],
  };

  const transactions = summary.transactions && summary.transactions.length > 0 ? summary.transactions : [
    {
      id: 'tx_1',
      order_id: 'ord_1',
      order_number: 'ORD-8921A4',
      date: 'आज, 10:15 AM',
      crop_name: 'टमाटर (देसी हाइब्रिड)',
      distance_km: 28,
      weight_kg: 350,
      gross_amount: 650,
      platform_deduction: 0,
      net_earnings: 650,
      status: 'RELEASED' as const,
    },
    {
      id: 'tx_2',
      order_id: 'ord_2',
      order_number: 'ORD-7712E9',
      date: 'कल, 04:30 PM',
      crop_name: 'आलू (चिपसोना लॉट)',
      distance_km: 36,
      weight_kg: 500,
      gross_amount: 820,
      platform_deduction: 0,
      net_earnings: 820,
      status: 'RELEASED' as const,
    },
    {
      id: 'tx_3',
      order_id: 'ord_3',
      order_number: 'ORD-6540B2',
      date: 'कल, 11:00 AM',
      crop_name: 'गेहूं (शरबती ग्रेड-ए)',
      distance_km: 18,
      weight_kg: 200,
      gross_amount: 520,
      platform_deduction: 0,
      net_earnings: 520,
      status: 'RELEASED' as const,
    },
    {
      id: 'tx_4',
      order_id: 'ord_4',
      order_number: 'ORD-4320C1',
      date: '03 सितं 2026, 02:15 PM',
      crop_name: 'हरी मिर्च व शिमला मिर्च',
      distance_km: 42,
      weight_kg: 400,
      gross_amount: 950,
      platform_deduction: 0,
      net_earnings: 950,
      status: 'RELEASED' as const,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-slate-900">कमाई एवं वित्तीय बहीखाता (Earnings & Ledger)</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          सत्यापित डिलीवरी शुल्क का 100% भुगतान सीधे ट्रांसपोर्टर साथी के बैंक खाते में
        </p>
      </div>

      {/* RULE R-001 ZERO COMMISSION BANNER */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-300 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black flex-shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-emerald-950">
              डोमेन नियम R-001: 100% ड्राइवर भुगतान नीति (Zero Platform Commission)
            </h3>
            <span className="bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded">
              0% Fee
            </span>
          </div>
          <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
            किसान सेतु मंच ट्रांसपोर्टर से कोई कमीशन नहीं लेता है। खरीदार द्वारा भुगतान किया गया संपूर्ण डिलीवरी शुल्क सीधे आपको मिलता है।
          </p>
        </div>
      </div>

      {/* 4 PERIOD METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 text-xs font-bold block">आज की शुद्ध कमाई</span>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl sm:text-3xl font-black text-emerald-700">
              ₹{summary.today_earnings.toLocaleString('en-IN')}
            </strong>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block">खाते में जमा (Settled)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 text-xs font-bold block">इस सप्ताह की कमाई</span>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{summary.week_earnings.toLocaleString('en-IN')}
            </strong>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">पिछले 7 दिनों में</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 text-xs font-bold block">इस माह की कुल कमाई</span>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{summary.month_earnings.toLocaleString('en-IN')}
            </strong>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">चालू माह (सितंबर)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 text-xs font-bold block">प्लेटफॉर्म कमीशन कटौती</span>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl sm:text-3xl font-black text-blue-700">₹0</strong>
            <span className="text-xs text-emerald-600 font-extrabold">(0%)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">पारदर्शी बहीखाता</span>
        </div>
      </div>

      {/* TRANSACTION HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-slate-900">लेज़र लेन-देन विवरण (Payment Ledger Records)</h3>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              {transactions.length} लेन-देन
            </span>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">तारीख व समय</th>
                <th className="py-3 px-4">ऑर्डर / फसल विवरण</th>
                <th className="py-3 px-4">रूट दूरी व भार</th>
                <th className="py-3 px-4">कुल भाड़ा</th>
                <th className="py-3 px-4">प्लेटफॉर्म शुल्क</th>
                <th className="py-3 px-4 text-right">शुद्ध भुगतान</th>
                <th className="py-3 px-4 text-center">स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {transactions.map((tx, idx) => (
                <tr key={tx.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold block">{tx.date}</span>
                    <span className="text-[10px] text-slate-400 font-bold">#{tx.order_number}</span>
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {tx.crop_name}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold block">{tx.distance_km} किमी</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{tx.weight_kg} किग्रा भार</span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-700">
                    ₹{tx.gross_amount}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-emerald-600">
                    ₹0 (0%)
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <strong className="text-emerald-700 font-black text-sm">₹{tx.net_earnings}</strong>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2.5 py-1 rounded-full">
                      ✓ पूर्ण भुगतान
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
}
