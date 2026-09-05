'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Phone,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';

export default function FPOMemberManagementPage() {
  const { fpoMembers, addFPOMember, user } = useFarmerStore();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [village, setVillage] = useState<string>('बैजनाथपुर');
  const [contact, setContact] = useState<string>('');
  const [crop, setCrop] = useState<string>('गेहूँ, आलू');

  const handleCreate = () => {
    if (!name.trim()) return;
    addFPOMember({
      name,
      village,
      contact: contact || '98765 00000',
      cropProduced: crop,
      totalHarvestKg: 500,
      status: 'ACTIVE',
    });
    setName('');
    setShowAddModal(false);
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-900 text-white p-6 rounded-2xl shadow-md">
          <div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
              <ShieldCheck className="w-4 h-4 text-purple-300" />
              {user.fpoName || 'शर्मा एफपीओ (Sharma FPO)'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-2 leading-tight">
              FPO किसान सदस्य प्रबंधन (Member Management)
            </h1>
            <p className="text-xs text-purple-200 mt-1">
              कुल {user.memberCount || 250} किसान सदस्य · {user.onTimePct || 98}% समयबद्धता रिकॉर्ड
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-purple-900 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ नया सदस्य जोड़ें</span>
          </button>
        </div>

        {/* Member List */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            सदस्य किसान सूची (Linked Farmers)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-3">किसान का नाम</th>
                  <th className="p-3">गाँव</th>
                  <th className="p-3">संपर्क</th>
                  <th className="p-3">प्रमुख फसलें</th>
                  <th className="p-3">अनुमानित उपज</th>
                  <th className="p-3">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fpoMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{m.name}</td>
                    <td className="p-3 text-slate-600">{m.village}</td>
                    <td className="p-3 text-slate-600">📞 {m.contact}</td>
                    <td className="p-3 text-slate-800 font-semibold">{m.cropProduced}</td>
                    <td className="p-3 font-bold text-brand-green">{m.totalHarvestKg} kg</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                        ● {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
              <h3 className="font-bold text-base text-slate-900">नया किसान सदस्य जोड़ें</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">किसान का नाम:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="उदा. रामप्रसाद यादव"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">गाँव:</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">संपर्क नंबर:</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="98765 00000"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">मुख्य फसलें:</label>
                  <input
                    type="text"
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  रद्द करें
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-900 rounded-xl hover:bg-purple-800"
                >
                  जोड़ें
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
}
