'use client';

import React, { useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Shield,
  Star,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  KeyRound,
  RotateCcw,
  Navigation,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { GoogleMandiMap } from '@/components/common/GoogleMandiMap';

interface BuyerOrdersViewProps {
  orders: Order[];
  onRateTransporter?: (orderId: string, rating: number, feedback: string) => void;
  onRefreshOrders?: () => void;
}

export const BuyerOrdersView: React.FC<BuyerOrdersViewProps> = ({
  orders,
  onRateTransporter,
  onRefreshOrders,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  const filterTabs = [
    { id: 'ALL', labelHindi: 'सभी ऑर्डर्स', labelEng: 'All Orders' },
    { id: 'PLACED', labelHindi: 'Placed', labelEng: 'स्वीकृति प्रतीक्षित' },
    { id: 'PACKED', labelHindi: 'Packed', labelEng: 'पैक किया गया' },
    { id: 'IN_TRANSIT', labelHindi: 'In Transit', labelEng: 'रास्ते में है' },
    { id: 'DELIVERED', labelHindi: 'Delivered', labelEng: 'सफल डिलीवरी' },
    { id: 'CANCELLED', labelHindi: 'Cancelled', labelEng: 'रद्द' },
  ];

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'IN_TRANSIT') {
      return order.status === 'IN_TRANSIT' || order.status === 'DISPATCHED';
    }
    return order.status === statusFilter;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered (पहुँचा)</span>
          </span>
        );
      case 'IN_TRANSIT':
      case 'DISPATCHED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1 animate-pulse">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>In Transit (रास्ते में)</span>
          </span>
        );
      case 'PACKED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-amber-600" />
            <span>Packed (तैयार)</span>
          </span>
        );
      case 'PLACED':
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Order Confirmed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Cancelled (रद्द)</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const handleRatingSubmit = () => {
    if (!ratingOrder) return;
    if (onRateTransporter) {
      onRateTransporter(ratingOrder.id, selectedStars, feedbackText);
    }
    setRatingSubmitted(true);
    setTimeout(() => {
      setRatingOrder(null);
      setRatingSubmitted(false);
      setFeedbackText('');
    }, 1500);
  };

  const toggleFaq = (id: string) => {
    setActiveFaq((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HEADER (scr-012) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2">
            <Package className="w-3.5 h-3.5 text-blue-700" />
            <span>Buyer Order History & Live Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            मेरे ऑर्डर <span className="text-slate-500 font-normal text-xl">(My Orders)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            अपने सभी ऑर्डर्स की स्थिति, लाइव जीपीएस ट्रैकिंग और रसीद देखें।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshOrders && (
            <button
              onClick={onRefreshOrders}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="रिफ्रेश करें"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. 3-COL SPLIT: ORDERS LIST (2 COLS) + SIDE METRICS (1 COL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Filter Tabs (scr-012) */}
          <div className="bg-white rounded-xl p-2 border border-slate-200/80 shadow-2xs flex items-center gap-1 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.labelHindi}
              </button>
            ))}
          </div>

          {/* Orders Cards */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">कोई ऑर्डर नहीं मिला</h3>
              <p className="text-xs text-slate-500 mt-1">इस फ़िल्टर के तहत कोई ऑर्डर उपलब्ध नहीं है।</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isActive = order.status === 'IN_TRANSIT' || order.status === 'DISPATCHED';
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all duration-200 p-5"
                >
                  {/* Order Top Bar: Code, Date, Seller & Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{order.orderCode}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{order.placedAt}</span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1 font-medium mt-0.5">
                          <span>विक्रेता:</span>
                          <strong className="text-emerald-800">{order.sellerName}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Items Display & Pricing Breakdown */}
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2 overflow-hidden shrink-0">
                        {order.items.map((it, idx) => (
                          <img
                            key={idx}
                            src={it.image}
                            alt={it.cropHindi}
                            className="inline-block h-12 w-12 rounded-xl ring-2 ring-white object-cover border border-slate-200"
                          />
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {order.items.map((it) => `${it.cropHindi} (${it.quantityKg}kg)`).join(', ')}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          पिकअप: {order.pickupLocation} ➔ ड्रॉप: {order.dropLocation}
                        </p>
                      </div>
                    </div>

                    {/* Price Separation (Rule R-001/R-004) */}
                    <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4 shrink-0">
                      <div className="text-xs text-slate-500">
                        उपज: ₹{order.productAmount} + डिलीवरी: ₹{order.deliveryFee}
                      </div>
                      <div className="text-lg font-extrabold text-slate-900">
                        ₹{order.totalAmount}
                      </div>
                    </div>
                  </div>

                  {/* INLINE STEPPER FOR ACTIVE ORDERS (scr-012) */}
                  {isActive && (
                    <div className="bg-slate-50/80 rounded-xl p-3 my-2 border border-slate-200/80">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-2">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ordered 10:30 AM
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Packed 11:15 AM
                        </span>
                        <span className="flex items-center gap-1 text-blue-700 font-extrabold animate-pulse">
                          ● In Transit (रास्ते में)
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          ○ Delivered Est. 3:00 PM
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full w-3/4 animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {order.transporterName && (
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                          {order.transporterName}
                        </span>
                      )}
                      {order.distanceKm && <span>• {order.distanceKm} km</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button
                          onClick={() => setTrackingModalOrder(order)}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>लाइव ट्रैक करें</span>
                        </button>
                      )}

                      {order.status === 'DELIVERED' && (
                        <button
                          onClick={() => setRatingOrder(order)}
                          className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                          <span>रेटिंग दें (Review)</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedOrderModal(order)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>विवरण</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Rail: Monthly Summary & Interactive FAQ (scr-012) */}
        <div className="space-y-4">
          {/* Order Summary (scr-012) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-700" />
              <span>ऑर्डर समरी (इस माह)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-xl font-extrabold text-slate-900">{orders.length}</p>
                <p className="text-[11px] text-slate-500">कुल ऑर्डर</p>
              </div>
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-center">
                <p className="text-xl font-extrabold text-blue-900">
                  {orders.filter((o) => o.status === 'IN_TRANSIT' || o.status === 'DISPATCHED').length}
                </p>
                <p className="text-[11px] text-blue-700">In Transit</p>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-center">
                <p className="text-xl font-extrabold text-emerald-900">
                  {orders.filter((o) => o.status === 'DELIVERED').length}
                </p>
                <p className="text-[11px] text-emerald-700">Delivered</p>
              </div>
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100 text-center">
                <p className="text-xl font-extrabold text-rose-900">
                  {orders.filter((o) => o.status === 'CANCELLED').length}
                </p>
                <p className="text-[11px] text-rose-700">Cancelled</p>
              </div>
            </div>

            {/* Smart Delivery Impact (scr-012) */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Smart Delivery का लाभ
              </h4>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-600">कुल पैसे बचाए (Savings):</span>
                <span className="font-extrabold text-emerald-700">₹840</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-600">औसत डिलीवरी दूरी:</span>
                <span className="font-extrabold text-slate-800">42 km</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-600">किसानों को समर्थन:</span>
                <span className="font-extrabold text-slate-800">6 किसान</span>
              </div>
            </div>
          </div>

          {/* Interactive Help Accordion (scr-012) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">सहायता केंद्र (Help Center)</h3>
            <p className="text-xs text-slate-500 mb-3">ऑर्डर व डिलीवरी से संबंधित त्वरित समाधान</p>
            <div className="space-y-2 text-xs">
              {/* FAQ 1 */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq('issue')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span>ऑर्डर से संबंधित समस्या?</span>
                  {activeFaq === 'issue' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                {activeFaq === 'issue' && (
                  <div className="p-3 bg-white text-slate-600 border-t border-slate-100 leading-relaxed">
                    यदि ऑर्डर मात्रा में भिन्नता है तो डिलीवरी OTP देने से पहले ड्राइवर से तौल करवाएं अथवा हेल्पलाइन 1800-123-4567 पर संपर्क करें।
                  </div>
                )}
              </div>

              {/* FAQ 2 */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq('delay')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span>डिलीवरी में देरी?</span>
                  {activeFaq === 'delay' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                {activeFaq === 'delay' && (
                  <div className="p-3 bg-white text-slate-600 border-t border-slate-100 leading-relaxed">
                    हाईवे ट्रैफिक या मौसम की स्थिति की वजह से होने वाले विलंब की स्थिति में SmartMatch स्वचालित रूप से नया ETA अपडेट करता है।
                  </div>
                )}
              </div>

              {/* FAQ 3 */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq('refund')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span>रिटर्न / रिफंड नियम</span>
                  {activeFaq === 'refund' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                {activeFaq === 'refund' && (
                  <div className="p-3 bg-white text-slate-600 border-t border-slate-100 leading-relaxed">
                    क्षतिग्रस्त अथवा गैर-मानक उपज की स्थिति में 100% रिफंड सीधे आपके खाते में 24 घंटे में क्रेडिट किया जाता है।
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LIVE TRACKING MAP MODAL */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <span>लाइव जीपीएस ट्रैकिंग • {trackingModalOrder.orderCode}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ड्राइवर मार्ग पर है • अनुमानित समय: {trackingModalOrder.eta || 'आज 3:00 PM'}
                </p>
              </div>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Map */}
            <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 mb-4">
              <GoogleMandiMap
                origin={{ lat: 26.9284, lng: 81.1834, label: trackingModalOrder.pickupLocation }}
                destination={{ lat: 26.8524, lng: 80.9412, label: trackingModalOrder.dropLocation }}
                transporterLocation={{
                  lat: 26.8904,
                  lng: 81.0623,
                  driverName: trackingModalOrder.transporterName || 'राजेश कुमार (राज ट्रांसपोर्ट)',
                  vehicleNumber: trackingModalOrder.transporterVehicle || 'UP 32 BK 4821',
                }}
                showDetails={true}
                tripStatus="IN_TRANSIT"
              />
            </div>

            {/* Driver Card & OTP */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {trackingModalOrder.transporterName || 'राजेश कुमार (राज ट्रांसपोर्ट)'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    वाहन: {trackingModalOrder.transporterVehicle || 'UP 32 BK 4821 (मिनी ट्रक)'}
                  </p>
                </div>
              </div>

              {/* PoD OTP Display */}
              <div className="bg-white px-4 py-2 rounded-xl border border-blue-200 text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Delivery PoD OTP
                </span>
                <span className="text-xl font-extrabold tracking-widest text-emerald-700">
                  4821
                </span>
                <span className="text-[9px] text-slate-400 block">ड्राइवर को सामान मिलने पर दें</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <a
                href="tel:+919876543210"
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>ड्राइवर को कॉल करें</span>
              </a>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="py-2.5 px-6 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. RATING MODAL */}
      {ratingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp text-center">
            {ratingSubmitted ? (
              <div className="py-6">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-3 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-900">रेटिंग दर्ज की गई!</h3>
                <p className="text-xs text-slate-500 mt-1">आपकी प्रतिक्रिया से सेवा में सुधार होता है।</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  ट्रांसपोर्टर को रेटिंग दें (Review Delivery)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {ratingOrder.transporterName || 'डिलीवरी पार्टनर'} • {ratingOrder.orderCode}
                </p>

                {/* Stars */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedStars(s)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          s <= selectedStars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="समय पर डिलीवरी, सुरक्षित हैंडलिंग या कोई सुझाव लिखें..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 mb-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setRatingOrder(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    रद्द करें
                  </button>
                  <button
                    onClick={handleRatingSubmit}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    रेटिंग सबमिट करें
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 5. ORDER DETAIL MODAL */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  ऑर्डर रसीद: {selectedOrderModal.orderCode}
                </h3>
                <p className="text-xs text-slate-500">{selectedOrderModal.placedAt}</p>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">किसान / FPO:</span>
                <span className="font-bold text-slate-800">{selectedOrderModal.sellerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">डिलीवरी मोड:</span>
                <span className="font-bold text-slate-800">
                  {selectedOrderModal.deliveryMethod === 'DELIVERY_PARTNER' ? 'Smart Delivery' : 'Self Pick-up'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">उपज मूल्य (Farmer Share):</span>
                <span className="font-bold text-emerald-800">₹{selectedOrderModal.productAmount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">डिलीवरी शुल्क (Transporter Fee):</span>
                <span className="font-bold text-blue-800">₹{selectedOrderModal.deliveryFee}</span>
              </div>
              <div className="flex justify-between py-1 text-sm font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-xl">
                <span>कुल भुगतान (Total Paid):</span>
                <span>₹{selectedOrderModal.totalAmount}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.print();
                  }
                }}
                className="flex-1 py-2.5 rounded-xl border border-emerald-600 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🖨️ इनवॉइस / रसीद प्रिंट करें</span>
              </button>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
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
