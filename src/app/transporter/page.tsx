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
  Star,
  Bell,
  User,
  SlidersHorizontal,
  Home,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/lib/api/client';
import {
  SmartMatchJob,
  TransporterTrip,
  TransporterEarningsSummary,
  TransporterVehicle,
} from '@/types/transporter';

// Subcomponents
import TransporterDashboard from '@/components/transporter/TransporterDashboard';
import TransporterSmartMatch from '@/components/transporter/TransporterSmartMatch';
import TransporterMyTrips from '@/components/transporter/TransporterMyTrips';
import TransporterLiveTracking from '@/components/transporter/TransporterLiveTracking';
import TransporterVehicles from '@/components/transporter/TransporterVehicles';
import TransporterEarnings from '@/components/transporter/TransporterEarnings';
import TransporterRatings from '@/components/transporter/TransporterRatings';
import TransporterNotifications from '@/components/transporter/TransporterNotifications';
import TransporterProfile from '@/components/transporter/TransporterProfile';

type TabType =
  | 'dashboard'
  | 'available'
  | 'trips'
  | 'tracking'
  | 'vehicles'
  | 'earnings'
  | 'ratings'
  | 'notifications'
  | 'profile';

export default function TransporterPortalPage() {
  // Role persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishi_active_role', 'TRANSPORTER');
    }
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [jobs, setJobs] = useState<SmartMatchJob[]>([]);
  const [activeTrips, setActiveTrips] = useState<TransporterTrip[]>([]);
  const [vehicles, setVehicles] = useState<TransporterVehicle[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<TransporterEarningsSummary | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadAllTransporterData();
  }, []);

  const loadAllTransporterData = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();

      // Parallel fetching from backend APIs
      const [jobsRes, tripsRes, earningsRes, profileRes, vehiclesRes] = await Promise.all([
        fetch(getApiUrl('/api/transporters/jobs'), { headers }).then((r) => r.json()).catch(() => ({ jobs: [] })),
        fetch(getApiUrl('/api/transporters/trips'), { headers }).then((r) => r.json()).catch(() => ({ trips: [] })),
        fetch(getApiUrl('/api/transporters/earnings'), { headers }).then((r) => r.json()).catch(() => ({ summary: null })),
        fetch(getApiUrl('/api/transporters/profile'), { headers }).then((r) => r.json()).catch(() => ({ profile: null })),
        fetch(getApiUrl('/api/vehicles'), { headers }).then((r) => r.json()).catch(() => ({ vehicles: [] })),
      ]);

      if (jobsRes.success && Array.isArray(jobsRes.jobs)) {
        setJobs(jobsRes.jobs);
      }
      if (tripsRes.success && Array.isArray(tripsRes.trips)) {
        setActiveTrips(tripsRes.trips);
      }
      if (earningsRes.success && earningsRes.summary) {
        setEarnings(earningsRes.summary);
      }
      if (profileRes.success && profileRes.profile) {
        setProfile(profileRes.profile);
        setIsOnline(profileRes.profile.availability !== false);
      }
      if (vehiclesRes.success && Array.isArray(vehiclesRes.vehicles)) {
        setVehicles(vehiclesRes.vehicles);
      } else if (profileRes.vehicles && Array.isArray(profileRes.vehicles)) {
        setVehicles(profileRes.vehicles);
      }
    } catch (err: any) {
      console.error('Error loading transporter portal data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllTransporterData();
  };

  const handleToggleOnline = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    try {
      const headers = await getAuthHeaders();
      await fetch(getApiUrl('/api/transporters/availability'), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ availability: nextState }),
      });
      setSuccessMsg(
        nextState
          ? 'ड्यूटी चालू: अब आपको नए SmartMatch ऑर्डर्स प्राप्त होंगे।'
          : 'ड्यूटी बंद: आप वर्तमान में नए ऑर्डर्स के लिए ऑफलाइन हैं।'
      );
    } catch (err: any) {
      console.error('Error toggling duty status:', err);
      setIsOnline(!nextState);
      setErrorMsg('ड्यूटी स्टेटस अपडेट करने में त्रुटि हुई।');
    }
  };

  const handleAcceptJob = async (job: SmartMatchJob) => {
    setAcceptingId(job.id);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(getApiUrl(`/api/transport/requests/${job.id}/accept`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          vehicle_capacity_kg: profile?.capacity_kg || 1000,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`ट्रिप सफलतापूर्वक स्वीकार की गई! अनुमानित कमाई: ₹${job.fare_amount} (100% ड्राइवर को)`);
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
        loadAllTransporterData();
        setActiveTab('trips');
      } else {
        setErrorMsg(json.error || 'ट्रिप स्वीकार करने में त्रुटि हुई। यह कार्य किसी अन्य ट्रांसपोर्टर द्वारा लिया जा चुका है।');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'नेटवर्क त्रुटि हुई।');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeclineJob = async (jobId: string) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(getApiUrl(`/api/transport/requests/${jobId}/decline`), {
        method: 'POST',
        headers,
      });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setSuccessMsg('कार्य सूची से हटा दिया गया।');
    } catch (err: any) {
      setErrorMsg('कार्य हटाने में त्रुटि।');
    }
  };

  const handleUpdateTripAction = async (
    tripId: string,
    action: 'ARRIVED_AT_PICKUP' | 'CONFIRM_PICKUP' | 'START_TRANSIT' | 'ARRIVED_DESTINATION' | 'DELIVERED'
  ) => {
    try {
      const headers = await getAuthHeaders();
      let endpoint = `/api/transport/requests/${tripId}`;
      let method = 'PATCH';
      let body: any = {};

      if (action === 'ARRIVED_AT_PICKUP') {
        endpoint = `/api/shipments/${tripId}/pickup`;
        method = 'POST';
        body = { status: 'ARRIVED_AT_PICKUP' };
      } else if (action === 'CONFIRM_PICKUP') {
        endpoint = `/api/shipments/${tripId}/pickup`;
        method = 'POST';
        body = { status: 'PICKED_UP' };
      } else if (action === 'START_TRANSIT') {
        endpoint = `/api/shipments/${tripId}/start`;
        method = 'POST';
        body = {};
      } else if (action === 'ARRIVED_DESTINATION') {
        endpoint = `/api/shipments/${tripId}/arrive`;
        method = 'POST';
        body = {};
      } else if (action === 'DELIVERED') {
        endpoint = `/api/shipments/${tripId}/deliver`;
        method = 'POST';
        body = {};
      }

      const res = await fetch(getApiUrl(endpoint), {
        method,
        headers,
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (action === 'DELIVERED') {
          setSuccessMsg('डिलीवरी सफलतापूर्वक पूर्ण हुई! 100% परिवहन शुल्क आपके खाते में रिलीज हो गया है।');
        } else {
          setSuccessMsg(`ट्रिप स्थिति अपडेट सफल: ${action}`);
        }
        loadAllTransporterData();
      } else {
        setErrorMsg(json.error || 'स्थिति अपडेट करने में त्रुटि हुई।');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'नेटवर्क त्रुटि हुई।');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 1. TOP HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-xl text-orange-700 tracking-tight block leading-tight">
                  KrishiSetu
                </span>
                <span className="text-[10px] text-slate-500 font-bold block">
                  परिवहन साथी (Transporter Portal)
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-6 w-px bg-slate-200" />
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-700 font-bold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span>{profile?.vehicle_type || 'टाटा ऐस (मिनी ट्रक)'}</span>
              <span className="text-slate-400">•</span>
              <span className="text-orange-700 font-mono">{profile?.vehicle_number || 'UP32 TR 1001'}</span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Duty Status Button */}
            <button
              onClick={handleToggleOnline}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all border shadow-2xs ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isOnline ? 'ड्यूटी ऑन (Online)' : 'ड्यूटी ऑफ (Offline)'}
              </span>
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`p-2 rounded-xl transition-colors relative ${
                activeTab === 'notifications'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="सूचनाएं देखें"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors disabled:opacity-50"
              title="डेटा रिफ्रेश करें"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>

            {/* Home Portal Link */}
            <Link
              href="/"
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors hidden lg:flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>मुख्य पृष्ठ</span>
            </Link>
          </div>
        </div>

        {/* 2. HORIZONTAL NAVIGATION BAR */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-100 flex gap-1 sm:gap-2 overflow-x-auto text-xs font-black no-scrollbar py-1">
          {[
            { key: 'dashboard', label: '📊 डैशबोर्ड' },
            { key: 'available', label: `🌾 उपलब्ध डिलीवरी (${jobs.length})` },
            { key: 'trips', label: `🚚 मेरी ट्रिप्स (${activeTrips.length})` },
            { key: 'tracking', label: '🗺️ लाइव ट्रैकिंग' },
            { key: 'vehicles', label: '🚛 वाहन बेड़ा' },
            { key: 'earnings', label: '💰 कमाई (100% Payout)' },
            { key: 'ratings', label: '⭐ रेटिंग व समीक्षा' },
            { key: 'notifications', label: '🔔 सूचनाएं' },
            { key: 'profile', label: '👤 प्रोफ़ाइल' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-orange-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Alert: Success */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Banner Alert: Error */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-300 text-red-900 text-xs sm:text-sm font-bold p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-700 hover:text-red-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB SWITCHING */}
        {activeTab === 'dashboard' && (
          <TransporterDashboard
            isOnline={isOnline}
            onToggleOnline={handleToggleOnline}
            jobs={jobs}
            activeTrips={activeTrips}
            earnings={earnings}
            onNavigateTab={(tab) => setActiveTab(tab as TabType)}
            onAcceptJob={handleAcceptJob}
            acceptingId={acceptingId}
          />
        )}

        {activeTab === 'available' && (
          <TransporterSmartMatch
            jobs={jobs}
            loading={loading}
            onRefresh={handleRefresh}
            onAcceptJob={handleAcceptJob}
            onDeclineJob={(job) => handleDeclineJob(job.id)}
            acceptingId={acceptingId}
            driverCapacityKg={profile?.capacity_kg || 1000}
          />
        )}

        {activeTab === 'trips' && (
          <TransporterMyTrips
            trips={activeTrips}
            loading={loading}
            onRefresh={handleRefresh}
            onUpdateTripStatus={handleUpdateTripAction}
            onOpenLiveTracking={(trip) => {
              setSelectedTripId(trip.id);
              setActiveTab('tracking');
            }}
          />
        )}

        {activeTab === 'tracking' && (
          <TransporterLiveTracking
            trips={activeTrips}
            selectedTripId={selectedTripId}
            onUpdateTripStatus={handleUpdateTripAction}
          />
        )}

        {activeTab === 'vehicles' && (
          <TransporterVehicles
            vehicles={vehicles}
            onRefresh={loadAllTransporterData}
          />
        )}

        {activeTab === 'earnings' && (
          <TransporterEarnings
            earnings={earnings}
            loading={loading}
          />
        )}

        {activeTab === 'ratings' && <TransporterRatings />}

        {activeTab === 'notifications' && (
          <TransporterNotifications onNavigateTab={(tab) => setActiveTab(tab as TabType)} />
        )}

        {activeTab === 'profile' && (
          <TransporterProfile onProfileUpdated={loadAllTransporterData} />
        )}
      </main>
    </div>
  );
}
