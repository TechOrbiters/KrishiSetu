import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LiveTrackingMap } from '../maps/LiveTrackingMap';
import { TransporterTrip } from '../../types';
import {
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  Phone,
  Shield,
  Star,
  Navigation,
  Bot,
  RotateCcw,
  Sparkles,
  ArrowRight,
  LogOut,
  Mic,
  MicOff,
  Volume2,
  Radio,
  Send,
  Loader2,
  Check,
  Compass,
  Menu,
  X,
  Award,
  CreditCard,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseTransporterVoiceCommand, speakWithSarvamAI } from '../../lib/apiServices';
import { TransporterSmartMatchView } from './TransporterSmartMatchView';
import { TransporterMyTripsView } from './TransporterMyTripsView';
import { TransporterEarningsView } from './TransporterEarningsView';
import { TransporterRatingsView } from './TransporterRatingsView';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { logisticsSync } from '../../lib/realtime/logisticsSync';
import { getApiUrl, getAuthHeaders } from '../../lib/api/client';

export type TransporterNavTab = 'DASHBOARD' | 'SMARTMATCH' | 'MY_TRIPS' | 'EARNINGS' | 'RATINGS';

interface TransporterPortalProps {
  onBackToLanding: () => void;
  onLogout?: () => void;
  availableTrips: TransporterTrip[];
  setAvailableTrips: React.Dispatch<React.SetStateAction<TransporterTrip[]>>;
  onOpenKrishiAI: () => void;
  onAcceptJob?: (tripId: string) => Promise<void> | void;
  onRejectJob?: (tripId: string) => Promise<void> | void;
  onUpdateTripStatus?: (tripId: string, status: TransporterTrip['status']) => Promise<void> | void;
  onUpdateTripLocation?: (tripId: string, location: { lat: number; lng: number; speedKmh?: number; address?: string }) => Promise<void> | void;
}

