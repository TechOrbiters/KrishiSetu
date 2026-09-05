'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, CheckCircle2, Sparkles, PlusCircle } from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';

export default function FPOAggregationPage() {
  const router = useRouter();
  const { fpoMembers, aggregateFPOLot } = useFarmerStore();
  const [selectedCrop, setSelectedCrop] = useState<string>('टमाटर');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['mem_1', 'mem_2', 'mem_3']);

  const toggleSelect = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedFarmers = fpoMembers.filter((m) => selectedMembers.includes(m.id));
  const totalAggregatedKg = selectedFarmers.reduce((sum, m) => sum + m.totalHarvestKg, 0);

  const handleAggregate = () => {
    aggregateFPOLot(selectedMembers, selectedCrop);
    alert(`सफलतापूर्वक ${totalAggregatedKg} kg का थोक लॉट (Bulk Lot) बनाकर लिस्ट कर दिया गया है!`);
    router.push('/farmer/listings');
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-purple-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
              <Layers className="w-4 h-4 text-purple-300" />
              FPO लॉट एग्रीगेशन सिस्टम
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-2 leading-tight">
              किसान उपज पूलिंग व एग्रीगेशन (Lot Aggregation)
            </h1>
            <p className="text-xs text-purple-200 mt-1">
              छोटे किसानों की उपज को बड़े थोक लॉट में एकत्रित कर bulk buyers से अधिकतम मूल्य प्राप्त करें।
            </p>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] text-purple-200 block uppercase font-bold">एकत्रित लॉट मात्रा</span>
            <span className="text-2xl font-extrabold text-amber-300">{totalAggregatedKg} kg</span>
          </div>
        </div>

        {/* Aggregation Setup Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Member Selection Checklist */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-base text-slate-900">सदस्य किसान चुनें (Select Contributing Members)</h2>
              <span className="text-xs text-slate-500">{selectedMembers.length} किसान चुने गए</span>
            </div>

            <div className="space-y-2">
              {fpoMembers.map((m) => {
                const isChecked = selectedMembers.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleSelect(m.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isChecked
                        ? 'bg-purple-50 border-brand-purple'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                          isChecked ? 'bg-brand-purple text-white' : 'border border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{m.name}</h4>
                        <span className="text-[11px] text-slate-500">{m.village} · उपज: {m.cropProduced}</span>
                      </div>
                    </div>

                    <span className="font-extrabold text-brand-green">{m.totalHarvestKg} kg</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aggregated Lot Preview Card */}
          <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4 h-fit">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              लॉट समरी (Aggregated Lot Summary)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">फसल श्रेणी:</label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="टमाटर">टमाटर (Tomato)</option>
                  <option value="गेहूँ">गेहूँ (Wheat)</option>
                  <option value="आलू">आलू (Potato)</option>
                </select>
              </div>

              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-1 text-purple-900">
                <span className="text-[11px] font-bold block">कुल एग्रीगेटेड मात्रा:</span>
                <span className="text-2xl font-extrabold text-brand-purple">{totalAggregatedKg} kg</span>
                <span className="text-[10px] text-purple-700 block pt-1">
                  💡 **FPO लाभ:** 1,000kg से अधिक लॉट पर थोक खरीदार ₹3/kg तक प्रीमियम दर देने को तैयार रहते हैं।
                </span>
              </div>
            </div>

            <button
              onClick={handleAggregate}
              className="w-full bg-brand-purple text-white font-extrabold text-xs py-3 rounded-xl hover:bg-purple-800 transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>लॉट बनाएं और लिस्ट करें</span>
            </button>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
