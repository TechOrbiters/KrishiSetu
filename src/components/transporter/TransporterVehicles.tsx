'use client';

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { TransporterVehicle } from '@/types/transporter';
import { getApiUrl, getAuthHeaders } from '@/lib/api/client';

interface Props {
  vehicles: TransporterVehicle[];
  onRefresh: () => void;
}

export default function TransporterVehicles({ vehicles, onRefresh }: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Mini Truck (Tata Ace)');
  const [model, setModel] = useState('Tata Ace Gold');
  const [capacityKg, setCapacityKg] = useState('1000');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(getApiUrl('/api/vehicles'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          registration_number: regNumber,
          vehicle_type: vehicleType,
          model,
          capacity_kg: Number(capacityKg),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg('नया वाहन सफलतापूर्वक जोड़ा गया और सत्यापित किया गया!');
        setRegNumber('');
        setIsAddModalOpen(false);
        onRefresh();
      } else {
        setErrorMsg(json.error || 'वाहन जोड़ने में त्रुटि हुई');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'त्रुटि हुई');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">वाहन प्रबंधन (Fleet & Vehicle Capacity)</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            स्मार्टमैच एल्गोरिदम के लिए पंजीकृत वाहनों की क्षमता और सत्यापन स्थिति
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>नया वाहन जोड़ें (Add Vehicle)</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black">
                <Truck className="w-5 h-5" />
              </div>
              <span
                className={`text-[10.5px] font-black px-2.5 py-1 rounded-full border ${
                  v.verification_status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {v.verification_status === 'APPROVED' ? '✓ सत्यापित (Approved)' : 'समीक्षाधीन (Pending)'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                पंजीकरण संख्या (Plate)
              </span>
              <h3 className="font-black text-lg text-slate-900 tracking-tight">{v.registration_number}</h3>
              <p className="text-xs text-slate-500 font-semibold">{v.vehicle_type} • {v.model}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">भार क्षमता (Capacity):</span>
                <strong className="text-slate-900 text-sm font-black">{v.capacity_kg} किग्रा</strong>
              </div>
              <span className="text-slate-500 font-bold text-xs">
                ({(v.capacity_kg / 100).toFixed(1)} क्विंटल)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 font-semibold">स्थिति:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                सक्रिय (Active for Dispatch)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD VEHICLE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">नया वाहन पंजीकृत करें (Add Vehicle)</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  वाहन नंबर (Registration Number)*
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. UP32 AB 5566"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-600 uppercase font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">वाहन का प्रकार (Vehicle Type)*</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-600 font-semibold"
                >
                  <option value="Mini Truck (Tata Ace)">मिनी ट्रक / छोटा हाथी (Tata Ace)</option>
                  <option value="Pickup 1.5T (Bolero Maxi)">पिकअप 1.5 टन (Bolero Maxi Truck)</option>
                  <option value="Medium Truck (Eicher 14ft)">मध्यम ट्रक (Eicher 14-17ft)</option>
                  <option value="Heavy Truck 10-Wheeler">बड़ा ट्रक (10 Wheeler / 15T+)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">मॉडल नाम (Model / Make)</label>
                <input
                  type="text"
                  placeholder="उदा. Tata Ace Gold 2024"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  अधिकतम भार क्षमता (Capacity in KG)*
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  max="40000"
                  value={capacityKg}
                  onChange={(e) => setCapacityKg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-600 font-semibold"
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  1000 किग्रा = 10 क्विंटल
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-colors"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'सत्यापित हो रहा है...' : 'वाहन जोड़ें (Register Vehicle)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
