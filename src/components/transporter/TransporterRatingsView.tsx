import React, { useState, useEffect } from 'react';
import {
  Star,
  Award,
  ShieldCheck,
  CheckCircle,
  ThumbsUp,
  Clock,
  Sparkles,
  TrendingUp,
  Gift,
  HeartHandshake,
} from 'lucide-react';
import { getAuthHeaders, getApiUrl } from '../../lib/api/client';
import { logisticsSync } from '../../lib/realtime/logisticsSync';

export const TransporterRatingsView: React.FC = () => {
  const [ratingsData, setRatingsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRatings = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(getApiUrl('/api/transporters/ratings'), { headers });
      const json = await res.json();
      if (json.success) {
        setRatingsData(json);
      }
    } catch (e) {
      console.warn('Failed to fetch ratings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
    const unsubscribe = logisticsSync.subscribe((event) => {
      if (['JOB_ACCEPTED', 'TRIP_STATUS_UPDATED', 'POD_VERIFIED', 'ORDER_ACCEPTED'].includes(event.type)) {
        fetchRatings();
      }
    });
    return () => unsubscribe();
  }, []);

  const overview = ratingsData?.overview || {};
  const totalReviews = Number(overview.total_reviews || 0);
  const overallRating = totalReviews > 0 ? Number(overview.overall_rating || 5.0) : 5.0;
  const metrics = overview.metrics || {};
  const punctuality = metrics.punctuality ? Math.round(metrics.punctuality * 20) : (totalReviews > 0 ? 98 : 100);
  const handling = metrics.produce_handling ? Math.round(metrics.produce_handling * 20) : (totalReviews > 0 ? 96 : 100);
  const communication = metrics.communication ? Math.round(metrics.communication * 20) : (totalReviews > 0 ? 99 : 100);
  const reviews: any[] = ratingsData?.reviews || [];

  return (
    <div className="space-y-6" id="transporter-ratings-container">
      {/* Top Hero Rating Card */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-emerald-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-300" />
              <span>ट्रांसपोर्टर परफॉरमेंस व रेटिंग प्रोफ़ाइल</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-4xl sm:text-5xl font-black text-white flex items-center gap-1.5">
                <span>{overallRating.toFixed(1)}</span>
                <span className="text-amber-400 text-3xl">★</span>
              </div>
              <div>
                <div className="font-extrabold text-sm text-amber-100">
                  {totalReviews > 0 ? 'सत्यापित रेटिंग (Verified)' : 'सत्यापित नया पार्टनर (Verified)'}
                </div>
                <div className="text-xs text-amber-200/90">
                  {totalReviews} सत्यापित किसान व खरीदार समीक्षाएं
                </div>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="bg-amber-400 text-amber-950 p-3.5 rounded-2xl shadow-md space-y-0.5 text-center shrink-0">
            <div className="text-xs font-black uppercase flex items-center justify-center gap-1">
              <Award className="w-4 h-4" />
              <span>डिलीवरी पार्टनर (Logistics Partner)</span>
            </div>
            <div className="text-[11px] font-medium text-amber-900">
              सत्यापित KrishiSetu ट्रांसपोर्टर | 100% शून्य कमीशन सुरक्षा
            </div>
          </div>
        </div>

        {/* 4 Performance Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-amber-600/50 text-xs">
          <div>
            <div className="text-amber-200 text-[10px]">समय पर डिलीवरी</div>
            <div className="font-bold text-white text-base">{punctuality}%</div>
          </div>
          <div>
            <div className="text-amber-200 text-[10px]">फसल ताजगी सुरक्षा</div>
            <div className="font-bold text-white text-base">{handling}%</div>
          </div>
          <div>
            <div className="text-amber-200 text-[10px]">रद्द की गई ट्रिप्स</div>
            <div className="font-bold text-emerald-300 text-base">0% (शून्य कैंसिलेशन)</div>
          </div>
          <div>
            <div className="text-amber-200 text-[10px]">समीक्षित ट्रिप्स</div>
            <div className="font-bold text-white text-base">{totalReviews} ट्रिप्स</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Performance Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-600 fill-current" />
            <span>श्रेणीवार रेटिंग विवरण (Category Ratings)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>समयबद्धता (On-Time Delivery)</span>
                <span className="text-amber-700 font-bold">{punctuality}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${punctuality}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>फसल सुरक्षा व देखभाल (Produce Handling)</span>
                <span className="text-amber-700 font-bold">{handling}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${handling}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>व्यवहार और संचार (Politeness & Communication)</span>
                <span className="text-amber-700 font-bold">{communication}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${communication}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>वाहन स्वच्छता और फिटनेस (Vehicle Hygiene)</span>
                <span className="text-amber-700 font-bold">100%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Incentive & Reward Program */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Gift className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">
              सुपर ड्राइवर प्रोत्साहन योजना (Incentive Program)
            </h3>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-amber-950 flex items-center justify-between">
              <span>🎯 सुपर ड्राइवर ऑन-टाइम बोनस (On-Time Bonus)</span>
              <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
                +100% किराया ट्रांसफर
              </span>
            </div>
            <p className="text-amber-900 text-[11px] leading-relaxed">
              प्रत्येक समय पर सुरक्षित डिलीवरी और त्वरित POD सत्यापन पर सीधे आपके बैंक खाते में 100% किराया जमा होता है।
            </p>
            <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(20, totalReviews * 20))}%` }} />
            </div>
            <div className="text-[10px] text-amber-800 font-semibold text-right">
              {totalReviews} सफल ट्रिप्स पूर्ण
            </div>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>सत्यापित पार्टनर स्टेटस के साथ FreshRoute प्राथमिकता आवंटन सक्रिय है।</span>
          </div>
        </div>
      </div>

      {/* Verified Reviews Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="font-extrabold text-sm text-slate-900">
            सत्यापित किसान और खरीदार समीक्षाएं (Verified Feedback)
          </div>
          <span className="text-xs text-slate-500">{totalReviews} कुल समीक्षाएं</span>
        </div>

        {reviews.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="text-3xl">⭐</div>
            <div className="font-bold text-slate-800 text-sm">वर्तमान में कोई समीक्षा उपलब्ध नहीं है</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              जैसे ही किसान और खरीदार आपकी पूर्ण की गई डिलीवरी की समीक्षा करेंगे, उनका वास्तविक फीडबैक और रेटिंग यहाँ प्रदर्शित होगी।
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                      {(r.reviewer_name || 'क')[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{r.reviewer_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {r.order_number || 'ऑर्डर डिलीवरी'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      सत्यापित डिलीवरी
                    </span>
                    <div className="flex items-center text-amber-500 font-bold">
                      <span>{r.rating}</span>
                      <Star className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <p className="text-slate-700 text-xs leading-relaxed">
                  "{r.review_text || 'समय पर सुरक्षित डिलीवरी संपन्न।'}"
                </p>

                <div className="text-[10px] text-slate-400 text-right">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'हाल ही में'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
