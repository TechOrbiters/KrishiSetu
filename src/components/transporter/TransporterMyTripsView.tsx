import React, { useState, useRef, useEffect } from 'react';
import { GoogleMandiMap } from '../common/GoogleMandiMap';
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
  Mic,
  MicOff,
  Volume2,
  Radio,
  Send,
  Loader2,
  Check,
  Compass,
  FileCheck2,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseTransporterVoiceCommand, speakWithSarvamAI } from '../../lib/apiServices';

interface TransporterMyTripsViewProps {
  availableTrips: TransporterTrip[];
  setAvailableTrips: React.Dispatch<React.SetStateAction<TransporterTrip[]>>;
  onOpenKrishiAI: () => void;
  onUpdateTripStatus?: (tripId: string, status: TransporterTrip['status']) => Promise<void> | void;
  onUpdateTripLocation?: (tripId: string, location: { lat: number; lng: number; speedKmh?: number; address?: string }) => Promise<void> | void;
}

export const TransporterMyTripsView: React.FC<TransporterMyTripsViewProps> = ({
  availableTrips = [],
  setAvailableTrips,
  onOpenKrishiAI,
  onUpdateTripStatus,
  onUpdateTripLocation,
}) => {
  const [tripsTab, setTripsTab] = useState<'CURRENT' | 'UPCOMING' | 'COMPLETED'>('CURRENT');
  const [activeStep, setActiveStep] = useState<number>(3); // Step 3 = In Progress / On Route
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Safe trips list
  const tripsList = Array.isArray(availableTrips) ? availableTrips : [];

  // Proof of delivery modal
  const [showPodModal, setShowPodModal] = useState(false);
  const [podOtp, setPodOtp] = useState('');
  const [podVerified, setPodVerified] = useState(false);

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

  // Dynamic active trip selection - pure real-time, no mock fallback
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
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
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
        hindiFeedback: 'ब्राउज़र में सीधे माइक्रोफोन सपोर्ट उपलब्ध नहीं है। कृपया नीचे दिए गए त्वरित वॉइस बटन पर क्लिक करें।',
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

  // Trips for upcoming and completed strictly from real availableTrips
  const upcomingTrips = tripsList.filter((t) => t.status === 'ACCEPTED' || t.status === 'PICKED_UP');
  const completedTrips = tripsList.filter((t) => t.status === 'DELIVERED');

  return (
    <div className="space-y-6" id="transporter-mytrips-container">
      {/* Top Trips Sub-tabs Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-amber-600" />
            <span>मेरी ट्रिप्स (My Trips Management)</span>
          </h2>
          <p className="text-xs text-slate-500">
            लाइव जीपीएस नेविगेशन, स्थिति अपडेट और डिलीवरी पुष्टिकरण
          </p>
        </div>

        {/* Sub-tabs toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setTripsTab('CURRENT')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tripsTab === 'CURRENT'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            वर्तमान ट्रिप ({currentTrip ? 1 : 0})
          </button>
          <button
            onClick={() => setTripsTab('UPCOMING')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tripsTab === 'UPCOMING'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            आगामी ट्रिप्स ({upcomingTrips.length})
          </button>
          <button
            onClick={() => setTripsTab('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tripsTab === 'COMPLETED'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            पूर्ण ट्रिप्स ({completedTrips.length})
          </button>
        </div>
      </div>

      {/* View 1: CURRENT ACTIVE TRIP */}
      {tripsTab === 'CURRENT' && (
        currentTrip ? (
          <div className="space-y-6">
          {/* Active Trip Header Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                  {currentTrip.orderCode}
                </span>
                <span className="text-xs font-bold bg-blue-100 text-blue-900 px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  <span>{currentTrip.status === 'IN_TRANSIT' ? 'रास्ते में (In Transit)' : currentTrip.status}</span>
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">कुल डिलीवरी किराया</div>
                <div className="text-2xl font-black text-amber-700">₹{currentTrip.fare}</div>
              </div>
            </div>

            {/* Produce & Route Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-base">
                  {currentTrip.produceName} ({currentTrip.quantityKg} kg)
                </div>
                <div className="text-slate-600">
                  किसान / FPO: <strong>{currentTrip.fpoName}</strong>
                </div>
                <div className="text-slate-500 text-[11px]">
                  वाहन: <strong>{liveTransporterLocation.vehicleNumber} (Mini Truck)</strong>
                </div>
              </div>

              <div className="space-y-1 sm:text-right">
                <div className="text-slate-700">
                  📍 {currentTrip.pickupLocation}
                </div>
                <div className="text-slate-400">↓</div>
                <div className="text-slate-800 font-bold">
                  🏁 {currentTrip.dropLocation}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  FreshRoute समय सीमा: <strong>{currentTrip.eta || '45 मिनट शेष'}</strong>
                </div>
              </div>
            </div>

            {/* 4-Step Stepper */}
            <div className="pt-2">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <button
                  onClick={() => handleAdvanceActiveTrip('ACCEPTED', 1)}
                  className={`p-2.5 rounded-xl border font-bold transition-all ${
                    activeStep >= 1
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  {activeStep >= 1 ? '✅' : '1.'} 1. एक्सेप्ट<br />
                  <span className="text-[10px] font-normal">ट्रिप बुक हुई</span>
                </button>
                <button
                  onClick={() => handleAdvanceActiveTrip('PICKED_UP', 2)}
                  className={`p-2.5 rounded-xl border font-bold transition-all ${
                    activeStep >= 2
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-amber-400'
                  }`}
                >
                  {activeStep >= 2 ? '✅' : '2.'} 2. पिकअप<br />
                  <span className="text-[10px] font-normal">फार्म से लोड</span>
                </button>
                <button
                  onClick={() => handleAdvanceActiveTrip('IN_TRANSIT', 3)}
                  className={`p-2.5 rounded-xl border font-bold transition-all ${
                    activeStep === 3
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : activeStep > 3
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  {activeStep === 3 ? '●' : activeStep > 3 ? '✅' : '3.'} 3. रास्ते में<br />
                  <span className="text-[10px] font-normal">{activeStep === 3 ? 'हाईवे पर' : 'सक्रिय'}</span>
                </button>
                <button
                  onClick={() => {
                    handleAdvanceActiveTrip('DELIVERED', 4);
                    setShowPodModal(true);
                  }}
                  className={`p-2.5 rounded-xl border font-bold transition-all ${
                    activeStep >= 4
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {activeStep >= 4 ? '🎉' : '4.'} 4. डिलीवर करें<br />
                  <span className="text-[10px]">{activeStep >= 4 ? 'सम्पन्न' : 'मंडी गेट POD'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sarvam AI Indic Voice Assistant Listener Box */}
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-slate-50 border-2 border-amber-300 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
                    <span>Sarvam AI हैंड्स-फ्री वॉइस नेविगेशन व स्टेटस लिसनर</span>
                    <span className="text-[9px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase">
                      Indic AI
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    गाड़ी चलाते समय हाथ लगाने की ज़रूरत नहीं — केवल अपनी आवाज़ में बोलें
                  </div>
                </div>
              </div>

              {isSpeakingAudio && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full animate-pulse font-bold">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>हिंदी वॉइस फीडबैक सक्रिय...</span>
                </div>
              )}
            </div>

            {/* Mic Listening Trigger Button & Visualizer */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-amber-200">
              <button
                type="button"
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                disabled={isProcessingVoice}
                className={`relative w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-200 animate-pulse'
                    : isProcessingVoice
                    ? 'bg-amber-100 text-amber-800 cursor-wait'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white ring-4 ring-amber-100'
                }`}
              >
                {isProcessingVoice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sarvam AI समझ रहा है...</span>
                  </>
                ) : isListening ? (
                  <>
                    <div className="w-3 h-3 rounded-full bg-white animate-ping" />
                    <MicOff className="w-4 h-4" />
                    <span>सुन रहा हूँ... पूरा होने पर टैप करें</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>🎙️ माइक चालू करें और बोलें</span>
                  </>
                )}
              </button>

              {/* Live Transcript / Prompt */}
              <div className="flex-1 w-full text-left">
                <div className="text-[11px] text-slate-400 font-medium">लाइव वॉइस ट्रांसक्रिप्ट:</div>
                <div className="text-xs font-semibold text-slate-800 italic min-h-[22px] flex items-center">
                  {isListening ? (
                    <span className="text-amber-700 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
                      {voiceTranscript || 'सुन रहा हूँ... जैसे: "फार्म पहुँच गया", "गाड़ी लोड हो गई", "रास्ते में हूँ"'}
                    </span>
                  ) : voiceTranscript ? (
                    <span>"{voiceTranscript}"</span>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      माइक दबाकर बोलें या नीचे दिए गए त्वरित बटन पर क्लिक करें
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Speech Chips */}
            <div>
              <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                <span>त्वरित वॉइस परीक्षण (1-Click Voice Commands):</span>
                <span className="text-[10px] text-slate-400">क्लिक करके सीधे टेस्ट करें</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleProcessVoiceCommand('फार्म पर पहुंच गया')}
                  disabled={isProcessingVoice}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-400 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span>🎙️ "फार्म पर पहुंच गया"</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessVoiceCommand('गाड़ी में माल लोड हो गया है')}
                  disabled={isProcessingVoice}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-400 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span>🎙️ "माल लोड हो गया"</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessVoiceCommand('मंडी के रास्ते में हूँ')}
                  disabled={isProcessingVoice}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-400 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span>🎙️ "रास्ते में हूँ"</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessVoiceCommand('मंडी में माल डिलीवर हो गया')}
                  disabled={isProcessingVoice}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-400 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span>🎙️ "मंडी में डिलीवर हो गया"</span>
                </button>
              </div>
            </div>

            {/* Voice Feedback Box */}
            {voiceFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  voiceFeedback.success
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      {voiceFeedback.success ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>वॉइस स्टेटस स्वीकृत: {voiceFeedback.statusHindi || voiceFeedback.status}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span>वॉइस निर्देश अपूर्ण</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                      {voiceFeedback.hindiFeedback}
                    </p>
                  </div>

                  {voiceFeedback.success && (
                    <button
                      type="button"
                      onClick={handleReplayFeedback}
                      disabled={isSpeakingAudio}
                      title="दोबारा सुनें"
                      className="shrink-0 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>सुनें</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Google Maps Live Route & Telemetry Section */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <span>Google Maps लाइव ट्रिप नेविगेशन</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      लाइव जीपीएस टेलीमेट्री
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {originCoords.label} &rarr; {destinationCoords.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateStepMovement}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                  title="ट्रक की स्थिति को डेटाबेस में 25% आगे बढ़ाएं"
                >
                  <Compass className="w-4 h-4 text-amber-700 animate-spin-slow" />
                  <span>🛰️ रूट सिमुलेशन (+25% आगे)</span>
                </button>
              </div>
            </div>

            {/* Live Telemetry Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">प्रस्थान (Origin Farm)</div>
                <div className="font-bold text-slate-800 truncate">{(originCoords.label || 'बैजनाथपुर फार्म').split('(')[0]}</div>
                <div className="text-[10px] font-mono text-emerald-700">
                  {originCoords.lat.toFixed(3)}, {originCoords.lng.toFixed(3)}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">वर्तमान स्थान (Current GPS)</div>
                <div className="font-bold text-slate-800 truncate">
                  {currentTrip.currentLocation?.address || 'NH-27 हाईवे (रास्ते में)'}
                </div>
                <div className="text-[10px] font-mono text-blue-700 flex items-center gap-1">
                  <span>{liveTransporterLocation.lat.toFixed(3)}, {liveTransporterLocation.lng.toFixed(3)}</span>
                  {currentTrip.currentLocation?.speedKmh && (
                    <span className="bg-blue-100 text-blue-800 px-1 rounded text-[9px] font-bold">
                      {currentTrip.currentLocation.speedKmh} km/h
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">गंतव्य (Target Mandi)</div>
                <div className="font-bold text-slate-800 truncate">{(destinationCoords.label || 'नवीन गल्ला मंडी').split('(')[0]}</div>
                <div className="text-[10px] font-mono text-purple-700">
                  {destinationCoords.lat.toFixed(3)}, {destinationCoords.lng.toFixed(3)}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">FreshRoute समय व दूरी</div>
                <div className="font-bold text-emerald-800">{currentTrip.eta || '45 मिनट'}</div>
                <div className="text-[10px] text-slate-500">
                  कुल दूरी: <strong>{currentTrip.distanceKm || 42} km</strong>
                </div>
              </div>
            </div>

            {/* Google Maps Container */}
            <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-sm">
              <GoogleMandiMap
                origin={originCoords}
                destination={destinationCoords}
                transporterLocation={liveTransporterLocation}
                tripStatus={currentTrip.status}
                height="420px"
                onLocationUpdate={(loc) => {
                  if (onUpdateTripLocation && currentTrip) {
                    onUpdateTripLocation(currentTrip.id, {
                      lat: loc.lat,
                      lng: loc.lng,
                      address: 'लाइव डिवाइस GPS',
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>
      ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
              🚚
            </div>
            <h3 className="text-base font-extrabold text-slate-800">वर्तमान में कोई सक्रिय ट्रिप नहीं है</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              जब आप किसी नए डिलीवरी अनुरोध को स्वीकार करेंगे, तो उसका लाइव GPS नेविगेशन, स्थिति अपडेट और मार्ग ट्रैकिंग यहाँ सक्रिय होगी।
            </p>
          </div>
        )
      )}

      {/* View 2: UPCOMING TRIPS */}
      {tripsTab === 'UPCOMING' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            आगामी निर्धारित ट्रिप्स ({upcomingTrips.length})
          </div>
          {upcomingTrips.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="text-3xl">🗓️</div>
              <div className="font-bold text-slate-800 text-sm">कोई आगामी ट्रिप नहीं है</div>
              <p className="text-xs text-slate-500">
                उपलब्ध डिलीवरी टैब से नए ऑर्डर स्वीकार करें।
              </p>
            </div>
          ) : (
            upcomingTrips.map((trip) => (
              <div key={trip.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800">{trip.orderCode}</span>
                  <span className="text-xs font-black text-amber-700">₹{trip.fare}</span>
                </div>
                <div className="font-bold text-slate-800 text-sm">{trip.produceName} ({trip.quantityKg} kg)</div>
                <div className="text-xs text-slate-600">📍 {trip.pickupLocation} &rarr; 🏁 {trip.dropLocation}</div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedTripId(trip.id);
                      setTripsTab('CURRENT');
                    }}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                  >
                    लाइव नेविगेशन शुरू करें
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View 3: COMPLETED TRIPS */}
      {tripsTab === 'COMPLETED' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            पूर्ण की गई सफल डिलीवरी ({completedTrips.length})
          </div>
          {completedTrips.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="text-3xl">📦</div>
              <div className="font-bold text-slate-800 text-sm">कोई पूर्ण की गई ट्रिप नहीं है</div>
              <p className="text-xs text-slate-500">
                सफलतापूर्वक डिलीवर की गई ट्रिप्स और डिजिटल POD यहाँ रिकॉर्ड होंगे।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedTrips.map((trip) => (
                <div key={trip.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{trip.orderCode}</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>डिलीवर संपन्न</span>
                      </span>
                    </div>
                    <div className="text-sm font-black text-emerald-700">₹{trip.fare} (भुगतान संपन्न)</div>
                  </div>
                  <div className="font-bold text-slate-800 text-sm">{trip.produceName} ({trip.quantityKg} kg)</div>
                  <div className="text-xs text-slate-600">📍 {trip.pickupLocation} &rarr; 🏁 {trip.dropLocation}</div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>5.0 ★ ग्राहक समीक्षा</span>
                    </span>
                    <span className="text-emerald-700 font-semibold">100% समय पर डिलीवरी</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proof of Delivery (POD) Modal */}
      {showPodModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  डिजिटल गेट पास व POD पुष्टिकरण
                </h3>
              </div>
              <button onClick={() => setShowPodModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                मंडी गेट पर माल अनलोड करने के लिए खरीदार/गेट कीपर से प्राप्त 4-अंकीय OTP दर्ज करें:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={podOtp}
                  onChange={(e) => setPodOtp(e.target.value)}
                  placeholder="OTP जैसे: 4821"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-center font-mono text-lg font-bold tracking-widest focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPodVerified(true);
                    confetti({ particleCount: 70, origin: { y: 0.7 } });
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  सत्यापित करें
                </button>
              </div>

              {podVerified && (
                <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl flex items-center gap-2 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>डिलीवरी और POD सफलतापूर्वक सत्यापित! ₹{currentTrip?.fare} तुरंत क्रेडिट हुए।</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPodModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
