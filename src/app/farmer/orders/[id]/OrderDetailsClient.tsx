'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ShoppingBag,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  User,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { ListingStatusBadge } from '@/components/ui/ListingStatusBadge';
import { formatINR } from '@/lib/domain/pricing';
import { acceptFarmerOrder, rejectFarmerOrder } from '@/lib/api/client';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getOrderById, acceptOrder, rejectOrder } = useFarmerStore();

  const order = getOrderById(id);

  if (!order) {
    return (
      <FarmerLayout>
        <div className="text-center py-16 bg-white rounded-2xl p-6 border border-brand-border">
          <h2 className="text-lg font-bold text-slate-800">ऑर्डर नहीं मिला (Order Not Found)</h2>
          <Link href="/farmer/orders" className="mt-4 inline-block bg-brand-green text-white font-bold text-xs px-4 py-2 rounded-xl">
            ऑर्डर सूची पर लौटें
          </Link>
        </div>
      </FarmerLayout>
    );
  }

  const handleAcceptOrder = async () => {
    acceptOrder(order.id);
    await acceptFarmerOrder(order.id);
  };

  const handleRejectOrder = async () => {
    rejectOrder(order.id);
    await rejectFarmerOrder(order.id);
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-brand-border shadow-2xs">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-1 text-slate-500 hover:text-slate-900">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl text-slate-900">ऑर्डर विवरण #{order.orderNumber}</h1>
                <ListingStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-500">
                दिनांक: {new Date(order.createdAt).toLocaleDateString('hi-IN')}
              </p>
            </div>
          </div>

          {order.status === 'PLACED' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptOrder}
                className="bg-brand-green text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-brand-deep shadow-xs"
              >
                ✓ स्वीकार करें
              </button>
              <button
                onClick={handleRejectOrder}
                className="bg-white text-red-600 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 hover:bg-red-50"
              >
                ✕ रद्द करें
              </button>
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Buyer & Produce Info Card */}
            <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                उत्पाद और खरीदार विवरण
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">फसल:</span>
                  <span className="font-bold text-slate-900 text-sm">{order.cropNameHindi} ({order.cropNameEnglish})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">मात्रा:</span>
                  <span className="font-bold text-slate-900 text-sm">{order.quantityKg} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block">दर प्रति kg:</span>
                  <span className="font-bold text-brand-green text-sm">₹{order.productPricePerKg}/kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block">खरीदार नाम:</span>
                  <span className="font-bold text-slate-900 text-sm">{order.buyerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">खरीदार स्थान:</span>
                  <span className="font-bold text-slate-900 text-sm">{order.buyerLocation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">वितरण प्रकार:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {order.deliveryMode === 'DELIVERY_PARTNER' ? '🚚 डिलीवरी पार्टनर' : '🏪 स्वयं लेने आएगा'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Stepper Card */}
            <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                ऑर्डर प्रगति टाइमलाइन (Order Timeline)
              </h3>

              <div className="space-y-4 text-xs relative pl-6 border-l-2 border-slate-200">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-brand-green border-2 border-white ring-2 ring-emerald-100" />
                  <span className="font-bold text-slate-900">1. ऑर्डर प्राप्त हुआ (Order Received)</span>
                  <p className="text-slate-500 text-[11px]">{new Date(order.createdAt).toLocaleTimeString('hi-IN')}</p>
                </div>

                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${order.status !== 'PLACED' ? 'bg-brand-green' : 'bg-slate-300'} border-2 border-white`} />
                  <span className={`font-bold ${order.status !== 'PLACED' ? 'text-slate-900' : 'text-slate-400'}`}>
                    2. ऑर्डर स्वीकार किया (Accepted)
                  </span>
                </div>

                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${order.status === 'IN_TRANSIT' || order.status === 'DELIVERED' ? 'bg-brand-green' : 'bg-slate-300'} border-2 border-white`} />
                  <span className={`font-bold ${order.status === 'IN_TRANSIT' || order.status === 'DELIVERED' ? 'text-slate-900' : 'text-slate-400'}`}>
                    3. वाहन निर्धारित एवं पिकअप (Transport Assigned)
                  </span>
                </div>

                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${order.status === 'DELIVERED' ? 'bg-brand-green' : 'bg-slate-300'} border-2 border-white`} />
                  <span className={`font-bold ${order.status === 'DELIVERED' ? 'text-slate-900' : 'text-slate-400'}`}>
                    4. डिलीवर किया गया एवं भुगतान (Delivered)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Money Breakdown & Transport Link */}
          <div className="space-y-6">
            {/* Money Breakdown Card */}
            <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                भुगतान विवरण (Payment Breakdown)
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">फसल मूल्य (Product Amount):</span>
                  <strong className="text-brand-green font-bold text-sm">{formatINR(order.productAmount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">परिवहन शुल्क (Paid by Buyer):</span>
                  <strong className="text-slate-800">{formatINR(order.deliveryCharge)}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-sm text-slate-900">
                  <span>खरीदार का कुल भुगतान:</span>
                  <span>{formatINR(order.buyerTotal)}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 border border-emerald-100 mt-2">
                ✅ **गारंटी:** आपको पूरा <strong className="text-brand-green">{formatINR(order.productAmount)}</strong> प्राप्त होगा।
              </div>
            </div>

            {/* Transport Request Card */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-green" />
                  <h3 className="font-bold text-sm">परिवहन वाहन जानकारी</h3>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {order.status === 'IN_TRANSIT' ? 'रास्ते में (Live)' : order.status === 'DELIVERED' ? 'डिलीवर हुआ' : 'वाहन आवंटित'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="font-bold text-white">राजेश कुमार (राज ट्रांसपोर्ट)</div>
                <div className="text-[11px] text-slate-400 font-mono">वाहन: UP 32 AB 1234 (Mini Truck)</div>
                <div className="text-[11px] text-emerald-400">FreshRoute सुरक्षा: समय सीमा सक्रिय</div>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <Link
                  href={`/farmer/delivery/${order.id}`}
                  className="w-full bg-brand-green hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl block text-center shadow-xs transition-colors"
                >
                  🚚 लाइव जीपीएस ट्रैकिंग मानचित्र देखें
                </Link>
                <Link
                  href={`/farmer/transport/${order.id}`}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs py-2 rounded-xl block text-center transition-colors"
                >
                  FreshRoute विवरण देखें
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
