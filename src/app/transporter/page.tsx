'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Package,
  Navigation,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
  X,
  Power,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/lib/api/client';

interface TransportJob {
  id: string;
  order_id: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  fare_amount: number;
  distance_km: number;
  pickup_address?: string;
  delivery_address?: string;
  weight_kg?: number;
  crop_name?: string;
  created_at: string;
}

export default function TransporterPortalPage() {
  // Role persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishi_active_role', 'TRANSPORTER');
    }
  }, []);

  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'earnings'>('available');
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [activeTrips, setActiveTrips] = useState<TransportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadTransportRequests();
  }, []);

  const loadTransportRequests = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(getApiUrl('/api/transport/requests'), { headers });
      const json = await res.json();

      if (json.success && Array.isArray(json.requests)) {
        // Separate into available and active
        const available = json.requests
          .filter((r: any) => r.status === 'REQUESTED' || r.status === 'BROADCAST')
          .map((r: any) => ({
            ...r,
            weight_kg: r.orders?.quantity || 250,
            crop_name: r.orders?.produce_listings?.crop_name || r.orders?.crop_name || 'ताज़ा उपज',
            pickup_address: r.orders?.produce_listings?.location_name || r.pickup_address || 'फार्म / मंडी',
            delivery_address: r.orders?.delivery_address || r.delivery_address || 'खरीदार गंतव्य',
          }));

        const active = json.requests
          .filter((r: any) => r.status === 'ACCEPTED' || r.status === 'IN_TRANSIT')
          .map((r: any) => ({
            ...r,
            weight_kg: r.orders?.quantity || 300,
            crop_name: r.orders?.produce_listings?.crop_name || r.orders?.crop_name || 'उपज लॉट',
            pickup_address: r.orders?.produce_listings?.location_name || r.pickup_address || 'फार्म / मंडी',
            delivery_address: r.orders?.delivery_address || r.delivery_address || 'खरीदार गंतव्य',
          }));

        setJobs(available);
        setActiveTrips(active);
      } else {
        setJobs([]);
        setActiveTrips([]);
      }
    } catch (err: any) {
      console.error('Error loading transport requests:', err);
      setJobs([]);
      setActiveTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (job: TransportJob) => {
    setAcceptingId(job.id);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(getApiUrl(`/api/transport/requests/${job.id}/accept`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          vehicle_capacity_kg: 1000,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`ट्रिप सफलतापूर्वक स्वीकार की गई! कुल कमाई: ₹${job.fare_amount}`);
        // Move from available to active trips
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
        setActiveTrips((prev) => [{ ...job, status: 'ACCEPTED' }, ...prev]);
        setActiveTab('active');
      } else {
        setErrorMsg(json.error || 'ट्रिप स्वीकार करने में त्रुटि। कृपया पुनः प्रयास करें।');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'त्रुटि हुई।');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleUpdateTripStatus = async (tripId: string, newStatus: 'IN_TRANSIT' | 'COMPLETED') => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(getApiUrl(`/api/transport/requests/${tripId}`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (newStatus === 'COMPLETED') {
          const finishedTrip = activeTrips.find((t) => t.id === tripId);
          setActiveTrips((prev) => prev.filter((t) => t.id !== tripId));
          setSuccessMsg(`डिलीवरी सफलतापूर्वक पूरी हुई! ₹${finishedTrip?.fare_amount || 0} आपके खाते में जमा हो गए।`);
        } else {
          setActiveTrips((prev) =>
            prev.map((t) => (t.id === tripId ? { ...t, status: newStatus } : t))
          );
          setSuccessMsg('ट्रिप स्टेटस अपडेट: ट्रांजिट में (IN TRANSIT)');
        }
      } else {
        setErrorMsg(json.error || 'स्टेटस अपडेट करने में त्रुटि हुई');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'त्रुटि हुई');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 1. TOP HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-lg shadow-xs group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-xl text-orange-800 tracking-tight block leading-tight">
                  Kisan Bazaar
                </span>
                <span className="text-[10px] text-slate-500 font-bold block">परिवहन साथी (Transporter Portal)</span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-6 w-px bg-slate-200" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-xl">
              <span>वाहन: टाटा ऐस (1000 किग्रा क्षमता)</span>
            </div>
          </div>

          {/* Right Status Toggle & Refresh */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{isOnline ? 'ड्यूटी ऑन (Online)' : 'ड्यूटी ऑफ (Offline)'}</span>
            </button>

            <button
              onClick={loadTransportRequests}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
              title="रिफ्रेश करें"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href="/"
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors hidden sm:block"
            >
              मुख्य पृष्ठ
            </Link>
          </div>
        </div>

        {/* 2. SUB NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-100 flex gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'available'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🌾 उपलब्ध डिलीवरी (SmartMatch) ({jobs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🚚 सक्रिय ट्रिप्स ({activeTrips.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'earnings'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>💰 कमाई विवरण (100% Payout)</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Alerts */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold p-4 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-300 text-red-800 text-sm font-bold p-4 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-700 hover:text-red-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 text-xs font-semibold block">आज की कुल कमाई</span>
            <div className="flex items-baseline gap-1">
              <strong className="text-2xl font-black text-slate-900">₹1,990</strong>
              <span className="text-[11px] text-emerald-600 font-bold">100% ड्राइवर को</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">3 पूर्ण ट्रिप्स से</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 text-xs font-semibold block">सक्रिय ट्रिप</span>
            <div className="flex items-baseline gap-1">
              <strong className="text-2xl font-black text-orange-600">{activeTrips.length}</strong>
              <span className="text-[11px] text-slate-500 font-bold">प्रगति पर</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">लाइव ट्रैकिंग जारी</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 text-xs font-semibold block">ऑन-टाइम डिलीवरी दर</span>
            <div className="flex items-baseline gap-1">
              <strong className="text-2xl font-black text-emerald-700">98.8%</strong>
              <span className="text-[11px] text-emerald-600 font-bold">★ 4.9</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">फ्रेशनेस विंडो के अंदर</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 text-xs font-semibold block">प्लेटफ़ॉर्म कटौती</span>
            <div className="flex items-baseline gap-1">
              <strong className="text-2xl font-black text-blue-700">₹0</strong>
              <span className="text-[11px] text-emerald-600 font-bold">0% Commission</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">नियम R-001 का पालन</span>
          </div>
        </div>

        {/* TAB 1: AVAILABLE DELIVERIES */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">उपलब्ध डिलीवरी कार्य (SmartMatch)</h2>
                <p className="text-xs text-slate-500 font-medium">
                  आपके वाहन की क्षमता (1000 किग्रा) और रूट के अनुकूल नए ऑर्डर
                </p>
              </div>
              <button onClick={loadTransportRequests} className="text-xs font-bold text-orange-600 hover:underline">
                रिफ्रेश करें
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse h-32" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
                <Truck className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">वर्तमान में कोई नई डिलीवरी उपलब्ध नहीं है</h3>
                <p className="text-xs text-slate-500">नया ऑर्डर मिलते ही यहाँ स्वतः दिखाई देगा।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Job Line */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="bg-orange-50 text-orange-800 text-xs font-extrabold px-2.5 py-1 rounded-md border border-orange-200">
                            ★ बेस्ट मैच
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{job.distance_km} किमी रूट</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">आपकी कमाई</span>
                          <strong className="text-xl font-black text-orange-700">₹{job.fare_amount}</strong>
                        </div>
                      </div>

                      {/* Cargo details */}
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-sm text-slate-900">{job.crop_name}</h3>
                        <p className="text-xs text-slate-600 font-semibold">
                          भार: <strong>{job.weight_kg} किग्रा</strong> (क्षमता में उपलब्ध)
                        </p>
                      </div>

                      {/* Route details */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold text-sm">🟢</span>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">पिक-अप (खेत / किसान):</span>
                            <strong className="text-slate-800 font-semibold">{job.pickup_address}</strong>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 font-bold text-sm">🔴</span>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">डिलीवरी गंतव्य (खरीदार):</span>
                            <strong className="text-slate-800 font-semibold">{job.delivery_address}</strong>
                          </div>
                        </div>
                      </div>

                      {/* FreshRoute status */}
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>FreshRoute: फसल फ्रेशनेस सुरक्षित (ETA: 45 मिनट)</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleAcceptJob(job)}
                        disabled={acceptingId === job.id}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{acceptingId === job.id ? 'स्वीकार किया जा रहा है...' : 'डिलीवरी स्वीकार करें (Accept)'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE TRIPS */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">मेरी सक्रिय ट्रिप्स (Active Trips)</h2>
                <p className="text-xs text-slate-500 font-medium">वर्तमान में प्रगति पर ट्रिप्स और स्थिति अपडेट</p>
              </div>
            </div>

            {activeTrips.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
                <Truck className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">कोई सक्रिय ट्रिप नहीं है</h3>
                <p className="text-xs text-slate-500">उपलब्ध डिलीवरी टैब से नई ट्रिप स्वीकार करें।</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  डिलीवरी देखें
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs text-slate-400 font-bold block">ट्रिप आईडी: #{trip.id.slice(-8)}</span>
                        <h3 className="font-extrabold text-base text-slate-900">{trip.crop_name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">कुल भाड़ा</span>
                        <strong className="text-lg font-black text-orange-700">₹{trip.fare_amount}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                        <div>
                          <span className="text-slate-400 block font-bold text-[10px]">पिक-अप पता:</span>
                          <strong className="text-slate-800 font-semibold">{trip.pickup_address}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[10px]">डिलीवरी गंतव्य:</span>
                          <strong className="text-slate-800 font-semibold">{trip.delivery_address}</strong>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-2">
                        {trip.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleUpdateTripStatus(trip.id, 'IN_TRANSIT')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                          >
                            <Truck className="w-4 h-4" />
                            <span>लोड उठा लिया - रास्ते में निकलें (Mark In Transit)</span>
                          </button>
                        )}

                        {trip.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => handleUpdateTripStatus(trip.id, 'COMPLETED')}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>डिलीवरी पूर्ण हुई (Mark Delivered)</span>
                          </button>
                        )}

                        {trip.status === 'COMPLETED' && (
                          <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-3 rounded-xl border border-emerald-200 text-center">
                            ✓ सफलतापूर्वक डिलीवर हो गया
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EARNINGS BREAKDOWN */}
        {activeTab === 'earnings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">ड्राइवर पारदर्शी कमाई विवरण (Domain Rule R-001)</h2>
              <p className="text-xs text-slate-500 font-medium">
                किसान सेतु पर ट्रांसपोर्टर को डिलीवरी शुल्क का 100% भुगतान बिना किसी कमीशन कटौती के सीधे मिलता है।
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-3 font-extrabold text-slate-700 grid grid-cols-4">
                <span>विवरण / तारीख</span>
                <span>दूरी (किमी)</span>
                <span>भार (किग्रा)</span>
                <span className="text-right">शुद्ध कमाई (₹)</span>
              </div>
              {[
                { date: 'आज, 10:15 AM', desc: 'सूरतगंज → लखनऊ मंडी', km: 28, kg: 350, fare: 650 },
                { date: 'कल, 04:30 PM', desc: 'बंकी → दुबग्गा मंडी', km: 36, kg: 500, fare: 820 },
                { date: 'कल, 11:00 AM', desc: 'देवा शरीफ → चिनहट मंडी', km: 18, kg: 200, fare: 520 },
              ].map((row, idx) => (
                <div key={idx} className="p-3 border-t border-slate-100 grid grid-cols-4 text-slate-800 items-center">
                  <div>
                    <strong className="block text-slate-900">{row.desc}</strong>
                    <span className="text-[10px] text-slate-400">{row.date}</span>
                  </div>
                  <span>{row.km} किमी</span>
                  <span>{row.kg} किग्रा</span>
                  <strong className="text-right text-emerald-700 font-extrabold">₹{row.fare}</strong>
                </div>
              ))}
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-extrabold text-emerald-900">इस सप्ताह की कुल शुद्ध कमाई:</span>
              <strong className="text-lg font-black text-emerald-800">₹1,990</strong>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
