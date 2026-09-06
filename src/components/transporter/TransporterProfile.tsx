'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Truck,
  MapPin,
  ShieldCheck,
  Award,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Save,
  Power,
  RefreshCw,
  FileCheck,
  Building2,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/lib/api/client';

interface Props {
  onProfileUpdated?: () => void;
}

export default function TransporterProfile({ onProfileUpdated }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [capacityKg, setCapacityKg] = useState(1000);
  const [locationName, setLocationName] = useState('');
  const [availability, setAvailability] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(getApiUrl('/api/transporters/profile'), { headers });
      const json = await res.json();
      if (json.success && json.profile) {
        setProfile(json.profile);
        setFullName(json.profile.full_name || json.user?.full_name || '');
        setPhone(json.profile.phone || json.user?.phone || '');
        setVehicleNumber(json.profile.vehicle_number || '');
        setVehicleType(json.profile.vehicle_type || 'Mini Truck (Tata Ace)');
        setCapacityKg(json.profile.capacity_kg || 1000);
        setLocationName(json.profile.location_name || 'लखनऊ / बाराबंकी मंडी क्लस्टर');
        setAvailability(json.profile.availability !== false);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(getApiUrl('/api/transporters/profile'), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          full_name: fullName,
          phone,
          vehicle_number: vehicleNumber,
          vehicle_type: vehicleType,
          capacity_kg: capacityKg,
          location_name: locationName,
          availability,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: 'success', text: 'प्रोफ़ाइल सफलतापूर्वक सहेज ली गई!' });
        setProfile(json.profile);
        onProfileUpdated?.();
      } else {
        setMessage({ type: 'error', text: json.error || 'प्रोफ़ाइल अपडेट करने में विफल।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'त्रुटि हुई।' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDuty = async () => {
    const nextVal = !availability;
    setAvailability(nextVal);
    try {
      const headers = await getAuthHeaders();
      await fetch(getApiUrl('/api/transporters/availability'), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ availability: nextVal }),
      });
      onProfileUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 bg-white rounded-3xl border border-slate-200 animate-pulse" />
        <div className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Identity Card */}
      <div className="bg-gradient-to-r from-orange-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-md border border-orange-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-2xl shadow-md border border-orange-400/30">
            {fullName ? fullName.slice(0, 1) : <Truck className="w-8 h-8" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-white">{fullName || 'ट्रांसपोर्ट साथी'}</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                केवाईसी सत्यापित (Verified)
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium flex items-center gap-2">
              <span>{vehicleType}</span>
              <span>•</span>
              <span>{vehicleNumber}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">★ {profile?.rating || '4.85'}</span>
            </p>
          </div>
        </div>

        {/* Duty Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleDuty}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all border shadow-xs ${
              availability
                ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{availability ? 'ड्यूटी ऑन (Online)' : 'ड्यूटी ऑफ (Offline)'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-2xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-red-50 text-red-900 border border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Transporter Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-orange-600" />
              <h3 className="font-black text-sm text-slate-900">व्यक्तिगत एवं संपर्क विवरण</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">पूरा नाम (Full Name)</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="उदा. रमेश कुमार यादव"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">मोबाइल नंबर (Mobile Number)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">आधार व सेवा क्षेत्र (Base Mandi / Cluster)</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="उदा. लखनऊ - बाराबंकी - सीतापुर कॉरिडोर"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle & Transit Specs */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Truck className="w-4 h-4 text-orange-600" />
              <h3 className="font-black text-sm text-slate-900">प्राथमिक वाहन विनिर्देश (Vehicle Specs)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">वाहन का प्रकार (Vehicle Type)</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="Mini Truck (Tata Ace)">मिनी ट्रक - टाटा ऐस (750 - 1000 किग्रा)</option>
                  <option value="Pickup Truck (Mahindra Bolero Maxi)">पिकअप - महिंद्रा बोलेरो (1200 - 1700 किग्रा)</option>
                  <option value="E-Loader (3-Wheeler)">ई-लोडर 3-व्हीलर (500 किग्रा)</option>
                  <option value="Medium Truck (Tata 407 / Eicher)">मध्यम ट्रक - टाटा 407 (2500 - 3500 किग्रा)</option>
                  <option value="Heavy Truck (10-Ton)">बड़ा ट्रक (10 टन लॉजिस्टिक्स)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">पंजीकरण संख्या (Registration Number)</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none uppercase"
                  placeholder="UP32 BT 4821"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">अधिकतम भार वहन क्षमता (Capacity in kg)</label>
                <input
                  type="number"
                  value={capacityKg}
                  onChange={(e) => setCapacityKg(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  min={100}
                  max={25000}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Bank Payout (Rule R-001) & Compliance */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="font-black text-sm text-slate-900">प्रत्यक्ष भुगतान खाता (Domain Rule R-001 Bank Payout)</h3>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <Award className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-xs text-emerald-900 block font-black">
                100% प्रत्यक्ष बैंक ट्रांसफर (Direct Driver Payout)
              </strong>
              <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                कृषिसेतु प्लेटफॉर्म नियम R-001 के तहत ग्राहक द्वारा चुकाया गया संपूर्ण परिवहन शुल्क ₹0 कमीशन कटौती के साथ सीधे आपके खाते में क्रेडिट होता है।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 block text-[10px] font-bold">बैंक का नाम:</span>
              <strong className="text-slate-800 font-bold block">स्टेट बैंक ऑफ इंडिया (SBI)</strong>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 block text-[10px] font-bold">खाता संख्या:</span>
              <strong className="text-slate-800 font-mono font-bold block">•••• •••• 4912</strong>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 block text-[10px] font-bold">आईएफएससी कोड:</span>
              <strong className="text-slate-800 font-mono font-bold block">SBIN0001234</strong>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'सहेजा जा रहा है...' : 'परिवर्तन सहेजें (Save Changes)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
