'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sprout,
  PlusCircle,
  Eye,
  ShoppingBag,
  IndianRupee,
  Search,
  Edit,
  Trash2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { ListingStatusBadge } from '@/components/ui/ListingStatusBadge';
import { FreshnessTimer } from '@/components/ui/FreshnessTimer';
import { ProduceItem } from '@/lib/seedData';

export default function MyListingsPage() {
  const { listings, deleteListing, pauseListing, updateListing } = useFarmerStore();
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'LOW_STOCK' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Edit Listing State
  const [editingListing, setEditingListing] = useState<ProduceItem | null>(null);
  const [editForm, setEditForm] = useState<{
    cropNameHindi: string;
    cropNameEnglish: string;
    askingPricePerKg: number;
    availableQtyKg: number;
    quantityKg: number;
    grade: 'A' | 'B' | 'C';
    status: 'ACTIVE' | 'LOW_STOCK' | 'EXPIRED' | 'SOLD_OUT';
    locationVillage: string;
    locationDistrict: string;
  }>({
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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openEditModal = (item: ProduceItem) => {
    setEditingListing(item);
    setEditForm({
      cropNameHindi: item.cropNameHindi,
      cropNameEnglish: item.cropNameEnglish,
      askingPricePerKg: item.askingPricePerKg,
      availableQtyKg: item.availableQtyKg,
      quantityKg: item.quantityKg,
      grade: item.grade as 'A' | 'B' | 'C',
      status: item.status as any,
      locationVillage: item.locationVillage,
      locationDistrict: item.locationDistrict,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    updateListing(editingListing.id, {
      cropNameHindi: editForm.cropNameHindi,
      cropNameEnglish: editForm.cropNameEnglish,
      askingPricePerKg: Number(editForm.askingPricePerKg),
      availableQtyKg: Number(editForm.availableQtyKg),
      quantityKg: Number(editForm.quantityKg),
      grade: editForm.grade,
      status: editForm.status,
      locationVillage: editForm.locationVillage,
      locationDistrict: editForm.locationDistrict,
    });

    setEditingListing(null);
    setToastMessage(`"${editForm.cropNameHindi}" लिस्टिंग सफलतापूर्वक अपडेट की गई!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredListings = listings.filter((item) => {
    const matchesTab =
      activeTab === 'ALL'
        ? true
        : activeTab === 'ACTIVE'
          ? item.status === 'ACTIVE'
          : activeTab === 'LOW_STOCK'
            ? item.status === 'LOW_STOCK'
            : item.status === 'EXPIRED' || item.status === 'SOLD_OUT';

    const matchesSearch =
      item.cropNameHindi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cropNameEnglish.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <FarmerLayout>
      <div className="space-y-6">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <Sprout className="w-6 h-6 text-emerald-700" />
              <h1 className="text-xl font-extrabold text-slate-900">मेरी उपज (My Listings)</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              आपके द्वारा बेचे जा रहे सभी कृषि उत्पाद और लाइव स्थिति
            </p>
          </div>

          <Link
            href="/farmer/listings/new"
            className="bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ नई उपज लिस्ट करें</span>
          </Link>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              🌿
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">कुल लिस्टिंग</span>
              <span className="text-lg font-extrabold text-slate-900">{listings.length} उत्पाद</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">कुल व्यू (7 दिन)</span>
              <span className="text-lg font-extrabold text-slate-900">245 बार</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">कुल ऑर्डर</span>
              <span className="text-lg font-extrabold text-slate-900">8 ऑर्डर</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">कुल बिक्री मूल्य</span>
              <span className="text-lg font-extrabold text-emerald-700">₹28,450</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-semibold">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3.5 py-2 rounded-xl transition-all ${activeTab === 'ALL'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                सभी ({listings.length})
              </button>
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3.5 py-2 rounded-xl transition-all ${activeTab === 'ACTIVE'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                सक्रिय ({listings.filter((l) => l.status === 'ACTIVE').length})
              </button>
              <button
                onClick={() => setActiveTab('LOW_STOCK')}
                className={`px-3.5 py-2 rounded-xl transition-all ${activeTab === 'LOW_STOCK'
                    ? 'bg-amber-500 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                कम स्टॉक ({listings.filter((l) => l.status === 'LOW_STOCK').length})
              </button>
              <button
                onClick={() => setActiveTab('EXPIRED')}
                className={`px-3.5 py-2 rounded-xl transition-all ${activeTab === 'EXPIRED'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                समाप्त/बिक्री ({listings.filter((l) => l.status === 'EXPIRED' || l.status === 'SOLD_OUT').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="फसल खोजें (Search)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          {/* Listing Cards List */}
          <div className="space-y-3">
            {filteredListings.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Sprout className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-700">कोई उपज नहीं मिली</p>
                <p className="text-xs text-slate-400 mt-1">
                  नई उपज जोड़ने के लिए ऊपर दिए गए बटन पर क्लिक करें।
                </p>
              </div>
            ) : (
              filteredListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.cropNameHindi}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-2xs"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-base text-slate-900">
                          {item.cropNameHindi} ({item.cropNameEnglish})
                        </h3>
                        <ListingStatusBadge status={item.status} />
                        <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          ग्रेड {item.grade}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap font-medium">
                        <span>
                          उपलब्ध मात्रा: <strong>{item.availableQtyKg} kg</strong> (कुल {item.quantityKg} kg)
                        </span>
                        <span>·</span>
                        <span>
                          मांगा गया मूल्य: <strong className="text-emerald-700 font-bold">₹{item.askingPricePerKg}/kg</strong>
                        </span>
                        <span>·</span>
                        <span>📍 {item.locationVillage}, {item.locationDistrict}</span>
                      </div>

                      <div className="pt-1 max-w-md">
                        <FreshnessTimer harvestDate={item.harvestDate} freshnessWindowHours={item.freshnessWindowHours} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                    <Link
                      href="/farmer/ai-recommendations"
                      className="bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 border border-purple-200 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI मैच</span>
                    </Link>

                    {/* EDIT BUTTON (संपादित करें) */}
                    <button
                      onClick={() => openEditModal(item)}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="लिस्टिंग संपादित करें"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>संपादित करें</span>
                    </button>

                    <Link
                      href={`/farmer/listings/${item.id}`}
                      className="bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 transition-colors"
                    >
                      विवरण
                    </Link>

                    <button
                      onClick={() => pauseListing(item.id)}
                      className="bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs p-2 rounded-xl border border-slate-200 transition-colors"
                      title="पॉज़ / सक्रिय करें"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="bg-white text-red-600 hover:bg-red-50 font-bold text-xs p-2 rounded-xl border border-slate-200 transition-colors"
                      title="हटाएं"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Listing Quality Suggestion Banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <div>
              <strong className="font-bold">लिस्टिंग को बेहतर बनाएं:</strong> साफ फोटो और उचित मूल्य जोड़ने पर खरीदारों की रुचि 35% बढ़ जाती है।
            </div>
          </div>
          <Link href="/farmer/ai-recommendations" className="font-bold text-emerald-700 underline flex-shrink-0">
            सुझाव देखें →
          </Link>
        </div>

        {/* ======================================================== */}
        {/* EDIT LISTING MODAL (उपज लिस्टिंग संपादित करें)           */}
        {/* ======================================================== */}
        {editingListing && (
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
                  onClick={() => setEditingListing(null)}
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
                    onClick={() => setEditingListing(null)}
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

        {/* Delete Confirmation Dialog */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <AlertCircle className="w-5 h-5" />
                <span>लिस्टिंग हटाएं?</span>
              </div>
              <p className="text-xs text-slate-600">
                क्या आप निश्चित रूप से इस उपज लिस्टिंग को हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।
              </p>
              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => {
                    deleteListing(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700"
                >
                  हाँ, हटाएं
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </FarmerLayout>
  );
}

