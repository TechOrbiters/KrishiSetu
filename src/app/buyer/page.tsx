'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  MapPin,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Package,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  X,
  Plus,
  Minus,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { fetchFarmerListings, createBuyerOrder, fetchFarmerOrders } from '@/lib/api/client';
import { ProduceItem, OrderItem } from '@/lib/seedData';

export default function BuyerPortalPage() {
  const router = useRouter();

  // Active Role Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishi_active_role', 'BUYER');
    }
  }, []);

  // Tabs: 'browse' | 'orders' | 'prices'
  const [activeTab, setActiveTab] = useState<'browse' | 'orders' | 'prices'>('browse');

  // Produce Listings State
  const [listings, setListings] = useState<ProduceItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Buyer Orders State
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Cart & Checkout State
  const [cartItem, setCartItem] = useState<{
    listing: ProduceItem;
    quantity: number;
    deliveryMode: 'DELIVERY_PARTNER' | 'SELF_PICKUP';
    destinationAddress: string;
  } | null>(null);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');
  const [orderErrorMsg, setOrderErrorMsg] = useState('');

  // Load listings on mount
  useEffect(() => {
    loadListings();
  }, []);

  // Load orders when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);

  const loadListings = async () => {
    setLoadingListings(true);
    try {
      const res = await fetchFarmerListings();
      if (res.success && res.data) {
        setListings(res.data);
      }
    } catch (e) {
      console.error('Error fetching listings:', e);
    } finally {
      setLoadingListings(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetchFarmerOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleAddToCart = (listing: ProduceItem) => {
    setCartItem({
      listing,
      quantity: Math.max(listing.minOrderQtyKg, 50),
      deliveryMode: 'DELIVERY_PARTNER',
      destinationAddress: 'मंडी गेट नंबर 2, लखनऊ, उत्तर प्रदेश',
    });
    setOrderSuccessMsg('');
    setOrderErrorMsg('');
  };

  const calculateDeliveryCharge = () => {
    if (!cartItem) return 0;
    if (cartItem.deliveryMode === 'SELF_PICKUP') return 0;
    // Standard transport formula: base ₹300 + ₹2.5/kg
    return Math.round(300 + (cartItem.quantity * 2.5));
  };

  const handlePlaceOrder = async () => {
    if (!cartItem) return;
    setIsPlacingOrder(true);
    setOrderSuccessMsg('');
    setOrderErrorMsg('');

    try {
      const deliveryCharge = calculateDeliveryCharge();
      const productAmount = cartItem.quantity * cartItem.listing.askingPricePerKg;
      const totalAmount = productAmount + deliveryCharge;

      const payload = {
        listing_id: cartItem.listing.id,
        quantity: cartItem.quantity,
        unit_price: cartItem.listing.askingPricePerKg,
        product_amount: productAmount,
        delivery_fee: deliveryCharge,
        total_amount: totalAmount,
        delivery_mode: cartItem.deliveryMode,
        destination_address: cartItem.destinationAddress,
        delivery_lat: 26.8467,
        delivery_lng: 80.9462,
        buyer_notes: 'ताज़ा उपज - सीधे किसान से',
      };

      const res = await createBuyerOrder(payload);
      if (res.success) {
        setOrderSuccessMsg('ऑर्डर सफलतापूर्वक दर्ज किया गया! किसान को सूचना भेज दी गई है।');
        setCartItem(null);
        // Refresh orders
        loadOrders();
        setActiveTab('orders');
      } else {
        setOrderErrorMsg(res.error || 'ऑर्डर दर्ज करने में समस्या आई। कृपया पुनः प्रयास करें।');
      }
    } catch (err: any) {
      setOrderErrorMsg(err.message || 'त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      (item.cropNameHindi?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (item.cropNameEnglish?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (item.locationDistrict?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesCategory =
      selectedCategory === 'ALL' ||
      (selectedCategory === 'VEG' && (item.category?.includes('सब्जी') || item.category?.toLowerCase().includes('veg'))) ||
      (selectedCategory === 'FRUIT' && (item.category?.includes('फल') || item.category?.toLowerCase().includes('fruit'))) ||
      (selectedCategory === 'GRAIN' && (item.category?.includes('अनाज') || item.category?.toLowerCase().includes('grain')));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 1. TOP HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Brand Logo & Switch */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-xs group-hover:scale-105 transition-transform">
                KS
              </div>
              <div>
                <span className="font-black text-xl text-blue-800 tracking-tight block leading-tight">
                  KrishiSetu
                </span>
                <span className="text-[10px] text-slate-500 font-bold block">खरीदार पोर्टल (Buyer Portal)</span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-6 w-px bg-slate-200" />
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
              <Sparkles className="w-3.5 h-3.5" />
              0% बिचौलिया कमीशन
            </span>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="फसल, किस्म या मंडी खोजें (जैसे: टमाटर, आलू, बाराबंकी)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* Navigation & Cart Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('orders')}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition-colors flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>मेरे ऑर्डर ({orders.length})</span>
            </button>

            <Link
              href="/"
              className="text-xs font-bold px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors hidden sm:block"
            >
              मुख्य पृष्ठ
            </Link>
          </div>
        </div>

        {/* 2. SUB-BAR NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-100 flex gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🌾 ताज़ा उपज ब्राउज़ करें</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>📦 मेरे ऑर्डर ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'prices'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>📈 लाइव मंडी भाव</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Success / Error Banners */}
        {orderSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold p-4 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{orderSuccessMsg}</span>
            </div>
            <button
              onClick={() => setOrderSuccessMsg('')}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {orderErrorMsg && (
          <div className="bg-red-50 border border-red-300 text-red-800 text-sm font-bold p-4 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{orderErrorMsg}</span>
            </div>
            <button
              onClick={() => setOrderErrorMsg('')}
              className="text-red-700 hover:text-red-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: BROWSE PRODUCE */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-colors shadow-2xs ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                सभी उपज (All)
              </button>
              <button
                onClick={() => setSelectedCategory('VEG')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-colors shadow-2xs ${
                  selectedCategory === 'VEG'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                🥦 हरी सब्जियां (Vegetables)
              </button>
              <button
                onClick={() => setSelectedCategory('FRUIT')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-colors shadow-2xs ${
                  selectedCategory === 'FRUIT'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                🍎 ताजे फल (Fruits)
              </button>
              <button
                onClick={() => setSelectedCategory('GRAIN')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-colors shadow-2xs ${
                  selectedCategory === 'GRAIN'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                🌾 अनाज व दलहन (Grains)
              </button>
            </div>

            {/* Listings Grid */}
            {loadingListings ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
                    <div className="w-full h-40 bg-slate-200 rounded-xl" />
                    <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-4 bg-slate-200 rounded-md w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">कोई उपज उपलब्ध नहीं है</h3>
                <p className="text-xs text-slate-500">कृपया अन्य खोज शब्द या श्रेणी चुनकर देखें।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredListings.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image & Badges */}
                      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.cropNameEnglish}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span>📍 {item.locationDistrict || 'बाराबंकी'}</span>
                        </div>
                        <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                          ग्रेड {item.grade || 'A'}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                              {item.cropNameHindi} ({item.cropNameEnglish})
                            </h3>
                            <span className="text-[11px] text-slate-500 font-semibold">{item.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-400 block font-medium">किसान मूल्य</span>
                            <span className="text-lg font-black text-blue-700">₹{item.askingPricePerKg}/kg</span>
                          </div>
                        </div>

                        {/* Specs row */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px] font-bold">उपलब्ध मात्रा</span>
                            <strong className="text-slate-800 font-bold">{item.availableQtyKg} {item.unit || 'kg'}</strong>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px] font-bold">न्यूनतम ऑर्डर</span>
                            <strong className="text-slate-800 font-bold">{item.minOrderQtyKg} {item.unit || 'kg'}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ताज़गी गारंटी: {item.freshnessWindowHours || 48} घंटे में डिलीवरी</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Action */}
                    <div className="p-4 pt-0">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>खरीदें (Buy Directly)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">मेरे खरीदे गए ऑर्डर</h2>
                <p className="text-xs text-slate-500 font-medium">सीधे किसानों से खरीदे गए सभी ऑर्डरों की लाइव स्थिति</p>
              </div>
              <button
                onClick={loadOrders}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                रिफ्रेश करें
              </button>
            </div>

            {loadingOrders ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse h-28" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">आपने अभी तक कोई ऑर्डर नहीं दिया है</h3>
                <p className="text-xs text-slate-500">उपज ब्राउज़ करें और सीधे किसानों से उचित दाम पर खरीदें।</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  उपज देखें
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-all space-y-4"
                  >
                    {/* Top Row: Order Number & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{ord.orderNumber}</span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(ord.createdAt).toLocaleDateString('hi-IN')}
                        </span>
                      </div>

                      <div>
                        {ord.status === 'DELIVERED' && (
                          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> डिलीवर हो गया
                          </span>
                        )}
                        {ord.status === 'IN_TRANSIT' && (
                          <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" /> रास्ते में है (In Transit)
                          </span>
                        )}
                        {ord.status === 'ACCEPTED' && (
                          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> किसान द्वारा स्वीकृत
                          </span>
                        )}
                        {ord.status === 'PLACED' && (
                          <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> पुष्टि की प्रतीक्षा
                          </span>
                        )}
                        {ord.status === 'CANCELLED' && (
                          <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                            रद्द हुआ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Crop details & Itemized Price Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">उपज एवं मात्रा</span>
                        <strong className="text-slate-900 font-bold text-sm">
                          {ord.cropNameHindi} ({ord.cropNameEnglish})
                        </strong>
                        <p className="text-slate-600 font-semibold">{ord.quantityKg} किग्रा @ ₹{ord.productPricePerKg}/किग्रा</p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">डिलीवरी पता</span>
                        <strong className="text-slate-800 font-semibold block">{ord.buyerLocation}</strong>
                        <span className="text-slate-500 text-[11px]">मोड: {ord.deliveryMode === 'SELF_PICKUP' ? 'स्वयं पिक-अप' : 'डिलीवरी पार्टनर'}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>उपज मूल्य:</span>
                          <span className="font-semibold">₹{ord.productAmount}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>डिलीवरी शुल्क:</span>
                          <span className="font-semibold">₹{ord.deliveryCharge}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-extrabold border-t border-slate-200 pt-1 text-sm">
                          <span>कुल भुगतान:</span>
                          <span className="text-blue-700">₹{ord.buyerTotal}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANDI PRICES */}
        {activeTab === 'prices' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">लाइव मंडी भाव (AGMARKNET)</h2>
              <p className="text-xs text-slate-500 font-medium">लखनऊ और बाराबंकी मंडियों के आधिकारिक दैनिक मूल्य</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { crop: 'टमाटर (Tomato)', mandi: 'लखनऊ मंडी', modal: 24, min: 20, max: 28, trend: '+4%' },
                { crop: 'आलू (Potato)', mandi: 'बाराबंकी मंडी', modal: 18, min: 15, max: 20, trend: '0%' },
                { crop: 'प्याज (Onion)', mandi: 'लखनऊ मंडी', modal: 32, min: 28, max: 35, trend: '-2%' },
                { crop: 'गेहूँ (Wheat)', mandi: 'बाराबंकी मंडी', modal: 26, min: 24, max: 27, trend: '+1%' },
              ].map((p, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="text-xs font-extrabold text-slate-900 block">{p.crop}</span>
                  <span className="text-[11px] text-slate-500 block">{p.mandi}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">₹{p.modal}</span>
                    <span className="text-xs font-bold text-slate-500">/किग्रा</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>न्यूनतम: ₹{p.min}</span>
                    <span>अधिकतम: ₹{p.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 4. CHECKOUT MODAL (ITEMIZED PRICING AS PER R-001) */}
      {cartItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">चेकआउट एवं आर्डर पुष्टि</h3>
              </div>
              <button
                onClick={() => setCartItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Produce Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
              <img
                src={cartItem.listing.imageUrl}
                alt={cartItem.listing.cropNameEnglish}
                className="w-14 h-14 rounded-lg object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  {cartItem.listing.cropNameHindi} ({cartItem.listing.cropNameEnglish})
                </h4>
                <p className="text-xs text-slate-500">
                  किसान दर: <strong>₹{cartItem.listing.askingPricePerKg} / किग्रा</strong>
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold">
                  स्थान: {cartItem.listing.locationDistrict}
                </p>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">मात्रा (किग्रा में):</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCartItem({
                      ...cartItem,
                      quantity: Math.max(cartItem.listing.minOrderQtyKg, cartItem.quantity - 25),
                    })
                  }
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min={cartItem.listing.minOrderQtyKg}
                  max={cartItem.listing.availableQtyKg}
                  step="10"
                  value={cartItem.quantity}
                  onChange={(e) =>
                    setCartItem({
                      ...cartItem,
                      quantity: Math.max(
                        cartItem.listing.minOrderQtyKg,
                        Math.min(cartItem.listing.availableQtyKg, Number(e.target.value) || 0)
                      ),
                    })
                  }
                  className="w-32 text-center py-2 border border-slate-300 rounded-xl font-bold text-sm text-slate-900"
                />

                <button
                  type="button"
                  onClick={() =>
                    setCartItem({
                      ...cartItem,
                      quantity: Math.min(cartItem.listing.availableQtyKg, cartItem.quantity + 25),
                    })
                  }
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <span className="text-xs text-slate-500">
                  (न्यूनतम: {cartItem.listing.minOrderQtyKg} किग्रा)
                </span>
              </div>
            </div>

            {/* Delivery Mode Choice */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">डिलीवरी विकल्प:</label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                    cartItem.deliveryMode === 'DELIVERY_PARTNER'
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryMode"
                      checked={cartItem.deliveryMode === 'DELIVERY_PARTNER'}
                      onChange={() => setCartItem({ ...cartItem, deliveryMode: 'DELIVERY_PARTNER' })}
                      className="text-blue-600"
                    />
                    <strong className="text-slate-900 font-bold">डिलीवरी पार्टनर</strong>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">खेत से सीधे आपके पते पर</span>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                    cartItem.deliveryMode === 'SELF_PICKUP'
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryMode"
                      checked={cartItem.deliveryMode === 'SELF_PICKUP'}
                      onChange={() => setCartItem({ ...cartItem, deliveryMode: 'SELF_PICKUP' })}
                      className="text-blue-600"
                    />
                    <strong className="text-slate-900 font-bold">स्वयं पिक-अप</strong>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold mt-1">निःशुल्क (₹0 डिलीवरी)</span>
                </label>
              </div>
            </div>

            {/* Delivery Address Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">डिलीवरी गंतव्य पता:</label>
              <input
                type="text"
                value={cartItem.destinationAddress}
                onChange={(e) => setCartItem({ ...cartItem, destinationAddress: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Strict Domain Rule R-001: Itemized Price Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h5 className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                मूल्य विवरण (Separated Price Breakdown - R-001)
              </h5>

              <div className="flex justify-between text-slate-700">
                <span>उपज मूल्य ({cartItem.quantity} किग्रा × ₹{cartItem.listing.askingPricePerKg}):</span>
                <span className="font-bold">₹{cartItem.quantity * cartItem.listing.askingPricePerKg}</span>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>डिलीवरी पार्टनर शुल्क:</span>
                <span className="font-bold">
                  {cartItem.deliveryMode === 'SELF_PICKUP' ? '₹0 (स्वयं पिक-अप)' : `₹${calculateDeliveryCharge()}`}
                </span>
              </div>

              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>प्लेटफ़ॉर्म कमीशन (0% Zero Fee):</span>
                <span>₹0 (निःशुल्क)</span>
              </div>

              <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-300 pt-2">
                <span>कुल देय राशि:</span>
                <span className="text-blue-700">
                  ₹{(cartItem.quantity * cartItem.listing.askingPricePerKg) + calculateDeliveryCharge()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCartItem(null)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                रद्द करें
              </button>
              <button
                type="button"
                disabled={isPlacingOrder}
                onClick={handlePlaceOrder}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                {isPlacingOrder ? 'ऑर्डर भेजा जा रहा है...' : 'ऑर्डर की पुष्टि करें →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
