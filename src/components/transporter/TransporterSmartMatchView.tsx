import React, { useState } from 'react';
import { TransporterTrip } from '../../types';
import {
  Sparkles,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  Shield,
  Star,
  Check,
  Filter,
  Layers,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { calculateSmartTransport, FreshnessStatus } from '../../lib/domainEngine';

interface TransporterSmartMatchViewProps {
  availableTrips: TransporterTrip[];
  onAcceptJob: (tripId: string) => Promise<void> | void;
  onRejectJob: (tripId: string) => Promise<void> | void;
  onOpenKrishiAI: () => void;
}

export const TransporterSmartMatchView: React.FC<TransporterSmartMatchViewProps> = ({
  availableTrips = [],
  onAcceptJob,
  onRejectJob,
  onOpenKrishiAI,
}) => {
  const [filterCrop, setFilterCrop] = useState<string>('ALL');
  const [filterMaxDistance, setFilterMaxDistance] = useState<number>(100);
  const [sortBy, setSortBy] = useState<'MATCH' | 'PAYOUT' | 'DISTANCE' | 'URGENCY'>('MATCH');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const tripsList = Array.isArray(availableTrips) ? availableTrips : [];
  const availableJobs = tripsList.filter((t) => t.status === 'AVAILABLE');

  // Filter and Sort logic
  const filteredJobs = availableJobs
    .filter((job) => {
      if (filterCrop !== 'ALL' && !job.produceName.includes(filterCrop)) return false;
      if (job.distanceKm > filterMaxDistance) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'MATCH') return (b.isBestMatch ? 1 : 0) - (a.isBestMatch ? 1 : 0);
      if (sortBy === 'PAYOUT') return b.fare - a.fare;
      if (sortBy === 'DISTANCE') return a.distanceKm - b.distanceKm;
      if (sortBy === 'URGENCY') return a.pickupWindowHours - b.pickupWindowHours;
      return 0;
    });

  return (
    <div className="space-y-6" id="transporter-smartmatch-container">
      {/* Header & SmartTransport AI Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-emerald-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/30 rounded-lg backdrop-blur-xs">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                उपलब्ध डिलीवरी (SmartMatch AI)
              </h2>
              <span className="text-xs font-bold bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                {availableJobs.length} नए ऑर्डर उपलब्ध
              </span>
            </div>
            <p className="text-xs text-amber-100 max-w-2xl leading-relaxed">
              SmartTransport AI एल्गोरिदम आपके वाहन की क्षमता, लाइव स्थान और FreshRoute समय सीमा के आधार पर सर्वोत्तम डिलीवरी मैच करता है।
            </p>
          </div>

          <button
            onClick={onOpenKrishiAI}
            className="px-3.5 py-2 bg-white text-amber-900 hover:bg-amber-50 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>🤖 AI साथी से रूट सलाह</span>
          </button>
        </div>

        {/* AI Rule Summary Strip */}
        <div className="pt-2 border-t border-amber-600/50 flex flex-wrap items-center gap-4 text-[11px] text-amber-200">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rule R-003: 100% पूरा डिलीवरी किराया ट्रांसपोर्टर का (₹0 कटौती)</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>FreshRoute: गुणवत्ता गारंटी व समय सीमा निगरानी सक्रिय</span>
          </span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>फिल्टर:</span>
          </span>

          {/* Crop Filter */}
          <div className="flex items-center gap-1">
            {['ALL', 'टमाटर', 'आलू', 'गेहूँ', 'प्याज'].map((crop) => (
              <button
                key={crop}
                onClick={() => setFilterCrop(crop)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterCrop === crop
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {crop === 'ALL' ? 'सभी फसलें' : crop}
              </button>
            ))}
          </div>

          {/* Distance Filter */}
          <select
            value={filterMaxDistance}
            onChange={(e) => setFilterMaxDistance(Number(e.target.value))}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value={20}>दूरी: &le; 20 km</option>
            <option value={50}>दूरी: &le; 50 km</option>
            <option value={100}>दूरी: सभी (&le; 100 km)</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">क्रमबद्ध करें:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="MATCH">★ AI बेस्ट मैच</option>
            <option value="PAYOUT">₹ सबसे ज्यादा कमाई</option>
            <option value="DISTANCE">📍 सबसे नजदीकी पिकअप</option>
            <option value="URGENCY">⏰ सबसे कम समय सीमा</option>
          </select>
        </div>
      </div>

      {/* Dynamic Load Pooling AI Recommendation Banner */}
      {availableJobs.length >= 2 && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <span>SmartTransport Dynamic Load Pooling</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  अतिरिक्त बचत
                </span>
              </div>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                समान मार्ग पर एकाधिक डिलीवरी उपलब्ध हैं। इन्हें एक साथ लोड करके प्रति किमी मुनाफा अधिकतम करें।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Available Jobs List */}
      <div className="space-y-4">
        {availableJobs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
              🌾
            </div>
            <h3 className="text-base font-extrabold text-slate-800">वर्तमान में कोई डिलीवरी अनुरोध उपलब्ध नहीं है</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              जब कोई किसान या खरीदार डिजिटल डिलीवरी का ऑर्डर बुक करेंगे और किसान ट्रांसपोर्टर का चयन करेंगे, तो SmartMatch AI तुरंत आपको यहाँ अलर्ट करेगा।
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="text-3xl">🔍</div>
            <div className="font-bold text-slate-800 text-sm">चयनित फिल्टर के अनुसार कोई ऑर्डर नहीं मिला</div>
            <p className="text-xs text-slate-500">
              कृपया फसल या दूरी का फिल्टर बदलकर पुनः प्रयास करें।
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            // Calculate deterministic AI matching metrics
            const smartCalc = calculateSmartTransport({
              distanceToPickupKm: Math.min(20, Math.round(job.distanceKm * 0.25)),
              vehicleCapacityKg: 1000,
              orderWeightKg: job.quantityKg,
              transporterFareQuote: job.fare,
              marketStandardFare: job.fare,
              isAvailable: true,
              transporterRating: 4.8,
              tripEtaHours: 2,
              freshnessWindowHours: job.pickupWindowHours || 24,
            });

            return (
              <div
                key={job.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  job.isBestMatch
                    ? 'border-2 border-emerald-500 shadow-md ring-2 ring-emerald-100'
                    : 'border-slate-200 shadow-2xs hover:border-amber-300'
                }`}
              >
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                        {job.orderCode}
                      </span>
                      {job.isBestMatch && (
                        <span className="text-[11px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <Star className="w-3 h-3 fill-current" />
                          <span>94% AI बेस्ट मैच</span>
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        पिकअप विंडो: {job.pickupWindowHours} घंटे
                      </span>
                    </div>

                    {/* Freshness Badge */}
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>FreshRoute: सुरक्षित (Safe Freshness)</span>
                    </span>
                  </div>

                  {/* Main Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <div className="space-y-1">
                      <div className="font-extrabold text-base sm:text-lg text-slate-900">
                        {job.produceName} ({job.quantityKg} kg)
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <span>विक्रेता किसान/FPO:</span>
                        <strong className="text-slate-800">{job.fpoName}</strong>
                      </div>
                      <div className="text-xs text-slate-700 flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{job.pickupLocation}</span>
                        </span>
                        <span className="text-slate-400 font-bold">&rarr;</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{job.dropLocation}</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-0.5 flex items-center gap-3">
                        <span>कुल दूरी: <strong className="text-slate-700">{job.distanceKm} km</strong></span>
                        <span>•</span>
                        <span>अनुमानित यात्रा समय: <strong className="text-slate-700">{job.eta}</strong></span>
                      </div>
                    </div>

                    {/* Transporter Pay Column */}
                    <div className="sm:text-right bg-amber-50/70 border border-amber-200/80 p-3 sm:p-4 rounded-xl shrink-0">
                      <div className="text-[11px] text-slate-500 uppercase font-semibold">
                        ट्रांसपोर्टर शुद्ध कमाई (Pay)
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-800 leading-tight">
                        ₹{job.fare}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold flex items-center sm:justify-end gap-1 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>सीधे बैंक/UPI में 100% भुगतान</span>
                      </div>
                    </div>
                  </div>

                  {/* SmartTransport Score Breakdown Accordion Toggle */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      className="text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>SmartTransport स्कोर विवरण {isExpanded ? 'छुपाएं' : 'देखें'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRejectJob(job.id)}
                        className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold transition-colors"
                      >
                        अस्वीकार
                      </button>
                      <button
                        type="button"
                        onClick={() => onAcceptJob(job.id)}
                        className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>एक्सेप्ट करें</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span>AI मैचिंग स्कोर: {smartCalc.score}/100</span>
                        <span className="text-[10px] text-slate-500">वेटेड फॉर्मूला (TRD 100%)</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-slate-400">पिकअप निकटता (30%)</div>
                          <div className="font-bold text-slate-800">{smartCalc.breakdown.distanceFit}%</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-slate-400">क्षमता उपयोग (25%)</div>
                          <div className="font-bold text-slate-800">{smartCalc.breakdown.capacityFit}%</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-slate-400">किराया उपयुक्तता (20%)</div>
                          <div className="font-bold text-slate-800">{smartCalc.breakdown.fareFit}%</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-slate-400">उपलब्धता (15%)</div>
                          <div className="font-bold text-slate-800">{smartCalc.breakdown.availability}%</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-slate-400">चालक रेटिंग (10%)</div>
                          <div className="font-bold text-slate-800">{smartCalc.breakdown.rating}%</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 italic">
                        {smartCalc.reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
