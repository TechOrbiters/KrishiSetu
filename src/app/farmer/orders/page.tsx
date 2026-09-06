'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ChevronRight,
  MapPin,
  Truck,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerOrders } from '@/lib/hooks/useFarmerOrders';
import { OrderItem } from '@/lib/seedData';

export default function OrdersListPage() {
  const { orders, loading, error, refetch, acceptOrder, rejectOrder } = useFarmerOrders();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAccept = async (orderId: string) => {
    setProcessingId(orderId);
    const res = await acceptOrder(orderId);
    setProcessingId(null);
    if (res.success) {
      setToastMessage('ऑर्डर सफलतापूर्वक स्वीकार किया गया! परिवहन अनुरोध स्वतः भेजा गया।');
    } else {
      setToastMessage(`त्रुटि: ${res.error || 'ऑर्डर स्वीकार नहीं हो सका'}`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReject = async (orderId: string) => {
    setProcessingId(orderId);
    const res = await rejectOrder(orderId);
    setProcessingId(null);
    if (res.success) {
      setToastMessage('ऑर्डर रद्द कर दिया गया और स्टॉक रीस्टोर हुआ।');
    } else {
      setToastMessage(`त्रुटि: ${res.error || 'ऑर्डर रद्द नहीं हो सका'}`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getCropImage = (cropName: string) => {
    const name = cropName.toLowerCase();
    if (name.includes('टमाटर') || name.includes('tomato')) {
      return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=200';
    }
    if (name.includes('आलू') || name.includes('potato')) {
      return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=200';
    }
    if (name.includes('बैंगन') || name.includes('brinjal')) {
      return 'https://images.unsplash.com/photo-1628773822503-930a84d9435b?auto=format&fit=crop&q=80&w=200';
    }
    return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=200';
  };

  const filteredOrders = orders.filter((ord) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'NEW') return ord.status === 'PLACED';
    if (activeTab === 'ACCEPTED') return ord.status === 'ACCEPTED' || ord.status === 'PACKED' || ord.status === 'DISPATCHED';
    if (activeTab === 'IN_DELIVERY') return ord.status === 'IN_TRANSIT';
    if (activeTab === 'COMPLETED') return ord.status === 'DELIVERED';
    if (activeTab === 'CANCELLED') return ord.status === 'CANCELLED' || ord.status === 'EXPIRED';
    return true;
  });

  const tabCounts = {
    ALL: orders.length,
    NEW: orders.filter((o) => o.status === 'PLACED').length,
    ACCEPTED: orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'PACKED' || o.status === 'DISPATCHED').length,
    IN_DELIVERY: orders.filter((o) => o.status === 'IN_TRANSIT').length,
    COMPLETED: orders.filter((o) => o.status === 'DELIVERED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED' || o.status === 'EXPIRED').length,
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-800 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border border-emerald-600">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              🛍️
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">मेरे ऑर्डर (Orders)</h1>
              <p className="text-xs text-slate-500 font-medium">लाइव डेटाबेस से प्राप्त ऑर्डर और वास्तविक स्थिति</p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>रिफ्रेश करें</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {[
            { id: 'ALL', label: `सभी ऑर्डर (${tabCounts.ALL})` },
            { id: 'NEW', label: `नए ऑर्डर (${tabCounts.NEW})` },
            { id: 'ACCEPTED', label: `स्वीकार किए (${tabCounts.ACCEPTED})` },
            { id: 'IN_DELIVERY', label: `डिलीवरी में (${tabCounts.IN_DELIVERY})` },
            { id: 'COMPLETED', label: `पूरे हुए (${tabCounts.COMPLETED})` },
            { id: 'CANCELLED', label: `रद्द (${tabCounts.CANCELLED})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-700 text-white font-extrabold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading / Error States */}
        {loading && orders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="font-bold text-sm text-slate-700">ऑर्डर लोड हो रहे हैं...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-base text-slate-800">इस श्रेणी में कोई ऑर्डर नहीं है</p>
            <p className="text-xs text-slate-400">नए ऑर्डर आने पर यहाँ तुरंत प्रदर्शित होंगे।</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              const isProcessing = processingId === ord.id;
              const isPlaced = ord.status === 'PLACED';
              const isAccepted = ord.status === 'ACCEPTED';
              const isInTransit = ord.status === 'IN_TRANSIT';
              const isDelivered = ord.status === 'DELIVERED';
              const isCancelled = ord.status === 'CANCELLED' || ord.status === 'EXPIRED';

              return (
                <div
                  key={ord.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-emerald-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-start gap-4">
                      <img
                        src={getCropImage(ord.cropNameHindi || ord.cropNameEnglish)}
                        alt={ord.cropNameHindi}
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-2xs"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-md inline-block ${
                              isPlaced
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isAccepted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isInTransit
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : isDelivered
                                ? 'bg-green-100 text-green-900 border border-green-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {isPlaced
                              ? 'नया ऑर्डर (Pending Acceptance)'
                              : isAccepted
                              ? 'स्वीकार किया गया (Accepted)'
                              : isInTransit
                              ? 'डिलीवरी में (In Transit)'
                              : isDelivered
                              ? 'सफलतापूर्वक डिलीवर (Delivered)'
                              : 'रद्द (Cancelled)'}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-base text-slate-900">
                          {ord.cropNameHindi} ({ord.cropNameEnglish})
                        </h3>

                        <p className="text-xs font-bold text-slate-700">
                          {ord.quantityKg} kg · ₹{ord.productPricePerKg || ord.unitPrice} / kg
                        </p>

                        <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                          <p>
                            खरीदार: <strong className="text-slate-900">{ord.buyerName}</strong>
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ord.buyerLocation}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            #{ord.orderNumber} · {new Date(ord.createdAt).toLocaleDateString('hi-IN')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Separated Pricing & Action Buttons */}
                    <div className="flex flex-col justify-between items-start md:items-end space-y-3">
                      <div className="text-left md:text-right space-y-0.5">
                        <span className="text-[11px] text-slate-400 block font-medium">किसान कुल आय (100% Produce)</span>
                        <span className="text-xl font-extrabold text-emerald-800">
                          ₹{ord.productAmount.toLocaleString('en-IN')}
                        </span>
                        
                        {ord.deliveryCharge > 0 && (
                          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 justify-start md:justify-end">
                            <span>डिलीवरी शुल्क (अलग): ₹{ord.deliveryCharge}</span>
                            <Truck className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                        
                        <div className="text-[10px] text-slate-400 font-medium">
                          खरीदार कुल: ₹{ord.buyerTotal.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Dynamic Role Action Buttons */}
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        {isPlaced && (
                          <>
                            <button
                              onClick={() => handleAccept(ord.id)}
                              disabled={isProcessing}
                              className="flex-1 md:flex-initial bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-1"
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>✓ ऑर्डर स्वीकार करें</span>}
                            </button>
                            <button
                              onClick={() => handleReject(ord.id)}
                              disabled={isProcessing}
                              className="bg-white text-slate-700 border border-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-slate-50 disabled:opacity-50"
                            >
                              ✕ रद्द करें
                            </button>
                          </>
                        )}

                        {(isAccepted || isInTransit) && (
                          <Link
                            href={`/farmer/delivery/${ord.id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Truck className="w-4 h-4" />
                            <span>लाइव डिलीवरी ट्रैक करें</span>
                          </Link>
                        )}

                        {isDelivered && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>भुगतान रिलीज़ हो चुका है</span>
                          </span>
                        )}

                        <Link
                          href={`/farmer/orders/${ord.id}`}
                          className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                          title="ऑर्डर का विवरण देखें"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>

                    </div>

                  </div>

                  {/* 12h Acceptance Window Warning for Placed Orders */}
                  {isPlaced && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-bold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>⏱️ 12 घंटे की स्वीकृति विंडो: कृपया समय पर ऑर्डर स्वीकार करें अन्यथा स्टॉक स्वतः अनलॉक हो जाएगा।</span>
                      </div>
                      <span className="text-amber-700 text-[11px] font-semibold hidden sm:inline">
                        मानक नियम
                      </span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </FarmerLayout>
  );
}