export const TransporterPortal: React.FC<TransporterPortalProps> = ({
  onBackToLanding,
  onLogout,
  availableTrips = [],
  setAvailableTrips,
  onOpenKrishiAI,
  onAcceptJob,
  onRejectJob,
  onUpdateTripStatus,
  onUpdateTripLocation,
}) => {
  const { t } = useLanguage();
  const handleExit = onLogout || onBackToLanding;
  const [activeNavTab, setActiveNavTab] = useState<TransporterNavTab>('DASHBOARD');
  const [isOnline, setIsOnline] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Real backend metrics states
  const [profile, setProfile] = useState<any>(null);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [ratingsData, setRatingsData] = useState<any>(null);

  const fetchRealData = async () => {
    try {
      const headers = await getAuthHeaders();
      const [profRes, earnRes, rateRes] = await Promise.all([
        fetch(getApiUrl('/api/transporters/profile'), { headers }).then((r) => r.json()).catch(() => null),
        fetch(getApiUrl('/api/transporters/earnings'), { headers }).then((r) => r.json()).catch(() => null),
        fetch(getApiUrl('/api/transporters/ratings'), { headers }).then((r) => r.json()).catch(() => null),
      ]);
      if (profRes?.profile) setProfile(profRes.profile);
      if (earnRes?.success) setEarningsData(earnRes);
      if (rateRes?.success) setRatingsData(rateRes);
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('krishi_transporter_profile') || localStorage.getItem('krishi_user_session');
        if (cached) {
          const p = JSON.parse(cached);
          setProfile({
            full_name: p.name || p.full_name || 'राजेश कुमार (राज ट्रांसपोर्ट)',
            vehicle_number: p.vehicle_number || p.vehicleNumber || 'UP 32 AB 1234',
            vehicle_type: p.vehicle_type || p.vehicleType || 'Mini Truck',
            phone: p.phone || '+91 98765 43210',
          });
        }
      } catch (e) {}
    }
    fetchRealData();
  }, []);

  const [incomingJobAlert, setIncomingJobAlert] = useState<TransporterTrip | null>(null);

  useEffect(() => {
    const unsubscribe = logisticsSync.subscribe((event) => {
      if (['JOB_ACCEPTED', 'TRIP_STATUS_UPDATED', 'POD_VERIFIED'].includes(event.type)) {
        fetchRealData();
      }
      if ((event.type === 'ORDER_ACCEPTED' || event.type === 'TRANSPORT_REQUESTED') && event.payload?.trip) {
        setIncomingJobAlert(event.payload.trip as TransporterTrip);
      }
      if (event.type === 'ORDER_REJECTED') {
        setIncomingJobAlert((prev) =>
          prev?.orderCode === event.payload?.orderId || prev?.id === event.payload?.orderId ? null : prev
        );
      }
    });
    return () => unsubscribe();
  }, []);

  const handleToggleDuty = () => {
    const nextVal = !isOnline;
    setIsOnline(nextVal);
    logisticsSync.broadcast('DUTY_STATUS_TOGGLED', {
      transporter: {
        isOnline: nextVal,
        name: profile?.full_name || 'राजेश कुमार (राज ट्रांसपोर्ट)',
        vehicleNumber: profile?.vehicle_number || 'UP 32 AB 1234',
        vehicleType: profile?.vehicle_type || 'Tata Ace (छोटा हाथी)',
      },
    });
  };

  // Voice Command Listener State (Sarvam AI)
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<{
    status?: string;
    statusHindi?: string;
    hindiFeedback?: string;
    success?: boolean;
  } | null>(null);
  const [customCommandInput, setCustomCommandInput] = useState('');
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Pure real-time active trip selection - NO DUMMY FALLBACK
  const tripsList = Array.isArray(availableTrips) ? availableTrips : [];
  const currentTrip =
    (selectedTripId ? tripsList.find((t) => t.id === selectedTripId) : null) ||
    tripsList.find((t) => t.status === 'IN_TRANSIT' || t.status === 'PICKED_UP' || t.status === 'ACCEPTED') ||
    null;

  // Sync active step when trip status changes
  useEffect(() => {
    if (!currentTrip) return;
    if (currentTrip.status === 'ACCEPTED') setActiveStep(1);
    else if (currentTrip.status === 'PICKED_UP') setActiveStep(2);
    else if (currentTrip.status === 'IN_TRANSIT') setActiveStep(3);
    else if (currentTrip.status === 'DELIVERED') setActiveStep(4);
  }, [currentTrip?.id, currentTrip?.status]);

  // Dynamic transporter coordinates based on current active step
  const getTransporterCoords = () => {
    switch (activeStep) {
      case 1:
        return { lat: 26.9340, lng: 81.1910 };
      case 2:
        return { lat: 26.9284, lng: 81.1834 };
      case 3:
        return { lat: 26.8904, lng: 81.0623 };
      case 4:
        return { lat: 26.8524, lng: 80.9412 };
      default:
        return { lat: 26.8904, lng: 81.0623 };
    }
  };

  const originCoords = currentTrip?.pickupCoords || {
    lat: 26.9284,
    lng: 81.1834,
    label: currentTrip?.pickupLocation || 'बैजनाथपुर FPO फार्म (बाराबंकी)',
  };

  const destinationCoords = currentTrip?.dropCoords || {
    lat: 26.8524,
    lng: 80.9412,
    label: currentTrip?.dropLocation || 'सीतापुर रोड नवीन गल्ला मंडी (लखनऊ)',
  };

  const liveTransporterLocation = {
    lat: currentTrip?.currentLocation?.lat ?? getTransporterCoords().lat,
    lng: currentTrip?.currentLocation?.lng ?? getTransporterCoords().lng,
    driverName: currentTrip?.driverName || 'राज ट्रांसपोर्ट (राजेश कुमार)',
    vehicleNumber: currentTrip?.vehicleNumber || 'UP 32 AB 1234',
  };

  const handleAcceptJobInternal = async (tripId: string) => {
    if (onAcceptJob) {
      await onAcceptJob(tripId);
    } else {
      setAvailableTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, status: 'ACCEPTED' } : t))
      );
    }
    setSelectedTripId(tripId);
    try {
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
    } catch (e) {}
  };

  const handleRejectJobInternal = async (tripId: string) => {
    if (onRejectJob) {
      await onRejectJob(tripId);
    } else {
      setAvailableTrips((prev) => prev.filter((t) => t.id !== tripId));
    }
  };

  const handleAdvanceActiveTrip = async (newStatus: TransporterTrip['status'], stepNumber: number) => {
    setActiveStep(stepNumber);
    let targetLoc = { lat: 26.8904, lng: 81.0623, speedKmh: 42, address: 'लखनऊ-अयोध्या हाईवे NH-27' };
    if (stepNumber === 1) targetLoc = { lat: 26.9340, lng: 81.1910, speedKmh: 0, address: 'बाराबंकी ट्रांसपोर्ट हब' };
    if (stepNumber === 2) targetLoc = { lat: 26.9284, lng: 81.1834, speedKmh: 0, address: 'बैजनाथपुर फार्म गेट' };
    if (stepNumber === 3) targetLoc = { lat: 26.8904, lng: 81.0623, speedKmh: 48, address: 'अयोध्या-लखनऊ हाईवे (जुगगौर के पास)' };
    if (stepNumber === 4) targetLoc = { lat: 26.8524, lng: 80.9412, speedKmh: 0, address: 'सीतापुर रोड नवीन गल्ला मंडी गेट' };

    if (currentTrip && onUpdateTripStatus) {
      await onUpdateTripStatus(currentTrip.id, newStatus);
      if (onUpdateTripLocation) {
        await onUpdateTripLocation(currentTrip.id, targetLoc);
      }
    } else if (currentTrip) {
      setAvailableTrips((prev) =>
        prev.map((t) =>
          t.id === currentTrip.id
            ? {
                ...t,
                status: newStatus,
                currentLocation: {
                  ...targetLoc,
                  lastUpdated: 'अभी-अभी',
                },
              }
            : t
        )
      );
    }
    if (newStatus === 'DELIVERED') {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    }
  };

  const handleSimulateStepMovement = async () => {
    if (!currentTrip) return;
    const curLat = liveTransporterLocation.lat;
    const curLng = liveTransporterLocation.lng;
    const destLat = destinationCoords.lat;
    const destLng = destinationCoords.lng;

    const nextLat = Number((curLat + (destLat - curLat) * 0.25).toFixed(4));
    const nextLng = Number((curLng + (destLng - curLng) * 0.25).toFixed(4));

    const updatedLoc = {
      lat: nextLat,
      lng: nextLng,
      speedKmh: Math.floor(Math.random() * 15) + 40,
      address: 'लखनऊ-अयोध्या एक्सप्रेसवे किमी ' + Math.floor(Math.random() * 20 + 12),
      lastUpdated: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    if (onUpdateTripLocation) {
      await onUpdateTripLocation(currentTrip.id, updatedLoc);
    } else {
      setAvailableTrips((prev) =>
        prev.map((t) =>
          t.id === currentTrip.id ? { ...t, currentLocation: updatedLoc } : t
        )
      );
    }
  };

  const handleProcessVoiceCommand = async (commandText: string) => {
    if (!commandText || !commandText.trim()) return;
    setIsProcessingVoice(true);
    setVoiceTranscript(commandText);
    try {
      const currentStatus = currentTrip ? currentTrip.status : 'IN_TRANSIT';
      const result = await parseTransporterVoiceCommand(commandText, currentStatus);

      setVoiceFeedback({
        status: result.status,
        statusHindi: result.statusHindi,
        hindiFeedback: result.hindiFeedback,
        success: true,
      });

      await handleAdvanceActiveTrip(result.status, result.stepNumber);

      setIsSpeakingAudio(true);
      try {
        await speakWithSarvamAI(result.hindiFeedback, 'hi-IN');
      } catch (audioErr) {
        console.warn('Sarvam TTS audio note:', audioErr);
      } finally {
        setIsSpeakingAudio(false);
      }
    } catch (err: any) {
      console.error('Voice command error:', err);
      setVoiceFeedback({
        status: undefined,
        hindiFeedback: err.message || 'कमांड समझ नहीं आई। कृपया दोबारा बोलें (जैसे: फार्म पहुँच गया, लोड हो गया, डिलीवर हो गया)',
        success: false,
      });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceFeedback({
        status: undefined,
        hindiFeedback: 'ब्राउज़र में सीधे माइक्रोफोन सपोर्ट उपलब्ध नहीं है। कृपया त्वरित वॉइस बटन पर क्लिक करें।',
        success: false,
      });
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        setVoiceFeedback(null);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setVoiceTranscript(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceTranscript((latest) => {
          if (latest && latest.trim()) {
            handleProcessVoiceCommand(latest);
          }
          return latest;
        });
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleReplayFeedback = async () => {
    if (!voiceFeedback?.hindiFeedback) return;
    setIsSpeakingAudio(true);
    try {
      await speakWithSarvamAI(voiceFeedback.hindiFeedback, 'hi-IN');
    } catch (e) {
      console.warn('Replay audio err:', e);
    } finally {
      setIsSpeakingAudio(false);
    }
  };

  const availableCount = availableTrips.filter((t) => t.status === 'AVAILABLE').length;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar (Navigation shown in image) */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex lg:flex-col justify-between shrink-0 shadow-2xs z-20">
        <div>
          {/* Logo & Brand */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="KrishiSetu Logo" className="w-9 h-9 object-contain shrink-0" />
              <div>
                <h1 className="font-extrabold text-sm text-slate-900 leading-tight">
                  KrishiSetu
                </h1>
                <p className="text-[10px] font-bold text-amber-700 tracking-wide uppercase">
                  ट्रांसपोर्टर पोर्टल
                </p>
              </div>
            </div>
            <button
              onClick={handleExit}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="पोर्टल से बाहर निकलें"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Transporter Profile Pill */}
          <div className="p-3 mx-3 my-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
              🚚
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-slate-800 truncate">
                {profile?.full_name || 'राज ट्रांसपोर्ट (राजेश)'}
              </div>
              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <span>{profile?.vehicle_number || 'UP 32 AB 1234'}</span>
                <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-semibold">
                  {profile?.vehicle_type || 'Mini Truck'}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Nav (Matching 100% with image) */}
          <nav className="px-3 space-y-1 overflow-y-auto text-xs font-medium">
            <button
              onClick={() => setActiveNavTab('DASHBOARD')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold transition-all ${
                activeNavTab === 'DASHBOARD'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{t('dashboard')}</span>
            </button>

            {/* Feature 1 from image: उपलब्ध डिलीवरी (SmartMatch) */}
            <button
              onClick={() => setActiveNavTab('SMARTMATCH')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                activeNavTab === 'SMARTMATCH'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t('availableTrips')}</span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] ${
                  activeNavTab === 'SMARTMATCH'
                    ? 'bg-white text-amber-900'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {availableCount}
              </span>
            </button>

            {/* Feature 2: activeDeliveries */}
            <button
              onClick={() => setActiveNavTab('MY_TRIPS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold transition-all ${
                activeNavTab === 'MY_TRIPS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>{t('activeDeliveries')}</span>
            </button>

            {/* Feature 3: analytics */}
            <button
              onClick={() => setActiveNavTab('EARNINGS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold transition-all ${
                activeNavTab === 'EARNINGS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{t('analytics')}</span>
            </button>

            {/* Feature 4: profile */}
            <button
              onClick={() => setActiveNavTab('RATINGS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold transition-all ${
                activeNavTab === 'RATINGS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>{t('profile')}</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom: AI साथी */}
        <div className="p-3.5 mx-3 mb-3 bg-gradient-to-br from-amber-700 to-amber-800 text-white rounded-xl shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-amber-200" />
            <span className="text-xs font-bold">AI साथी आपकी मदद के लिए</span>
          </div>
          <p className="text-[11px] text-amber-100 leading-relaxed mb-2.5">
            बेहतर कमाई और स्मार्ट ट्रिप के सुझाव तुरंत पाएं
          </p>
          <button
            onClick={onOpenKrishiAI}
            className="w-full py-1.5 bg-white text-amber-900 text-xs font-bold rounded-lg shadow-2xs transition-colors hover:bg-amber-50"
          >
            AI साथी से बात करें
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 text-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                👋 नमस्ते, {profile?.full_name || 'Raj Transport'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeNavTab === 'DASHBOARD' && 'आज आपके लिए ये बेहतरीन डिलीवरी के मौके हैं'}
                {activeNavTab === 'SMARTMATCH' && 'उपलब्ध डिलीवरी व SmartTransport AI मैचिंग'}
                {activeNavTab === 'MY_TRIPS' && 'लाइव GPS नेविगेशन व सक्रिय ट्रिप प्रबंधन'}
                {activeNavTab === 'EARNINGS' && 'वित्तीय विवरण, किराया विश्लेषण व तत्काल निकासी'}
                {activeNavTab === 'RATINGS' && (ratingsData?.overview?.total_reviews ? `आपकी ${ratingsData.overview.overall_rating}★ रेटिंग और सत्यापित समीक्षाएं` : 'सत्यापित परफॉरमेंस व रेटिंग प्रोफ़ाइल')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Duty Status Toggle (scr-004) */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs">
              <span className="text-slate-600 font-medium">ड्यूटी:</span>
              <button
                type="button"
                onClick={handleToggleDuty}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isOnline ? 'bg-emerald-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isOnline ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`font-bold ${isOnline ? 'text-emerald-800' : 'text-slate-400'}`}>
                {isOnline ? 'ऑनलाइन' : 'ऑफलाइन'}
              </span>
            </div>

            {/* Language Selector */}
            <LanguageSelector variant="light" showLabel={false} />

            <button
              onClick={onOpenKrishiAI}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI असिस्टेंट</span>
            </button>

            <button
              onClick={handleExit}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
            >
              {t('switchRole')}
            </button>
          </div>
        </header>

        {/* Mobile & Tablet Side Panel Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
              aria-hidden="true"
            />

            {/* Slide-Out Side Panel */}
            <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-hidden animate-slideInLeft">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                    KS
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-slate-900 leading-tight">
                      KrishiSetu
                    </h2>
                    <p className="text-[10px] font-bold text-amber-700 tracking-wide uppercase">
                      ट्रांसपोर्टर पोर्टल
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Transporter Profile Pill */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                    🚚
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-800 truncate">
                      {profile?.full_name || 'राज ट्रांसपोर्ट (राजेश)'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <span>{profile?.vehicle_number || 'UP 32 AB 1234'}</span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-semibold">
                        {profile?.vehicle_type || 'Mini Truck'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Duty Toggle in Drawer */}
                <div className="flex items-center justify-between p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs">
                  <span className="text-slate-700 font-bold">ड्यूटी स्थिति:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleDuty}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        isOnline ? 'bg-emerald-700' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          isOnline ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`font-bold text-xs ${isOnline ? 'text-emerald-800' : 'text-slate-400'}`}>
                      {isOnline ? 'ऑनलाइन' : 'ऑफलाइन'}
                    </span>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
                    पोर्टल सुविधाएं (Features)
                  </div>
                  <button
                    onClick={() => {
                      setActiveNavTab('DASHBOARD');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold text-xs transition-all ${
                      activeNavTab === 'DASHBOARD'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>{t('dashboard')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveNavTab('SMARTMATCH');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-bold text-xs transition-all ${
                      activeNavTab === 'SMARTMATCH'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{t('availableTrips')}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] ${
                        activeNavTab === 'SMARTMATCH'
                          ? 'bg-white text-amber-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {availableCount}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveNavTab('MY_TRIPS');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold text-xs transition-all ${
                      activeNavTab === 'MY_TRIPS'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{t('activeDeliveries')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveNavTab('EARNINGS');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold text-xs transition-all ${
                      activeNavTab === 'EARNINGS'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>{t('analytics')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveNavTab('RATINGS');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold text-xs transition-all ${
                      activeNavTab === 'RATINGS'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    <span>{t('profile')}</span>
                  </button>
                </div>

                {/* AI Assistant Banner */}
                <div className="p-3 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-xl shadow-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-amber-200" />
                    <span className="text-xs font-bold">AI साथी आपकी मदद के लिए</span>
                  </div>
                  <p className="text-[11px] text-amber-100 leading-relaxed mb-2.5">
                    बेहतर कमाई और स्मार्ट ट्रिप के सुझाव तुरंत पाएं
                  </p>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenKrishiAI();
                    }}
                    className="w-full py-1.5 bg-white text-amber-900 text-xs font-bold rounded-lg shadow-2xs transition-colors hover:bg-amber-50"
                  >
                    AI साथी से बात करें
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                <LanguageSelector variant="light" showLabel={false} />
                <button
                  onClick={handleExit}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('switchRole')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body Router */}
        <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: SMARTMATCH */}
          {activeNavTab === 'SMARTMATCH' && (
            <TransporterSmartMatchView
              availableTrips={availableTrips}
              onAcceptJob={handleAcceptJobInternal}
              onRejectJob={handleRejectJobInternal}
              onOpenKrishiAI={onOpenKrishiAI}
            />
          )}

          {/* TAB 2: MY TRIPS */}
          {activeNavTab === 'MY_TRIPS' && (
            <TransporterMyTripsView
              availableTrips={availableTrips}
              setAvailableTrips={setAvailableTrips}
              onOpenKrishiAI={onOpenKrishiAI}
              onUpdateTripStatus={onUpdateTripStatus}
              onUpdateTripLocation={onUpdateTripLocation}
            />
          )}

          {/* TAB 3: EARNINGS */}
          {activeNavTab === 'EARNINGS' && <TransporterEarningsView />}

          {/* TAB 4: RATINGS */}
          {activeNavTab === 'RATINGS' && <TransporterRatingsView />}

          {/* TAB 0: DASHBOARD (Unified Executive Overview) */}
          {activeNavTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left & Center Main Work Area (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Top Quick Metric Banner */}
                <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-emerald-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span className="text-xs font-bold text-amber-200 uppercase">
                          SmartMatch AI मैचिंग सक्रिय
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-extrabold mt-0.5">
                        {availableCount > 0
                          ? `${availableCount} नई डिलीवरी आपके ${profile?.vehicle_type || 'मिनी ट्रक'} के लिए तैयार हैं`
                          : 'वर्तमान में कोई नया डिलीवरी अनुरोध उपलब्ध नहीं है'}
                      </div>
                      {availableCount === 0 && (
                        <p className="text-xs text-amber-200/80 mt-1">
                          जैसे ही किसान या खरीदार डिजिटल डिलीवरी का ऑर्डर बुक करेंगे, आपको यहाँ तुरंत अलर्ट मिलेगा।
                        </p>
                      )}
                    </div>
                    {availableCount > 0 && (
                      <button
                        onClick={() => setActiveNavTab('SMARTMATCH')}
                        className="px-3.5 py-1.5 bg-white text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1"
                      >
                        <span>सभी डिलीवरी देखें ({availableCount})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Active Trip Box (scr-004) */}
                {currentTrip ? (
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                          {currentTrip.orderCode}
                        </span>
                        <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          <span>{currentTrip.status === 'IN_TRANSIT' ? 'रास्ते में (In Transit)' : currentTrip.status === 'PICKED_UP' ? 'पिकअप संपन्न' : 'ट्रिप स्वीकृत'}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveNavTab('MY_TRIPS')}
                        className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
                      >
                        <span>नेविगेशन मोड खोलें</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 4-Step Stepper */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <button
                        onClick={() => handleAdvanceActiveTrip('ACCEPTED', 1)}
                        className={`p-2 rounded-lg border font-semibold transition-all ${
                          activeStep >= 1
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {activeStep >= 1 ? '✅' : '○'} एक्सेप्ट<br />
                        <span className="text-[10px] font-normal">पुष्टि</span>
                      </button>
                      <button
                        onClick={() => handleAdvanceActiveTrip('PICKED_UP', 2)}
                        className={`p-2 rounded-lg border font-semibold transition-all ${
                          activeStep >= 2
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {activeStep >= 2 ? '✅' : '○'} पिकअप<br />
                        <span className="text-[10px] font-normal">FPO से</span>
                      </button>
                      <button
                        onClick={() => handleAdvanceActiveTrip('IN_TRANSIT', 3)}
                        className={`p-2 rounded-lg border font-semibold transition-all ${
                          activeStep === 3
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : activeStep > 3
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {activeStep === 3 ? '●' : activeStep > 3 ? '✅' : '○'} रास्ते में<br />
                        <span className="text-[10px] font-normal">{activeStep === 3 ? 'सक्रिय' : 'ट्रांजिट'}</span>
                      </button>
                      <button
                        onClick={() => handleAdvanceActiveTrip('DELIVERED', 4)}
                        className={`p-2 rounded-lg border font-semibold transition-all ${
                          activeStep >= 4
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                      >
                        {activeStep >= 4 ? '🎉' : '○'} डिलीवर करें<br />
                        <span className="text-[10px]">{activeStep >= 4 ? 'सम्पन्न' : 'अंतिम चरण'}</span>
                      </button>
                    </div>

                    {/* OpenStreetMap Live Route & Tracking */}
                    <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-sm p-2 bg-slate-50">
                      <LiveTrackingMap
                        origin={originCoords}
                        destination={destinationCoords}
                        transporterLocation={{
                          lat: liveTransporterLocation.lat,
                          lng: liveTransporterLocation.lng,
                          updatedAt: Date.now(),
                        }}
                        height="320px"
                        showEta={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
                      🚚
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">वर्तमान में कोई सक्रिय ट्रिप नहीं है</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                        जब आप उपलब्ध डिलीवरी में से कोई जॉब स्वीकार (Accept) करेंगे, तो उसका लाइव नेविगेशन और रूट ट्रैकिंग यहाँ सक्रिय हो जाएगा।
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveNavTab('SMARTMATCH')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>उपलब्ध डिलीवरी खोजें ({availableCount})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick SmartMatch Preview (Top 2 Jobs) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>ताज़ा उपलब्ध नौकरियां (SmartMatch Preview)</span>
                    </h3>
                    {availableCount > 0 && (
                      <button
                        onClick={() => setActiveNavTab('SMARTMATCH')}
                        className="text-xs font-bold text-amber-800 hover:text-amber-900"
                      >
                        सभी देखें &rarr;
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {availableTrips.filter((t) => t.status === 'AVAILABLE').length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
                        कोई नया डिलीवरी अनुरोध उपलब्ध नहीं है।
                      </div>
                    ) : (
                      availableTrips
                        .filter((t) => t.status === 'AVAILABLE')
                        .slice(0, 2)
                        .map((job) => (
                          <div
                            key={job.id}
                            className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">
                                {job.produceName} ({job.quantityKg} kg)
                              </div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                📍 {job.pickupLocation} &rarr; 🏁 {job.dropLocation} ({job.distanceKm} km)
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="text-sm font-black text-amber-800">₹{job.fare}</div>
                                <div className="text-[10px] text-emerald-700 font-bold">100% भुगतान</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRejectJobInternal(job.id)}
                                  className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                                >
                                  अस्वीकार
                                </button>
                                <button
                                  onClick={() => handleAcceptJobInternal(job.id)}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer"
                                >
                                  स्वीकारें
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Rail (4 Cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Feature 3 Quick Card: मेरी कमाई */}
                <div
                  onClick={() => setActiveNavTab('EARNINGS')}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-amber-400 cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>मेरी कमाई (इस महीने)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-amber-700">
                    ₹{(earningsData?.summary?.month_earnings ?? earningsData?.overview?.month_earnings ?? 0).toLocaleString('en-IN')}
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-slate-100 text-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800">
                        {earningsData?.summary?.completed_trips_count ?? availableTrips.filter((t) => t.status === 'DELIVERED').length}
                      </div>
                      <div className="text-[10px] text-slate-400">कुल ट्रिप्स</div>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-700">
                        {ratingsData?.overview?.metrics?.punctuality ? `${Math.round(ratingsData.overview.metrics.punctuality * 20)}%` : (ratingsData?.overview?.total_reviews ? '98%' : '100%')}
                      </div>
                      <div className="text-[10px] text-slate-400">समय पर</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">
                        ₹{earningsData?.summary?.completed_trips_count ? Math.round((earningsData.summary.total_earnings || 0) / earningsData.summary.completed_trips_count) : 0}
                      </div>
                      <div className="text-[10px] text-slate-400">औसत/ट्रिप</div>
                    </div>
                  </div>
                </div>

                {/* Feature 4 Quick Card: डिलीवरी परफॉरमेंस */}
                <div
                  onClick={() => setActiveNavTab('RATINGS')}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-amber-400 cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">डिलीवरी परफॉरमेंस</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full border-4 border-emerald-600 flex items-center justify-center font-bold text-emerald-800 text-sm">
                      {ratingsData?.overview?.metrics?.punctuality ? `${Math.round(ratingsData.overview.metrics.punctuality * 20)}%` : '100%'}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-slate-800">
                        ★ {ratingsData?.overview?.total_reviews ? ratingsData.overview.overall_rating : '5.0'} आपकी रेटिंग
                      </div>
                      <div className="text-slate-400">
                        {ratingsData?.overview?.total_reviews || 0} ग्राहक समीक्षाएं
                      </div>
                      <div className="text-emerald-700 font-semibold">0 कैंसिल ट्रिप्स</div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Capacity Progress */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">वाहन क्षमता</span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700 font-bold">
                      {profile?.vehicle_type || 'Mini Truck'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    रजिस्ट्रेशन: <strong className="text-slate-700">{profile?.vehicle_number || 'UP 32 AB 1234'}</strong>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>उपयोग में: {currentTrip ? currentTrip.quantityKg : 0} kg</span>
                      <span className="text-slate-400">कुल: {profile?.capacity_kg || 1000} kg</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.round(((currentTrip ? currentTrip.quantityKg : 0) / (profile?.capacity_kg || 1000)) * 100))}%`
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium mt-1">
                      💡 {Math.max(0, (profile?.capacity_kg || 1000) - (currentTrip ? currentTrip.quantityKg : 0))} kg क्षमता उपलब्ध है (पूलिंग संभव)
                    </div>
                  </div>
                </div>

                {/* Driver Support */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">ड्राइवर सपोर्ट</div>
                    <div className="text-slate-400 text-[11px]">24x7 सहायता उपलब्ध</div>
                  </div>
                  <a
                    href="tel:1800123456"
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>कॉल करें</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Incoming Job Notification Alert Modal (When Farmer Accepts Order) */}
        {incomingJobAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-amber-300 shadow-2xl overflow-hidden animate-scaleUp">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800 text-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl animate-bounce">
                      🔔
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] uppercase tracking-wider">
                        नया डिलीवरी अनुरोध • New Job Request
                      </span>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        किसान ने ऑर्डर स्वीकार किया!
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncomingJobAlert(null)}
                    className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-amber-100 mt-2">
                  किसान ने ऑर्डर #{incomingJobAlert.orderCode} की पुष्टि कर दी है। क्या आप यह डिलीवरी स्वीकार या अस्वीकार करना चाहते हैं?
                </p>
              </div>

              {/* Trip Details Card */}
              <div className="p-5 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-slate-900">
                      {incomingJobAlert.produceName} ({incomingJobAlert.quantityKg} kg)
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      SmartMatch AI Match
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">विक्रेता:</span>
                      <strong className="text-slate-800">{incomingJobAlert.fpoName}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>पिकअप: <strong>{incomingJobAlert.pickupLocation}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>ड्रॉप: <strong>{incomingJobAlert.dropLocation}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span>दूरी: <strong>{incomingJobAlert.distanceKm} km</strong></span>
                      <span>•</span>
                      <span>समय: <strong>{incomingJobAlert.eta}</strong></span>
                      <span>•</span>
                      <span>समय-सीमा: <strong className="text-emerald-700">सुरक्षित (FreshRoute Safe)</strong></span>
                    </div>
                  </div>
                </div>

                {/* Earnings Highlight */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-amber-900 font-bold uppercase block">
                      ट्रांसपोर्टर शुद्ध कमाई (Delivery Pay)
                    </span>
                    <span className="text-xs text-emerald-700 font-semibold">
                      ₹0 कमीशन कटौती • सीधे आपके खाते में
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-900">
                    ₹{incomingJobAlert.fare}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const id = incomingJobAlert.id;
                      setIncomingJobAlert(null);
                      await handleRejectJobInternal(id);
                    }}
                    className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4 text-red-500" />
                    <span>अस्वीकार करें (Reject)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const id = incomingJobAlert.id;
                      setIncomingJobAlert(null);
                      await handleAcceptJobInternal(id);
                    }}
                    className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>स्वीकार करें (Accept Job)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
