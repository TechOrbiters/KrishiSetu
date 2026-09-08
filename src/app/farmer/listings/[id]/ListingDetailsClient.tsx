'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Sparkles,
  MapPin,
  Clock,
  Eye,
  ShoppingBag,
  TrendingUp,
  Truck,
  Edit,
  PauseCircle,
  Share2,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { ListingStatusBadge } from '@/components/ui/ListingStatusBadge';
import { FreshnessTimer } from '@/components/ui/FreshnessTimer';
import { formatINR } from '@/lib/domain/pricing';
import { fetchListingById, updateFarmerListing, pauseFarmerListing, deleteFarmerListing } from '@/lib/api/client';
import { ProduceItem } from '@/lib/seedData';

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getListingById, orders, refreshListings, deleteListing } = useFarmerStore();

  const storeListing = getListingById(id);
  const [listing, setListing] = useState<ProduceItem | null>(storeListing || null);
  const [loading, setLoading] = useState<boolean>(!storeListing);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    cropNameHindi: '',
    cropNameEnglish: '',
    askingPricePerKg: 0,
    availableQtyKg: 0,
    quantityKg: 0,
    grade: 'A',
    status: 'ACTIVE',
    locationVillage: '',
    locationDistrict: '',
  });

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      const res = await fetchListingById(id);
      if (res.success && res.data) {
        setListing(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  useEffect(() => {
    if (listing) {
      setEditForm({
        cropNameHindi: listing.cropNameHindi,
        cropNameEnglish: listing.cropNameEnglish,
        askingPricePerKg: listing.askingPricePerKg,
        availableQtyKg: listing.availableQtyKg,
        quantityKg: listing.quantityKg,
        grade: listing.grade,
        status: listing.status,
        locationVillage: listing.locationVillage,
        locationDistrict: listing.locationDistrict,
      });
    }
  }, [listing]);

  if (loading) {
    return (
      <FarmerLayout>
        <div className="text-center py-16 bg-white rounded-2xl p-6 border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">लोड हो रहा है...</p>
        </div>
      </FarmerLayout>
    );
  }

  if (!listing) {
    return (
      <FarmerLayout>
        <div className="text-center py-16 bg-white rounded-2xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">उपज नहीं मिली (Listing Not Found)</h2>
          <p className="text-xs text-slate-500 mt-1">यह लिस्टिंग मौजूद नहीं है या हटा दी गई है।</p>
          <Link href="/farmer/listings" className="mt-4 inline-block bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl">
            मेरी लिस्टिंग पर लौटें
          </Link>
        </div>
      </FarmerLayout>
    );
  }

  const linkedOrders = orders.filter((o) => o.listingId === listing.id);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateFarmerListing(listing.id, {
      crop_name: editForm.cropNameHindi,
      cropNameHindi: editForm.cropNameHindi,
      cropNameEnglish: editForm.cropNameEnglish,
      price_per_kg: Number(editForm.askingPricePerKg),
      quantity: Number(editForm.quantityKg),
      availableQtyKg: Number(editForm.availableQtyKg),
      grade: editForm.grade as any,
      status: editForm.status as any,
      location_name: `${editForm.locationVillage}, ${editForm.locationDistrict}`,
    });

    if (res.success && res.data) {
      setListing((prev) => prev ? {
        ...prev,
        ...editForm,
        grade: editForm.grade as 'A' | 'B' | 'C',
        status: editForm.status as any,
        askingPricePerKg: Number(editForm.askingPricePerKg),
        quantityKg: Number(editForm.quantityKg),
      } : null);
      setToastMessage('लिस्टिंग विवरण सफलतापूर्वक अपडेट किया गया!');
      if (refreshListings) refreshListings();
    } else {
      setToastMessage(`त्रुटि: ${res.error || 'अपडेट विफल'}`);
    }

    setIsEditing(false);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTogglePause = async () => {
    const res = await pauseFarmerListing(listing.id, listing.status);
    if (res.success) {
      const newStatus = (listing.status === 'PAUSED' || listing.status === 'INACTIVE' ? 'ACTIVE' : 'PAUSED') as any;
      setListing((prev) => prev ? { ...prev, status: newStatus } : null);
      setToastMessage(`लिस्टिंग स्थिति बदलकर ${newStatus} की गई!`);
      if (refreshListings) refreshListings();
    } else {
      setToastMessage(`त्रुटि: ${res.error || 'स्थिति बदलने में विफल'}`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDelete = async () => {
    if (!confirm('क्या आप सचमुच इस लिस्टिंग को हटाना चाहते हैं?')) return;
    const res = await deleteFarmerListing(listing.id);
    if (res.success) {
      if (deleteListing) deleteListing(listing.id);
      if (refreshListings) refreshListings();
      router.push('/farmer/listings');
    } else {
      setToastMessage(`त्रुटि: ${res.error || 'हटाने में विफल'}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-1 text-slate-500 hover:text-slate-900">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl text-slate-900">{listing.cropNameHindi} ({listing.cropNameEnglish})</h1>
                <ListingStatusBadge status={listing.status} />
              </div>
              <p className="text-xs text-slate-500 font-medium">आईडी: #{listing.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <button
              onClick={() => {
                setEditForm({
                  cropNameHindi: listing.cropNameHindi,
                  cropNameEnglish: listing.cropNameEnglish,
                  askingPricePerKg: listing.askingPricePerKg,
                  availableQtyKg: listing.availableQtyKg,
                  quantityKg: listing.quantityKg,
                  grade: listing.grade,
                  status: listing.status as any,
                  locationVillage: listing.locationVillage,
                  locationDistrict: listing.locationDistrict,
                });
                setIsEditing(true);
              }}
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Edit className="w-4 h-4" />
              <span>संपादित करें</span>
            </button>

            <button
              onClick={handleTogglePause}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1"
            >
              <PauseCircle className="w-4 h-4" />
              <span>{listing.status === 'PAUSED' || listing.status === 'INACTIVE' ? 'सक्रिय करें' : 'पॉज़ करें'}</span>
            </button>

            <button
              onClick={handleDelete}
              className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>हटाएं</span>
            </button>

            <Link
              href="/farmer/ai-recommendations"
              className="bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-purple-800 flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI से बेहतर खरीदार खोजें</span>
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Image & Produce Details (Spans 2) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="relative h-64 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={listing.imageUrl}
                  alt={listing.cropNameHindi}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div>
                  <span className="text-slate-400 block">कुल मात्रा</span>
                  <span className="font-bold text-sm text-slate-900">{listing.quantityKg} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block">मांगा गया मूल्य</span>
                  <span className="font-bold text-sm text-emerald-700">₹{listing.askingPricePerKg}/kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block">बाजार भाव दायरा</span>
                  <span className="font-bold text-sm text-slate-900">{listing.marketPriceRange}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">श्रेणी (Grade)</span>
                  <span className="font-bold text-sm text-slate-900">ग्रेड {listing.grade}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">स्थान</span>
                  <span className="font-bold text-sm text-slate-900">{listing.locationVillage}, {listing.locationDistrict}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">उपलब्धता</span>
                  <span className="font-bold text-sm text-slate-900">{listing.availability}</span>
                </div>
              </div>
            </div>

            {/* Freshness Window Status Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>ताज़गी स्थिति (Freshness Window)</span>
              </h3>
              <FreshnessTimer harvestDate={listing.harvestDate} freshnessWindowHours={listing.freshnessWindowHours} />
            </div>

            {/* Linked Orders for this Listing */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                <span>इस उपज के ऑर्डर ({linkedOrders.length})</span>
              </h3>

              {linkedOrders.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">अभी इस उपज के लिए कोई ऑर्डर प्राप्त नहीं हुआ है।</p>
              ) : (
                <div className="space-y-2">
                  {linkedOrders.map((ord) => (
                    <div key={ord.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">#{ord.orderNumber} · {ord.buyerName}</div>
                        <div className="text-slate-500">{ord.quantityKg} kg · {formatINR(ord.productAmount)} (फसल मूल्य)</div>
                      </div>
                      <Link href={`/farmer/orders/${ord.id}`} className="font-bold text-emerald-700 underline">
                        विवरण →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Recommendations & Interest */}
          <div className="space-y-6">
            {/* Buyer Interest Metrics */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">खरीदार रुचि (Buyer Interest)</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <Eye className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <span className="font-extrabold text-lg text-slate-900 block">{listing.viewsCount}</span>
                  <span className="text-[10px] text-slate-400">कुल व्यू</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
                  <span className="font-extrabold text-lg text-slate-900 block">{listing.ordersCount}</span>
                  <span className="text-[10px] text-slate-400">ऑर्डर</span>
                </div>
              </div>
            </div>

            {/* AI Recommendation Widget */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-purple-200 space-y-3">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>AI बेचना सुझाव (AI Opportunity)</span>
              </div>
              <div className="text-2xl font-extrabold text-purple-900">91/100 स्कोर</div>
              <p className="text-xs text-purple-800 leading-relaxed">
                लखनऊ में 1.8T मांग देखी गई है। 3 खरीदार उपलब्ध हैं। सर्वोत्तम अनुमानित भाव: ₹25/kg.
              </p>
              <Link
                href="/farmer/ai-recommendations"
                className="w-full bg-purple-700 text-white font-bold text-xs py-2.5 rounded-xl block text-center hover:bg-purple-800 shadow-xs"
              >
                सुझाव देखें
              </Link>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* EDIT LISTING MODAL                                       */}
        {/* ======================================================== */}
        {isEditing && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    उपज संपादित करें (Edit Listing)
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveEdit} className="space-y-4">
                
                {/* Crop Names Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      फसल का नाम (हिंदी) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.cropNameHindi}
                      onChange={(e) => setEditForm({ ...editForm, cropNameHindi: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Crop Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.cropNameEnglish}
                      onChange={(e) => setEditForm({ ...editForm, cropNameEnglish: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Price & Quantity Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      मांगा गया मूल्य (₹/kg) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editForm.askingPricePerKg}
                      onChange={(e) => setEditForm({ ...editForm, askingPricePerKg: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      उपलब्ध मात्रा (kg) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editForm.availableQtyKg}
                      onChange={(e) => setEditForm({ ...editForm, availableQtyKg: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      कुल मात्रा (kg) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editForm.quantityKg}
                      onChange={(e) => setEditForm({ ...editForm, quantityKg: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Grade & Status Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      फसल श्रेणी (Grade)
                    </label>
                    <select
                      value={editForm.grade}
                      onChange={(e) => setEditForm({ ...editForm, grade: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="A">ग्रेड A (उत्कृष्ट)</option>
                      <option value="B">ग्रेड B (मध्यम)</option>
                      <option value="C">ग्रेड C (सामान्य)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      लिस्टिंग स्थिति (Status)
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="ACTIVE">सक्रिय (Active)</option>
                      <option value="LOW_STOCK">कम स्टॉक (Low Stock)</option>
                      <option value="EXPIRED">पॉज़ / समाप्त (Expired/Paused)</option>
                      <option value="SOLD_OUT">बिक गया (Sold Out)</option>
                    </select>
                  </div>
                </div>

                {/* Location Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      गाँव (Village)
                    </label>
                    <input
                      type="text"
                      value={editForm.locationVillage}
                      onChange={(e) => setEditForm({ ...editForm, locationVillage: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      जिला (District)
                    </label>
                    <input
                      type="text"
                      value={editForm.locationDistrict}
                      onChange={(e) => setEditForm({ ...editForm, locationDistrict: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center gap-3 justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    रद्द करें (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
                  >
                    बदलाव सहेजें (Save Changes)
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </FarmerLayout>
  );
}
