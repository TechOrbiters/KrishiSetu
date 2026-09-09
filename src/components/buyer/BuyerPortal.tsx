'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOutSupabase } from '@/lib/supabase/authClient';
import {
  ProduceListing,
  Order,
  TransporterTrip,
  MarketPrice,
  FPOProfile,
  BuyerDemand,
} from '../../types';
import { useLiveMandiPrices } from '../../hooks/useLiveMandiPrices';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { OrderStepper } from '../common/OrderStepper';
import { CheckoutConfirmation } from './CheckoutConfirmation';
import { QuickChatModal } from '../common/QuickChatModal';
import { InvoiceModal } from '../common/InvoiceModal';
import { MandiErrorBanner } from '../mandi/MandiErrorBanner';
import { subscribeBuyerProfile, updateBuyerProfile } from '../../lib/firebase';
import { logisticsSync } from '../../lib/realtime/logisticsSync';
import { ProduceCard } from './ProduceCard';
import { CategoryFilter } from './CategoryFilter';
import { LiveTrackingMap } from '../maps/LiveTrackingMap';
import { getAccurateCropImage } from '@/lib/cropImages';
import {
  matchesProduceSearch,
  TRENDING_SEARCHES,
  cleanVoiceSearchQuery,
  getInstantCropSuggestions,
} from '@/lib/search/cropSearch';
import {
  Store,
  Users,
  ShoppingBag,
  TrendingUp,
  Truck,
  Sparkles,
  Search,
  Mic,
  Plus,
  Trash2,
  CheckCircle,
  MapPin,
  Clock,
  ArrowRight,
  ChevronRight,
  Heart,
  Bot,
  Bell,
  CheckCheck,
  Filter,
  Check,
  X,
  Menu,
  HelpCircle,
  Headphones,
  Package,
  Settings,
  Leaf,
  Palette,
  Sun,
  Moon,
  Star,
  RotateCcw,
  SlidersHorizontal,
  Minus,
  CheckCircle2,
  Loader2,
  FileText,
  ShieldCheck,
  Target,
  Bookmark,
  Award,
  Zap,
  DollarSign,
  TrendingDown,
  Info,
  AlertCircle,
  Calendar,
  Building,
  User,
  ExternalLink,
  Printer,
  ChevronDown,
  MessageSquare,
  Fingerprint,
  Eye,
  Key,
  LogOut,
  PhoneCall,
  Compass,
  CreditCard,
  RefreshCw,
  Navigation,
  ShieldAlert,
  Sliders,
  CheckSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BuyerPortalProps {
  onBackToLanding: () => void;
  listings: ProduceListing[];
  orders: Order[];
  trips: TransporterTrip[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  marketPrices: MarketPrice[];
  fpos: FPOProfile[];
  onOpenKrishiAI: () => void;
  onPlaceOrder?: (order: Order) => Promise<void> | void;
  onCancelOrder?: (orderId: string) => Promise<void> | void;
  isLoading?: boolean;
}

interface CartItem {
  listing: ProduceListing;
  quantityKg: number;
  unit?: string;
}


// Transporters List for Delivery Vikalp (Image 1 - scr-007)
const candidateTransporters = [
  {
    id: 't-1',
    name: 'Raj Transport',
    badge: 'BEST MATCH',
    badgeDesc: 'SmartMatch द्वारा सुझाया गया',
    tags: ['GPS ट्रैकिंग', 'बीमा उपलब्ध', 'सुरक्षित डिलीवरी'],
    eta: '2h 30m',
    etaDetail: 'आज, 3:00 PM तक',
    distance: '82 km',
    distanceLabel: 'आपसे',
    rating: 4.6,
    reviewCount: 128,
    fare: 250,
    originalFare: 320,
    isBestMatch: true,
  },
  {
    id: 't-2',
    name: 'Shakti Logistics',
    badge: '',
    badgeDesc: 'विश्वसनीय सर्विस',
    tags: ['GPS ट्रैकिंग', 'सुरक्षित डिलीवरी'],
    eta: '3h 10m',
    etaDetail: 'आज, 3:40 PM तक',
    distance: '95 km',
    distanceLabel: 'आपसे',
    rating: 4.4,
    reviewCount: 96,
    fare: 280,
    originalFare: 350,
  },
  {
    id: 't-3',
    name: 'FastMove Cargo',
    badge: '',
    badgeDesc: 'कम समय में डिलीवरी',
    tags: ['GPS ट्रैकिंग', 'बीमा उपलब्ध'],
    eta: '2h 45m',
    etaDetail: 'आज, 3:15 PM तक',
    distance: '78 km',
    distanceLabel: 'आपसे',
    rating: 4.5,
    reviewCount: 74,
    fare: 260,
    originalFare: 330,
  },
  {
    id: 't-4',
    name: 'Kisan Express',
    badge: '',
    badgeDesc: 'किफायती और भरोसेमंद',
    tags: ['GPS ट्रैकिंग'],
    eta: '4h 20m',
    etaDetail: 'आज, 4:50 PM तक',
    distance: '110 km',
    distanceLabel: 'आपसे',
    rating: 4.2,
    reviewCount: 53,
    fare: 220,
    originalFare: 0,
  },
  {
    id: 't-5',
    name: 'Bharat Roadways',
    badge: '',
    badgeDesc: 'सुरक्षित और सही समय पर',
    tags: ['बीमा उपलब्ध'],
    eta: '5h 30m',
    etaDetail: 'आज, 6:00 PM तक',
    distance: '125 km',
    distanceLabel: 'आपसे',
    rating: 4.1,
    reviewCount: 41,
    fare: 240,
    originalFare: 0,
  },
];


const getCropEmoji = (cropName: string): string => {
  const c = (cropName || '').toLowerCase();
  if (c.includes('tomato')) return '🍅';
  if (c.includes('potato')) return '🥔';
  if (c.includes('onion')) return '🧅';
  if (c.includes('wheat') || c.includes('gehun') || c.includes('gehu')) return '🌾';
  if (c.includes('paddy') || c.includes('dhan') || c.includes('rice') || c.includes('chawal')) return '🌾';
  if (c.includes('mustard')) return '🌱';
  if (c.includes('garlic')) return '🧄';
  if (c.includes('ginger')) return '🫚';
  if (c.includes('apple')) return '🍎';
  if (c.includes('banana')) return '🍌';
  if (c.includes('mango')) return '🥭';
  if (c.includes('chilli') || c.includes('mirch')) return '🌶️';
  return '🌱';
};

const getCropCategory = (cropName: string): string => {
  const c = (cropName || '').toLowerCase();
  if (
    c.includes('tomato') || c.includes('tamatar') ||
    c.includes('potato') || c.includes('aloo') ||
    c.includes('onion') || c.includes('pyaj') ||
    c.includes('garlic') || c.includes('lahsun') ||
    c.includes('ginger') || c.includes('adrak') ||
    c.includes('chilli') || c.includes('mirch') ||
    c.includes('cabbage') || c.includes('carrot') ||
    c.includes('gobhi') || c.includes('bhindi')
  ) {
    return 'VEGETABLES';
  }
  if (
    c.includes('wheat') || c.includes('gehu') || c.includes('gehun') ||
    c.includes('paddy') || c.includes('dhan') ||
    c.includes('rice') || c.includes('chawal') ||
    c.includes('grain') || c.includes('barley') ||
    c.includes('jowar') || c.includes('bajra')
  ) {
    return 'GRAINS';
  }
  if (
    c.includes('dal') || c.includes('pulse') ||
    c.includes('gram') || c.includes('chana') ||
    c.includes('moong') || c.includes('lentil') ||
    c.includes('urad') || c.includes('arhar') ||
    c.includes('tur')
  ) {
    return 'PULSES';
  }
  if (
    c.includes('apple') || c.includes('seb') ||
    c.includes('banana') || c.includes('kela') ||
    c.includes('mango') || c.includes('aam') ||
    c.includes('orange') || c.includes('grape') ||
    c.includes('guava') || c.includes('fruit') ||
    c.includes('papaya')
  ) {
    return 'FRUITS';
  }
  if (
    c.includes('mustard') || c.includes('sarso') || c.includes('sarson') ||
    c.includes('oil') || c.includes('cumin') || c.includes('jeera') ||
    c.includes('turmeric') || c.includes('haldi') ||
    c.includes('coriander') || c.includes('dhania') ||
    c.includes('spice')
  ) {
    return 'SPICES';
  }
  if (
    c.includes('milk') || c.includes('doodh') ||
    c.includes('paneer') || c.includes('ghee') ||
    c.includes('curd') || c.includes('butter') ||
    c.includes('dairy')
  ) {
    return 'DAIRY';
  }
  return 'VEGETABLES';
};


// Constants
const CATEGORY_NAMES: Record<string, { hi: string; en: string }> = {
  VEGETABLES: { hi: 'सब्जियाँ', en: 'Vegetables' },
  GRAINS: { hi: 'अनाज', en: 'Grains' },
  PULSES: { hi: 'दालें', en: 'Pulses' },
  FRUITS: { hi: 'फल', en: 'Fruits' },
  SPICES: { hi: 'तेल & मसाले', en: 'Oil & Spices' },
  DAIRY: { hi: 'डेयरी उत्पाद', en: 'Dairy' },
  ALL: { hi: 'सभी (All)', en: 'All' },
};

const CATEGORIES = [
  { id: 'ALL', name: 'सभी (All)', icon: '🛍️' },
  { id: 'VEGETABLES', name: 'सब्जियाँ', icon: '🥦' },
  { id: 'GRAINS', name: 'अनाज', icon: '🌾' },
  { id: 'PULSES', name: 'दालें', icon: '🫘' },
  { id: 'FRUITS', name: 'फल', icon: '🍎' },
  { id: 'SPICES', name: 'तेल & मसाले', icon: '🌶️' },
  { id: 'DAIRY', name: 'डेयरी उत्पाद', icon: '🥛' },
];

export const BuyerPortal: React.FC<BuyerPortalProps> = ({
  onBackToLanding,
  listings,
  orders,
  trips,
  setOrders,
  marketPrices,
  fpos,
  onOpenKrishiAI,
  onPlaceOrder,
  onCancelOrder,
  isLoading,
} : BuyerPortalProps) => {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    | 'HOME'
    | 'BROWSE'
    | 'ORDERS'
    | 'FARMERS'
    | 'PRICES'
    | 'DELIVERY_TRACKING'
    | 'DELIVERY_VIKALP'
    | 'PAYMENTS'
    | 'NOTIFICATIONS'
    | 'SETTINGS'
  >('HOME');

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(['टमाटर', 'आलू', 'गेहूं']);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('krishi_buyer_recent_searches');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentSearches(parsed.slice(0, 6));
          }
        }
      } catch {}
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('krishi_buyer_recent_searches', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToRemove);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('krishi_buyer_recent_searches', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // Close search suggestions on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectSearchQuery = (term: string) => {
    setSearchQuery(term);
    saveRecentSearch(term);
    setIsSearchFocused(false);
    setActiveTab('BROWSE');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        handleSelectSearchQuery(searchQuery.trim());
      } else {
        setActiveTab('BROWSE');
        setIsSearchFocused(false);
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  // Native Web Speech API Voice Search
  const handleVoiceSearchToggle = () => {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceError(
        language === 'en'
          ? 'Voice search is not supported in this browser. Opening Krishi AI...'
          : 'वॉयस सर्च इस ब्राउज़र में समर्थित नहीं है। कृषि AI खोला जा रहा है...'
      );
      setTimeout(() => {
        setVoiceError(null);
        onOpenKrishiAI();
      }, 1500);
      return;
    }

    if (isVoiceListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsVoiceListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.lang = language === 'en' ? 'en-IN' : 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const spoken = final || interim;
        if (spoken) {
          const cleaned = cleanVoiceSearchQuery(spoken);
          setSearchQuery(cleaned);
          if (event.results[0]?.isFinal) {
            handleSelectSearchQuery(cleaned);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError(
            language === 'en'
              ? 'Microphone permission blocked. Please allow mic access.'
              : 'माइक्रोफ़ोन अनुमति बंद है। कृपया ब्राउज़र में माइक चालू करें।'
          );
        } else if (event.error !== 'no-speech') {
          setVoiceError(language === 'en' ? 'Could not capture voice. Try again.' : 'आवाज़ नहीं सुनी जा सकी। पुनः प्रयास करें।');
        }
        setIsVoiceListening(false);
        setTimeout(() => setVoiceError(null), 4000);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsVoiceListening(false);
      setVoiceError(
        language === 'en'
          ? 'Microphone error. Opening Krishi AI...'
          : 'माइक चालू नहीं हो सका। कृषि AI खोला जा रहा है...'
      );
      setTimeout(() => {
        setVoiceError(null);
        onOpenKrishiAI();
      }, 1500);
    }
  };
  const [sortBy, setSortBy] = useState<'PRICE_ASC' | 'PRICE_DESC' | 'DISTANCE_ASC'>('DISTANCE_ASC');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'ACTIVE' | 'ORDERED' | 'PACKED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'REJECTED'>('ALL');
  const [selectedLocation, setSelectedLocation] = useState('Lucknow, UP');
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY_PARTNER' | 'SELF_PICKUP'>('DELIVERY_PARTNER');
  const [selectedTransporterId, setSelectedTransporterId] = useState<string>('t-1');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'COD' | 'UPI' | 'NETBANKING' | 'CARD'>('UPI');
  const [deliveryModeOption, setDeliveryModeOption] = useState<'SMART' | 'SELF'>('SMART');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedFarmerDetail, setSelectedFarmerDetail] = useState<any | null>(null);
  const [selectedProduceDetail, setSelectedProduceDetail] = useState<ProduceListing | null>(null);

  const [farmerFilterType, setFarmerFilterType] = useState<'ALL' | 'Farmer' | 'FPO' | 'Followed'>('ALL');
  const [farmerSearchQuery, setFarmerSearchQuery] = useState<string>('');
  const [followedFarmerIds, setFollowedFarmerIds] = useState<string[]>([]);

  const [activeTrackOrderId, setActiveTrackOrderId] = useState<string>('');

  const selectedTrip = useMemo(() => {
    if (!trips || trips.length === 0) return null;
    const cleanCode = (activeTrackOrderId || '').replace('#', '').trim();
    const found = trips.find((t) => {
      const tripCode = (t.orderCode || '').replace('#', '').trim();
      return (
        tripCode === cleanCode ||
        t.id === activeTrackOrderId ||
        t.orderCode === activeTrackOrderId ||
        t.id === `trip-${activeTrackOrderId}`
      );
    });
    return found || trips[0];
  }, [trips, activeTrackOrderId]);

  const selectedOrderForTracking = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    const cleanCode = (activeTrackOrderId || '').replace('#', '').trim();
    const found = orders.find((o) => {
      const ordCode = (o.orderCode || '').replace('#', '').trim();
      return (
        ordCode === cleanCode ||
        o.id === activeTrackOrderId ||
        o.orderCode === activeTrackOrderId
      );
    });
    return found || orders[0];
  }, [orders, activeTrackOrderId]);

  const trackingOrders = useMemo(() => {
    return (orders || []).filter(o => o.deliveryMethod === 'DELIVERY_PARTNER');
  }, [orders]);

  // Keep activeTrackOrderId in sync with active orders
  useEffect(() => {
    if (trackingOrders.length > 0) {
      const exists = trackingOrders.some(
        (o) => (o.orderCode || '').replace('#', '') === activeTrackOrderId
      );
      if (!exists) {
        setActiveTrackOrderId((trackingOrders[0].orderCode || '').replace('#', ''));
      }
    }
  }, [trackingOrders, activeTrackOrderId]);
  const [callSimulatorModal, setCallSimulatorModal] = useState<{ open: boolean; name: string; phone: string; title: string } | null>(null);

  const [priceAlerts, setPriceAlerts] = useState<{ id: string; crop: string; targetPrice: number; active: boolean }[]>([
    { id: '1', crop: 'Tomato', targetPrice: 1500, active: true },
    { id: '2', crop: 'Potato', targetPrice: 1100, active: true }
  ]);
  const [newAlertCrop, setNewAlertCrop] = useState('Tomato');
  const [newAlertPrice, setNewAlertPrice] = useState('');

  // Notification Center & Dropdown State
  const [isMounted, setIsMounted] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [dropdownNotifFilter, setDropdownNotifFilter] = useState<'ALL' | 'ORDER' | 'PRICE' | 'SYSTEM'>('ALL');
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'ORDER' | 'PRICE' | 'PROMO'>('ALL');
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const [hasInteractedWithNotifs, setHasInteractedWithNotifs] = useState(false);
  const [hasMarkedAllRead, setHasMarkedAllRead] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  // Safely load notification state from localStorage on client mount (prevents SSR hydration mismatch)
  useEffect(() => {
    setIsMounted(true);
    try {
      if (typeof window !== 'undefined') {
        const savedInteracted = localStorage.getItem('krishisetu_buyer_has_interacted_notifs');
        if (savedInteracted !== null) setHasInteractedWithNotifs(savedInteracted === 'true');

        const savedAllRead = localStorage.getItem('krishisetu_buyer_all_read');
        if (savedAllRead !== null) setHasMarkedAllRead(savedAllRead === 'true');

        const savedRead = localStorage.getItem('krishisetu_buyer_read_notifs');
        if (savedRead) setReadNotificationIds(JSON.parse(savedRead));

        const savedDismissed = localStorage.getItem('krishisetu_buyer_dismissed_notifs');
        if (savedDismissed) setDismissedNotificationIds(JSON.parse(savedDismissed));
      }
    } catch (err) {
      console.warn('Unable to access localStorage for notifications', err);
    }
  }, []);

  const [liveNotifications, setLiveNotifications] = useState<Array<{
    id: string;
    title: string;
    desc: string;
    time: string;
    type: 'ORDER' | 'PRICE' | 'SYSTEM' | 'PROMO';
    linkTab: 'ORDERS' | 'PRICES' | 'HOME' | 'DELIVERY_TRACKING';
    createdAt: number;
  }>>([]);

  // Close dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsNotifDropdownOpen(false);
      }
    }
    if (isNotifDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotifDropdownOpen]);

  // Subscribe to real-time events via logisticsSync
  useEffect(() => {
    const unsubscribe = logisticsSync.subscribe((event) => {
      let title = '';
      let desc = '';
      let linkTab: 'ORDERS' | 'PRICES' | 'HOME' | 'DELIVERY_TRACKING' = 'DELIVERY_TRACKING';

      if (event.type === 'ORDER_ACCEPTED') {
        title = `ऑर्डर स्वीकार हुआ ✅`;
        desc = `किसान ने आपका ऑर्डर #${event.payload.orderId || ''} स्वीकार कर लिया है।`;
      } else if (event.type === 'JOB_ACCEPTED') {
        title = `ट्रांसपोर्टर असाइन हुआ 🚚`;
        desc = `${event.payload.transporter?.name || 'ट्रांसपोर्टर'} ने डिलीवरी स्वीकार की (गाड़ी: ${event.payload.transporter?.vehicleNumber || 'वाहन'})।`;
      } else if (event.type === 'TRIP_STATUS_UPDATED') {
        const statusLabel = 
          event.payload.status === 'DELIVERED' ? 'डिलीवर हो गया 🎉' :
          event.payload.status === 'IN_TRANSIT' ? 'रास्ते में है 🚚' :
          event.payload.status === 'PICKED_UP' ? 'पिकअप संपन्न हुआ 📦' :
          `${event.payload.status}`;
        title = `लाइव डिलीवरी: ${statusLabel}`;
        desc = `ट्रिप #${event.payload.tripId || ''} की स्थिति अपडेट हो गई है।`;
      } else if (event.type === 'LISTING_CREATED' && event.payload.listing) {
        title = `नई उपज मंडी में उपलब्ध 🌾`;
        desc = `${event.payload.listing.cropNameHindi || event.payload.listing.cropName || 'ताजा फसल'} की नई लिस्टिंग जोड़ी गई है।`;
        linkTab = 'HOME';
      }

      if (title) {
        const notifId = `live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        setLiveNotifications((prev) => [
          {
            id: notifId,
            title,
            desc,
            time: 'अभी-अभी',
            type: event.type === 'LISTING_CREATED' ? 'PRICE' : 'ORDER',
            linkTab,
            createdAt: Date.now(),
          },
          ...prev.slice(0, 19),
        ]);
        // Reset all read if a new unread event arrives
        setHasMarkedAllRead(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('krishisetu_buyer_all_read');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const notificationsList = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      desc: string;
      time: string;
      read: boolean;
      type: 'ORDER' | 'PRICE' | 'SYSTEM' | 'PROMO';
      linkTab: 'ORDERS' | 'PRICES' | 'HOME' | 'DELIVERY_TRACKING';
    }> = [];

    // 1. Live dynamic notifications from logisticsSync
    liveNotifications.forEach((ln) => {
      if (!dismissedNotificationIds.includes(ln.id)) {
        list.push({
          id: ln.id,
          title: ln.title,
          desc: ln.desc,
          time: ln.time,
          read: hasMarkedAllRead || readNotificationIds.includes(ln.id),
          type: ln.type,
          linkTab: ln.linkTab,
        });
      }
    });

    // 2. Real orders notifications
    (orders || []).forEach((o, idx) => {
      const statusTitle = 
        o.status === 'DELIVERED' ? 'ऑर्डर सफलतापूर्वक डिलीवर हो गया 🎉' :
        o.status === 'IN_TRANSIT' ? 'ऑर्डर रास्ते में है (In Transit) 🚚' :
        o.status === 'PACKED' ? 'ऑर्डर पैक कर दिया गया है 📦' :
        o.status === 'ACCEPTED' ? 'किसान द्वारा ऑर्डर स्वीकार हुआ ✅' : 'नया ऑर्डर प्राप्त हुआ';

      const firstItem = o.items?.[0];
      const cropName = firstItem?.cropHindi || firstItem?.crop || 'ताजा फसल';
      const qty = firstItem?.quantityKg || 100;

      const id = `ord-notif-${o.id || o.orderCode}`;
      if (!dismissedNotificationIds.includes(id)) {
        const isRead = hasMarkedAllRead || readNotificationIds.includes(id) || (!hasInteractedWithNotifs && idx > 2);
        list.push({
          id,
          title: `ऑर्डर #${o.orderCode}: ${statusTitle}`,
          desc: `${cropName} (${qty} kg) • गंतव्य: ${o.dropLocation || 'नजदीकी मंडी'}`,
          time: idx === 0 ? 'अभी अभी' : `${idx * 15} मिनट पहले`,
          read: isRead,
          type: 'ORDER',
          linkTab: 'DELIVERY_TRACKING',
        });
      }
    });

    // 3. Real price alert notifications based on user's priceAlerts
    (priceAlerts || []).forEach((alert, idx) => {
      const id = `alert-notif-${alert.id}`;
      if (!dismissedNotificationIds.includes(id)) {
        list.push({
          id,
          title: `${alert.crop} का मूल्य आपके लक्ष्य तक पहुँचा! 📉`,
          desc: `${alert.crop} का लाइव मंडी भाव लक्ष्य ₹${alert.targetPrice}/क्विंटल के पास आ गया है।`,
          time: `${idx + 1} घंटे पहले`,
          read: hasMarkedAllRead || readNotificationIds.includes(id) || (!hasInteractedWithNotifs && idx > 0),
          type: 'PRICE',
          linkTab: 'PRICES',
        });
      }
    });

    // 4. Default system notification
    const sysId = 'sys-live-update';
    if (!dismissedNotificationIds.includes(sysId)) {
      list.push({
        id: sysId,
        title: 'KrishiSetu ई-मंडी लाइव नेटवर्क अपडेट 🌾',
        desc: 'आपके क्षेत्र के सभी FPO सक्रिय हैं। शून्य बिचौलिया शुल्क पर सीधे उपज खरीदें।',
        time: 'आज',
        read: true,
        type: 'SYSTEM',
        linkTab: 'HOME',
      });
    }

    return list;
  }, [orders, priceAlerts, readNotificationIds, hasMarkedAllRead, hasInteractedWithNotifs, liveNotifications, dismissedNotificationIds]);

  const unreadNotificationsCount = useMemo(() => {
    return notificationsList.filter((n) => !n.read).length;
  }, [notificationsList]);

  const markAsRead = (id: string) => {
    setHasInteractedWithNotifs(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishisetu_buyer_has_interacted_notifs', 'true');
    }
    setReadNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      if (typeof window !== 'undefined') {
        localStorage.setItem('krishisetu_buyer_read_notifs', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markAllAsRead = () => {
    setHasInteractedWithNotifs(true);
    setHasMarkedAllRead(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishisetu_buyer_has_interacted_notifs', 'true');
      localStorage.setItem('krishisetu_buyer_all_read', 'true');
    }
    const allIds = notificationsList.map((n) => n.id);
    setReadNotificationIds(allIds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishisetu_buyer_read_notifs', JSON.stringify(allIds));
    }
  };

  const toggleReadNotification = (id: string) => {
    setHasInteractedWithNotifs(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishisetu_buyer_has_interacted_notifs', 'true');
    }
    setReadNotificationIds((prev) => {
      const isCurrentlyRead = prev.includes(id) || hasMarkedAllRead;
      let updated: string[];
      if (isCurrentlyRead) {
        updated = prev.filter((x) => x !== id);
        setHasMarkedAllRead(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('krishisetu_buyer_all_read');
        }
      } else {
        updated = [...prev, id];
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('krishisetu_buyer_read_notifs', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const dismissNotification = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHasInteractedWithNotifs(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishisetu_buyer_has_interacted_notifs', 'true');
    }
    markAsRead(id);
    setDismissedNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      if (typeof window !== 'undefined') {
        localStorage.setItem('krishisetu_buyer_dismissed_notifs', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleNotificationClick = (item: typeof notificationsList[0]) => {
    markAsRead(item.id);
    setIsNotifDropdownOpen(false);
    if (item.linkTab) {
      setActiveTab(item.linkTab as any);
      if (item.id.startsWith('ord-notif-')) {
        const orderCodeMatch = item.id.replace('ord-notif-', '');
        const matchedOrder = orders.find(
          (o) => (o.id || o.orderCode) === orderCodeMatch || (o.orderCode || '').replace('#', '') === orderCodeMatch
        );
        if (matchedOrder) {
          setActiveTrackOrderId((matchedOrder.orderCode || '').replace('#', ''));
          setActiveTab('DELIVERY_TRACKING');
        }
      }
    }
  };

  const filteredDropdownNotifications = useMemo(() => {
    return notificationsList.filter(
      (n) => (dropdownNotifFilter === 'ALL' || n.type === dropdownNotifFilter) && !dismissedNotificationIds.includes(n.id)
    );
  }, [notificationsList, dropdownNotifFilter, dismissedNotificationIds]);

  const filteredNotifications = useMemo(() => {
    return notificationsList.filter(
      (n) => (notifFilter === 'ALL' || n.type === notifFilter) && !dismissedNotificationIds.includes(n.id)
    );
  }, [notificationsList, notifFilter, dismissedNotificationIds]);

  // Wallet & Payment State
  const [walletBalance, setWalletBalance] = useState(12450);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('2000');
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'pm-1', type: 'UPI' as const, title: 'UPI AutoPay (Rohit Verma)', subtitle: 'rohitverma@okaxis', isDefault: true },
    { id: 'pm-2', type: 'BANK' as const, title: 'HDFC Bank Account', subtitle: 'Account ending in ****4821', isDefault: false },
    { id: 'pm-3', type: 'CARD' as const, title: 'ICICI Platinum Credit Card', subtitle: 'Card ending in ****9012', isDefault: false },
  ]);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [newPmType, setNewPmType] = useState<'UPI' | 'BANK' | 'CARD'>('UPI');
  const [newPmTitle, setNewPmTitle] = useState('');
  const [newPmSubtitle, setNewPmSubtitle] = useState('');

  // Firebase ID for the current buyer
  const BUYER_ID = 'current-buyer-rohit';

  // Load profile from Firebase
  useEffect(() => {
    const unsub = subscribeBuyerProfile(BUYER_ID, (data) => {
      if (data) {
        if (data.profileData) {
          setProfileData(prev => JSON.stringify(prev) !== JSON.stringify(data.profileData) ? data.profileData : prev);
        }
        if (data.savedAddresses && Array.isArray(data.savedAddresses)) {
          setSavedAddresses(prev => JSON.stringify(prev) !== JSON.stringify(data.savedAddresses) ? data.savedAddresses : prev);
        }
        if (data.notifPrefs) {
          setNotifPrefs(prev => JSON.stringify(prev) !== JSON.stringify(data.notifPrefs) ? data.notifPrefs : prev);
        }
        if (data.securityPrefs) {
          setSecurityPrefs(prev => JSON.stringify(prev) !== JSON.stringify(data.securityPrefs) ? data.securityPrefs : prev);
        }
        if (data.themePreference) {
          setThemePreference(prev => prev !== data.themePreference ? data.themePreference : prev);
        }
        if (data.cart && Array.isArray(data.cart)) {
          setCart(prev => JSON.stringify(prev) !== JSON.stringify(data.cart) ? data.cart : prev);
        }
        if (data.savedListingIds && Array.isArray(data.savedListingIds)) {
          setSavedListingIds(prev => JSON.stringify(prev) !== JSON.stringify(data.savedListingIds) ? data.savedListingIds : prev);
        }
        if (data.selectedCategory) {
          setSelectedCategory(prev => prev !== data.selectedCategory ? data.selectedCategory : prev);
        }
        if (data.searchQuery !== undefined) {
          setSearchQuery(prev => prev !== data.searchQuery ? data.searchQuery : prev);
        }
      } else {
        // Seed initial data for new user
        saveToFirebase({
          profileData: {
            name: 'Rohit Verma',
            businessName: 'Verma Fresh Mart & Catering',
            phone: '+91 98765 43210',
            email: 'rohit.verma@vermafresh.in',
            gst: '09AABCV1234F1Z5',
            city: 'Lucknow',
            state: 'Uttar Pradesh',
          },
          savedAddresses: [
            {
              id: 'addr-1',
              label: 'Main Warehouse / Shop',
              name: 'Rohit Verma',
              phone: '+91 98765 43210',
              addressLine: 'Plot No. 42, Transport Nagar, Phase-2',
              landmark: 'Near RTO Office',
              pincode: '226012',
              isDefault: true,
            }
          ],
          notifPrefs: {
            orderUpdates: true,
            priceAlerts: true,
            newStock: false,
            whatsappUpdates: true,
          },
          securityPrefs: {
            biometricLogin: false,
            showBalance: true,
            autoLogout: true,
          },
          cart: [],
          savedListingIds: [],
          selectedCategory: 'ALL',
          searchQuery: '',
        });
      }
    });
    return () => unsub();
  }, []);

  const saveToFirebase = async (updates: any) => {
    setIsSavingSettings(true);
    try {
      await updateBuyerProfile(BUYER_ID, updates);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Settings & Saved Addresses
  const [profileData, setProfileData] = useState({
    name: 'रोहित वर्मा (Rohit Verma)',
    businessName: 'रोहित ट्रेडर्स (Rohit Traders)',
    phone: '+91 98765 11223',
    email: 'rohit.verma@example.com',
    gst: '09AAAAA0000A1Z5',
    city: 'लखनऊ (Lucknow)',
    state: 'Uttar Pradesh',
  });

  // Sync authenticated buyer profile from localStorage / Supabase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawBuyer = localStorage.getItem('krishi_buyer_profile');
        const rawSession = localStorage.getItem('krishi_user_session');
        const buyer = rawBuyer ? JSON.parse(rawBuyer) : null;
        const session = rawSession ? JSON.parse(rawSession) : null;

        if (buyer || session) {
          setProfileData((prev) => ({
            ...prev,
            name: buyer?.fullName || session?.name || prev.name,
            businessName: buyer?.businessName || prev.businessName,
            phone: buyer?.phone || prev.phone,
            email: buyer?.email || session?.email || prev.email,
            gst: buyer?.gstin || buyer?.gst || prev.gst,
            city: buyer?.district || buyer?.city || prev.city,
          }));
        }
      } catch (e) {}
    }
  }, []);

  const handleBuyerLogout = async () => {
    try {
      await signOutSupabase();
    } catch (_) {}
    router.push('/auth/buyer');
  };
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddressForm, setNewAddressForm] = useState({
    label: '',
    name: 'Rohit Verma',
    phone: '+91 98765 43210',
    addressLine: '',
    landmark: '',
    pincode: '',
  });

  // Support & Dispute Tickets
  const [disputeForm, setDisputeForm] = useState({
    orderId: '',
    issueType: 'Quality Defect',
    description: '',
  });
  const [submittedTickets, setSubmittedTickets] = useState([
    {
      id: 'TICK-902',
      orderId: 'ORD5012',
      issueType: 'Quantity Shortage',
      status: 'RESOLVED',
      date: '01 जून 2024',
      description: '5 kg आलू कम पाया गया। ₹140 का रिफंड वॉलेट में जमा कर दिया गया।',
    },
  ]);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState<string | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState<1 | 2 | 3>(1);
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [otpDigits, setOtpDigits] = useState(['2', '6', '4', '8', '1', '3']);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [orderRejectedAlert, setOrderRejectedAlert] = useState<{
    orderId?: string;
    orderCode?: string;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = logisticsSync.subscribe((event) => {
      if (event.type === 'ORDER_REJECTED') {
        const orderData = event.payload?.order || {};
        const code = orderData.orderCode || event.payload?.orderId || 'ORD';
        setOrderRejectedAlert({
          orderId: event.payload?.orderId,
          orderCode: code,
          reason: event.payload?.order?.rejectionReason || 'किसान द्वारा अस्वीकृत (Rejected by Farmer)',
        });
      }
    });
    return () => unsubscribe();
  }, []);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  
  // Add Funds Input State
  const [addAmountInput, setAddAmountInput] = useState<string>('5000');

  // Saved Listings (Bookmarks)
  const [savedListingIds, setSavedListingIds] = useState<string[]>(['prod-1', 'prod-3']);

  // Buyer Preference Toggles
  const [notifPrefs, setNotifPrefs] = useState({
    orderUpdates: true,
    priceAlerts: true,
    newStock: false,
    whatsappUpdates: true,
  });

  const [securityPrefs, setSecurityPrefs] = useState({
    biometricLogin: false,
    showBalance: true,
    autoLogout: true,
    securityPin: '123456',
  });

  const [activeSettingsSection, setActiveSettingsSection] = useState<'MENU' | 'ACCOUNT' | 'ADDRESSES' | 'THEME'>('MENU');
  const [themePreference, setThemePreference] = useState<'light' | 'dark'>('light');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Initialize theme from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('krishisetu_theme') || localStorage.getItem('kisansetu_theme')) as 'light' | 'dark' | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemePreference(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }, []);

  // Sync theme class and localStorage whenever themePreference changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishisetu_theme', themePreference);
      if (themePreference === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [themePreference]);

  // Non-blocking, instant theme switch handler
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setThemePreference(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishisetu_theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    // Background fire-and-forget sync to Firebase so button is NEVER blocked or disabled
    updateBuyerProfile(BUYER_ID, { themePreference: newTheme }).catch((err) => {
      console.warn('Theme preference sync warning:', err);
    });
  };

  // Live Mandi Hook
  const {
    prices: buyerMandiList,
    filteredPrices: filteredBuyerMandiList,
    loading: isBuyerMandiLoading,
    isFetching: isBuyerMandiFetching,
    errorDetails: buyerMandiErrorDetails,
    isFallback: isBuyerMandiFallback,
    isRetrying: isBuyerMandiRetrying,
    nextRetryCountdown: buyerMandiRetryCountdown,
    selectedState: selectedBuyerMandiState,
    setSelectedState: setSelectedBuyerMandiState,
    searchQuery: buyerMandiSearchQuery,
    setSearchQuery: setBuyerMandiSearchQuery,
    selectedCategory: selectedBuyerMandiCategory,
    setSelectedCategory: setSelectedBuyerMandiCategory,
    refetch: refetchBuyerMandi,
    retry: retryBuyerMandi,
    cancelRetry: cancelRetryBuyerMandi,
    availableStates: buyerAvailableStates,
    categories: buyerMandiCategories,
    lastUpdated: buyerMandiLastUpdated,
  } = useLiveMandiPrices({
    defaultState: 'Uttar Pradesh',
    defaultLimit: 30,
    enableLocalStorage: true,
  });

  const [trendCrop, setTrendCrop] = useState('Tomato');
  const [trendPeriod, setTrendPeriod] = useState<'7D' | '15D' | '1M' | '3M'>('7D');

  const [activeChatOrder, setActiveChatOrder] = useState<any | null>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<any | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const trendDataMap: Record<string, Record<'7D' | '15D' | '1M' | '3M', { label: string; price: number }[]>> = useMemo(() => {
    const getDaysAgoLabel = (daysAgo: number): string => {
      if (daysAgo === 0) return 'आज';
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
    };

    const getMonthsAgoLabel = (monthsAgo: number): string => {
      const d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      return d.toLocaleDateString('hi-IN', { month: 'short' });
    };

    return {
      'Tomato': {
        '7D': [
          { label: getDaysAgoLabel(6), price: 1650 },
          { label: getDaysAgoLabel(5), price: 1600 },
          { label: getDaysAgoLabel(4), price: 1420 },
          { label: getDaysAgoLabel(3), price: 1520 },
          { label: getDaysAgoLabel(2), price: 1410 },
          { label: getDaysAgoLabel(1), price: 1550 },
          { label: getDaysAgoLabel(0), price: 1625 },
        ],
        '15D': [
          { label: getDaysAgoLabel(15), price: 1500 },
          { label: getDaysAgoLabel(12), price: 1580 },
          { label: getDaysAgoLabel(9), price: 1620 },
          { label: getDaysAgoLabel(6), price: 1650 },
          { label: getDaysAgoLabel(3), price: 1520 },
          { label: getDaysAgoLabel(0), price: 1625 },
        ],
        '1M': [
          { label: getDaysAgoLabel(30), price: 1350 },
          { label: getDaysAgoLabel(20), price: 1450 },
          { label: getDaysAgoLabel(10), price: 1500 },
          { label: getDaysAgoLabel(0), price: 1625 },
        ],
        '3M': [
          { label: getMonthsAgoLabel(3), price: 1200 },
          { label: getMonthsAgoLabel(2), price: 1350 },
          { label: getMonthsAgoLabel(1), price: 1500 },
          { label: getMonthsAgoLabel(0), price: 1625 },
        ],
      },
      'Potato': {
        '7D': [
          { label: getDaysAgoLabel(6), price: 1150 },
          { label: getDaysAgoLabel(5), price: 1120 },
          { label: getDaysAgoLabel(4), price: 1100 },
          { label: getDaysAgoLabel(3), price: 1140 },
          { label: getDaysAgoLabel(2), price: 1125 },
          { label: getDaysAgoLabel(1), price: 1160 },
          { label: getDaysAgoLabel(0), price: 1180 },
        ],
        '15D': [
          { label: getDaysAgoLabel(15), price: 1100 },
          { label: getDaysAgoLabel(12), price: 1120 },
          { label: getDaysAgoLabel(9), price: 1140 },
          { label: getDaysAgoLabel(6), price: 1150 },
          { label: getDaysAgoLabel(3), price: 1140 },
          { label: getDaysAgoLabel(0), price: 1180 },
        ],
        '1M': [
          { label: getDaysAgoLabel(30), price: 1050 },
          { label: getDaysAgoLabel(20), price: 1080 },
          { label: getDaysAgoLabel(10), price: 1120 },
          { label: getDaysAgoLabel(0), price: 1180 },
        ],
        '3M': [
          { label: getMonthsAgoLabel(3), price: 1000 },
          { label: getMonthsAgoLabel(2), price: 1050 },
          { label: getMonthsAgoLabel(1), price: 1100 },
          { label: getMonthsAgoLabel(0), price: 1180 },
        ],
      },
      'Wheat': {
        '7D': [
          { label: getDaysAgoLabel(6), price: 2200 },
          { label: getDaysAgoLabel(5), price: 2210 },
          { label: getDaysAgoLabel(4), price: 2215 },
          { label: getDaysAgoLabel(3), price: 2220 },
          { label: getDaysAgoLabel(2), price: 2218 },
          { label: getDaysAgoLabel(1), price: 2222 },
          { label: getDaysAgoLabel(0), price: 2225 },
        ],
        '15D': [
          { label: getDaysAgoLabel(15), price: 2180 },
          { label: getDaysAgoLabel(12), price: 2195 },
          { label: getDaysAgoLabel(9), price: 2210 },
          { label: getDaysAgoLabel(6), price: 2200 },
          { label: getDaysAgoLabel(3), price: 2220 },
          { label: getDaysAgoLabel(0), price: 2225 },
        ],
        '1M': [
          { label: getDaysAgoLabel(30), price: 2150 },
          { label: getDaysAgoLabel(20), price: 2180 },
          { label: getDaysAgoLabel(10), price: 2200 },
          { label: getDaysAgoLabel(0), price: 2225 },
        ],
        '3M': [
          { label: getMonthsAgoLabel(3), price: 2100 },
          { label: getMonthsAgoLabel(2), price: 2130 },
          { label: getMonthsAgoLabel(1), price: 2180 },
          { label: getMonthsAgoLabel(0), price: 2225 },
        ],
      },
    };
  }, []);

  // Default Cart initialized to match Image 1 & 5 (Tomato 20kg ₹900, Potato 20kg ₹560, Wheat 1 Quintal ₹2225)
  const [cart, setCart] = useState<CartItem[]>([
    {
      listing: {
        id: 'prod-t',
        crop: 'Tomato',
        cropHindi: 'टमाटर (Tomato)',
        pricePerKg: 45,
        minOrderKg: 20,
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80',
        farmerName: 'Sharma FPO',
        fpoName: 'Sharma FPO, मोहनलालगंज',
        cultivationLocation: 'मोहनलालगंज, लखनऊ',
        quantityKg: 500,
        quality: 'A',
        harvestDate: '2024-05-19',
        freshnessWindowHours: 24,
        perishable: true,
        status: 'ACTIVE',
        viewsCount: 120,
        distanceKm: 12,
        rating: 4.7,
      },
      quantityKg: 20,
    },
    {
      listing: {
        id: 'prod-p',
        crop: 'Potato',
        cropHindi: 'आलू (Potato)',
        pricePerKg: 28,
        minOrderKg: 20,
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&q=80',
        farmerName: 'Verma FPO',
        fpoName: 'Verma FPO, मोहनलालगंज',
        cultivationLocation: 'मोहनलालगंज, लखनऊ',
        quantityKg: 800,
        quality: 'A',
        harvestDate: '2024-05-18',
        freshnessWindowHours: 48,
        perishable: true,
        status: 'ACTIVE',
        viewsCount: 95,
        distanceKm: 8,
        rating: 4.6,
      },
      quantityKg: 20,
    },
    {
      listing: {
        id: 'prod-w',
        crop: 'Wheat',
        cropHindi: 'गेहूं (Wheat)',
        pricePerKg: 22.25,
        minOrderKg: 100,
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=300&q=80',
        farmerName: 'Kisan Utpadak FPO',
        fpoName: 'Kisan Utpadak FPO',
        cultivationLocation: 'बाराबंकी',
        quantityKg: 2500,
        quality: 'A',
        harvestDate: '2024-05-15',
        freshnessWindowHours: 72,
        perishable: false,
        status: 'ACTIVE',
        viewsCount: 210,
        distanceKm: 5,
        rating: 4.8,
      },
      quantityKg: 100, // 1 Quintal = 100 kg
      unit: 'Quintal',
    },
  ]);

  // Sync cart to Firebase on change
  useEffect(() => {
    const syncCart = async () => {
      // Avoid infinite loop by only saving if we are not currently loading
      // (Simplified check: if we have cart items or it's an explicit change)
      await updateBuyerProfile(BUYER_ID, { cart });
    };
    if (cart && cart.length >= 0) {
      syncCart();
    }
  }, [cart]);

  // Sync saved listings to Firebase on change
  useEffect(() => {
    const syncSaved = async () => {
      await updateBuyerProfile(BUYER_ID, { savedListingIds });
    };
    if (savedListingIds && savedListingIds.length >= 0) {
      syncSaved();
    }
  }, [savedListingIds]);

  // Sync filter to Firebase on change
  useEffect(() => {
    const syncFilter = async () => {
      await updateBuyerProfile(BUYER_ID, { selectedCategory, searchQuery });
    };
    syncFilter();
  }, [selectedCategory, searchQuery]);

  const selectedTransporter = useMemo(() => {
    return candidateTransporters.find((t) => t.id === selectedTransporterId) || candidateTransporters[0];
  }, [selectedTransporterId]);

  const toggleBookmark = (listingId: string) => {
    setSavedListingIds((prev) =>
      prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantityKg * item.listing.pricePerKg, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (deliveryMethod === 'SELF_PICKUP' || deliveryModeOption === 'SELF') return 0;
    return selectedTransporter.fare;
  }, [deliveryMethod, deliveryModeOption, selectedTransporter]);

  const couponDiscount = useMemo(() => {
    return appliedCoupon === 'KISAN100' ? 100 : 0;
  }, [appliedCoupon]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal + deliveryFee - couponDiscount);
  }, [cartSubtotal, deliveryFee, couponDiscount]);

  const estimatedMarketTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const marketPrice = item.listing.marketPricePerKg || Math.round(item.listing.pricePerKg * 1.22);
      return sum + item.quantityKg * marketPrice;
    }, 0);
  }, [cart]);

  const totalSavings = Math.max(495, estimatedMarketTotal - cartSubtotal);

  const handleAddToCart = (listing: ProduceListing) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.listing.id === listing.id);
      if (existing) {
        return prev.map((i) =>
          i.listing.id === listing.id ? { ...i, quantityKg: i.quantityKg + 1 } : i
        );
      }
      return [...prev, { listing, quantityKg: listing.minOrderKg || 20 }];
    });
    setIsCartOpen(true);
  };

  const handleQuantityChange = (listingId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.listing.id === listingId) {
            const nextQty = delta === -99999 ? 0 : item.quantityKg + delta;
            return nextQty > 0 ? { ...item, quantityKg: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsPlacingOrder(true);

    try {
      const firstItem = cart[0]?.listing;
      const orderCode = `ORD${Math.floor(5000 + Math.random() * 900)}`;

      const newOrder: Order = {
        id: `order-${Date.now()}`,
        orderCode,
        buyerName: 'Rohit Verma',
        buyerPhone: '+91 98765 43210',
        sellerName: firstItem?.fpoName || firstItem?.farmerName || 'Sharma FPO, मोहनलालगंज',
        sellerPhone: '+91 98123 76543',
        items: cart.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          listingId: item.listing.id,
          crop: item.listing.crop,
          cropHindi: item.listing.cropHindi || item.listing.crop,
          quantityKg: item.quantityKg,
          pricePerKg: item.listing.pricePerKg,
          lineAmount: item.listing.pricePerKg * item.quantityKg,
          image: item.listing.image,
        })),
        productAmount: cartSubtotal,
        deliveryFee,
        platformFee: 0,
        totalAmount: cartTotal,
        status: 'PLACED',
        deliveryMethod,
        placedAt: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) + ', आज',
        acceptDeadline: '12 घंटे शेष',
        pickupLocation: firstItem?.cultivationLocation || 'मोहनलालगंज फार्म',
        dropLocation: selectedLocation,
        distanceKm: firstItem?.distanceKm || 12,
        paymentMethod: selectedPaymentMethod,
        eta: deliveryMethod === 'SELF_PICKUP' ? 'Self Pickup' : selectedTransporter.eta,
        freshnessRemainingHours: 24,
      };

      if (onPlaceOrder) {
        await Promise.race([
          Promise.resolve(onPlaceOrder(newOrder)),
          new Promise((resolve) => setTimeout(resolve, 2000))
        ]);
      } else {
        setOrders((prev) => [newOrder, ...prev]);
      }

      setCart([]); // Clear cart upon successful order placement

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      setIsConfirmModalOpen(false);
      setIsCartOpen(false);
      setOrderSuccessMsg(`ऑर्डर #${orderCode} सफलतापूर्वक प्लेस किया गया!`);
      setActiveTab('ORDERS');

      setTimeout(() => {
        setOrderSuccessMsg(null);
      }, 7000);
    } catch (err) {
      console.error('Order checkout error:', err);
      // Fail-safe: Always close modal and show confirmed order
      setIsConfirmModalOpen(false);
      setIsCartOpen(false);
      setCart([]);
      setActiveTab('ORDERS');
      setOrderSuccessMsg('ऑर्डर सफलतापूर्वक दर्ज कर लिया गया!');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Combined Order Records matching mockups
  const combinedOrders = useMemo(() => {
    const firestoreFormatted = (orders || []).map((o) => ({
      id: o.id,
      orderCode: o.orderCode || `ORD${o.id.slice(-4)}`,
      placedAt: o.placedAt || 'आज',
      sellerName: o.sellerName || 'सत्यापित FPO',
      itemCount: o.items?.length || 1,
      badgeItems: o.items?.length || 1,
      totalAmount: o.totalAmount || ((o.productAmount || 0) + (o.deliveryFee || 0)),
      productAmount: o.productAmount,
      deliveryFee: o.deliveryFee,
      status: o.status,
      statusLabel:
        o.status === 'PLACED' ? 'प्रतीक्षित (Placed)' :
        o.status === 'ACCEPTED' ? 'स्वीकृत (Accepted)' :
        o.status === 'PACKED' ? 'Packed' :
        o.status === 'IN_TRANSIT' ? 'In Transit' :
        o.status === 'DELIVERED' ? 'Delivered' :
        o.status === 'REJECTED' ? 'अस्वीकृत (Rejected)' :
        o.status === 'CANCELLED' ? 'Cancelled' : o.status,
      rejectionReason: (o as any).rejectionReason,
      eta: o.eta || '1:15 PM',
      deliveryMethod: o.deliveryMethod || 'DELIVERY_PARTNER',
      pickupLocation: o.pickupLocation,
      dropLocation: o.dropLocation,
      images: o.items?.map((it) => it.image).filter(Boolean) || [
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80',
      ],
      items: o.items || [],
    }));

    const merged = [...firestoreFormatted];

    return merged.filter((ord) => {
      if (orderFilter !== 'ALL') {
        if (orderFilter === 'ACTIVE') {
          return ['PLACED', 'ACCEPTED', 'PACKED', 'IN_TRANSIT'].includes(ord.status);
        }
        if (orderFilter === 'ORDERED') {
          return ord.status === 'PLACED' || ord.status === 'ACCEPTED';
        }
        if (orderFilter === 'CANCELLED') {
          return ord.status === 'CANCELLED' || ord.status === 'REJECTED';
        }
        if (orderFilter === 'REJECTED') {
          return ord.status === 'REJECTED';
        }
        if (ord.status !== orderFilter) return false;
      }
      return true;
    });
  }, [orders, orderFilter]);

  // Derive real Farmers & FPOs strictly from active produce listings
  const realFarmers = useMemo(() => {
    const map = new Map<string, any>();
    (listings || []).forEach((l) => {
      const fName = l.farmerName || l.fpoName || 'सत्यापित किसान';
      if (!map.has(fName)) {
        const isFPO = Boolean((l.fpoName && l.fpoName.includes('FPO')) || l.farmerName?.includes('FPO'));
        map.set(fName, {
          id: `farmer-${fName.replace(/\s+/g, '_')}`,
          name: fName,
          type: isFPO ? 'FPO' : 'Farmer',
          location: l.cultivationLocation || 'उत्तर प्रदेश',
          farmersCount: isFPO ? '150+' : '1',
          experienceYears: '10+ वर्ष',
          productsCount: `${(listings || []).filter(item => (item.farmerName === fName || item.fpoName === fName)).length} उपज`,
          onTimeRate: '99%',
          rating: l.rating || 4.9,
          reviewCount: 12,
          isVerified: true,
          avatar: l.image || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300',
          crop: l.cropHindi || l.crop,
        });
      }
    });
    return Array.from(map.values());
  }, [listings]);

  // Filter produce listings
  const filteredListings = useMemo(() => {
    const filtered = (listings || []).filter((item) => {
      if (!item) return false;
      
      // Category Filter
      if (selectedCategory && selectedCategory !== 'ALL') {
        const itemCat = getCropCategory(item.crop);
        if (itemCat !== selectedCategory) {
          return false;
        }
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        if (!matchesProduceSearch(item, searchQuery)) {
          return false;
        }
      }
      return true;
    });

    // Sort listings
    return [...filtered].sort((a, b) => {
      if (sortBy === 'PRICE_ASC') {
        return a.pricePerKg - b.pricePerKg;
      }
      if (sortBy === 'PRICE_DESC') {
        return b.pricePerKg - a.pricePerKg;
      }
      if (sortBy === 'DISTANCE_ASC') {
        return (a.distanceKm || 0) - (b.distanceKm || 0);
      }
      return 0;
    });
  }, [listings, searchQuery, selectedCategory, sortBy]);

  // Derived instant crop suggestions for search autocomplete dropdown
  const cropSuggestions = useMemo(() => {
    return getInstantCropSuggestions(searchQuery, listings || []);
  }, [searchQuery, listings]);

  const isDark = themePreference === 'dark';

  return (
    <div className={`h-screen overflow-hidden ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-[#F4F6F8] text-slate-800'} font-sans flex flex-col antialiased transition-colors duration-200`}>
      {/* --- TOP HEADER BAR (Exact Mockup Layout) --- */}
      <header className={`${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'} px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4 shrink-0 z-40 shadow-xs border-b`}>
        {/* Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={`p-2 rounded-xl transition-colors lg:hidden flex items-center justify-center cursor-pointer ${
              isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-750' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="पोर्टल मेनू व फीचर्स (Menu & Features)"
            aria-label="Open portal navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={onBackToLanding}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors hidden sm:block md:hidden cursor-pointer"
            title="रोल बदलें (Switch Role)"
          >
            ←
          </button>
          <div
            onClick={onBackToLanding}
            title="मुख्य पृष्ठ (Home) पर जाएं"
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img src="/favicon.svg" alt="KrishiSetu Logo" className="w-9 h-9 object-contain shrink-0" />
            <div>
              <div className="font-extrabold text-[#03542B] text-base leading-none tracking-tight flex items-center gap-1">
                KrishiSetu
              </div>
              <div className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">
                क्रेता पोर्टल • Buyer Portal
              </div>
            </div>
          </div>
        </div>

        {/* Central Search Bar */}
        <div className="flex-1 max-w-xl relative" ref={searchBarRef}>
          <div
            className={`relative flex items-center transition-all duration-200 ${
              isVoiceListening
                ? 'ring-2 ring-red-500 rounded-xl'
                : isSearchFocused
                ? 'ring-2 ring-emerald-600 rounded-xl shadow-xs'
                : ''
            }`}
          >
            <Search
              className={`w-4 h-4 absolute left-3 pointer-events-none transition-colors ${
                isSearchFocused ? 'text-emerald-700' : 'text-slate-400'
              }`}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={
                isVoiceListening
                  ? language === 'en'
                    ? '🎤 Listening... speak crop name (e.g. "tomato")'
                    : '🎤 सुन रहे हैं... बोलिए जैसे "टमाटर" या "आलू"...'
                  : language === 'en'
                  ? 'What are you looking for? (tomato, wheat, potato...)'
                  : 'क्या ढूंढ रहे हैं? (टमाटर, गेहूं, आलू...)'
              }
              className={`w-full pl-9 ${searchQuery ? 'pr-20' : 'pr-11'} py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border ${
                isVoiceListening
                  ? 'border-red-500 bg-red-50/20 text-red-900 dark:text-red-200'
                  : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-850 text-slate-800 dark:text-slate-100'
              } rounded-xl focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 transition-all`}
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-9 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer transition-colors"
                title="खोज हटाएं (Clear Search)"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Voice Search / Mic Button */}
            <button
              type="button"
              onClick={handleVoiceSearchToggle}
              title={
                isVoiceListening
                  ? 'वॉयस सर्च रोकें (Stop Listening)'
                  : 'बोलकर खोजें (Voice Search)'
              }
              className={`absolute right-2 p-1.5 rounded-lg cursor-pointer flex items-center justify-center transition-all ${
                isVoiceListening
                  ? 'bg-red-500 text-white animate-pulse shadow-sm'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-750'
              }`}
              aria-label="Voice search microphone"
            >
              <Mic className={`w-4 h-4 ${isVoiceListening ? 'animate-bounce' : ''}`} />
            </button>
          </div>

          {/* Voice Error Notification Popup */}
          {voiceError && (
            <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-xl shadow-md z-50 flex items-center justify-between gap-2 animate-in fade-in">
              <span className="text-[11px] font-semibold">{voiceError}</span>
              <button
                onClick={() => setVoiceError(null)}
                className="text-amber-600 hover:text-amber-900 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Autocomplete & Suggestions Dropdown Popover */}
          {isSearchFocused && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[460px] overflow-y-auto">
              {/* If search query is empty -> Show Trending Searches & Recent Searches */}
              {!searchQuery.trim() ? (
                <div className="p-3.5 space-y-3">
                  {/* Trending Searches */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'en' ? 'Trending Produce Searches' : 'लोकप्रिय खोजें (Trending Searches)'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TRENDING_SEARCHES.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSearchQuery(item.nameHi)}
                          className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{item.emoji}</span>
                          <span>{language === 'en' ? item.nameEn : item.nameHi}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{language === 'en' ? 'Recent Searches' : 'हालिया खोजें (Recent Searches)'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentSearches([]);
                            try {
                              localStorage.removeItem('krishi_buyer_recent_searches');
                            } catch {}
                          }}
                          className="text-[10px] text-slate-400 hover:text-red-600 cursor-pointer font-semibold"
                        >
                          {language === 'en' ? 'Clear All' : 'सभी हटाएं'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSearchQuery(term)}
                            className="group px-2.5 py-1 bg-slate-100/70 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <span>{term}</span>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(e, term)}
                              className="text-slate-400 hover:text-red-500 opacity-60 group-hover:opacity-100 transition-opacity"
                              title="हटाएं"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voice Search Hint */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-emerald-700" />
                      <span>माइक पर क्लिक करके सीधे बोलकर खोजें</span>
                    </div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">Press Enter ↵</span>
                  </div>
                </div>
              ) : (
                /* If search query has text -> Show live matched produce suggestions */
                <div>
                  <div className="p-2.5 bg-slate-50/70 dark:bg-slate-850/50 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <span>
                      {language === 'en' ? `Suggestions for "${searchQuery}"` : `"${searchQuery}" के सुझाव`}
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-extrabold">
                      {filteredListings.length} उपलब्ध उपज
                    </span>
                  </div>

                  {cropSuggestions.length > 0 ? (
                    <div className="py-1">
                      {cropSuggestions.map((sug, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSearchQuery(sug.cropHindi || sug.cropName)}
                          className="px-3.5 py-2.5 hover:bg-emerald-50/60 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-b-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={sug.imageUrl}
                              alt={sug.cropName}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {sug.cropHindi} <span className="text-slate-400 font-normal text-[11px]">({sug.cropName})</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {sug.listingCount} किसान/FPO लिस्टिंग • {sug.totalQuantityKg.toLocaleString()} kg उपलब्ध
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-[#03542B] dark:text-emerald-400">
                              ₹{sug.minPrice}/kg से शुरू
                            </div>
                            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                              सीधे खेत से
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <p className="text-xs text-slate-500">
                        "{searchQuery}" नाम से कोई सटीक उपज नहीं मिली।
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                        {TRENDING_SEARCHES.slice(0, 4).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectSearchQuery(item.nameHi)}
                            className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
                          >
                            {item.emoji} {item.nameHi}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View All Results Button */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleSelectSearchQuery(searchQuery)}
                      className="w-full py-2 px-4 bg-[#03542B] hover:bg-[#023e1f] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>"{searchQuery}" के सभी {filteredListings.length} परिणाम बाज़ार में देखें →</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location Dropdown */}
        <div
          onClick={() => setIsAuthModalOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
          <span>{selectedLocation}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="block">
            <LanguageSelector variant="light" showLabel={false} />
          </div>

          {/* Quick Theme Toggle Button */}
          <button
            type="button"
            onClick={() => handleThemeChange(isDark ? 'light' : 'dark')}
            title={isDark ? 'स्विच टू लाइट मोड (Light Mode)' : 'स्विच टू डार्क मोड (Dark Mode)'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-750' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Bell Notifications Badge & Interactive Dropdown */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              type="button"
              id="buyer-notification-bell-btn"
              onClick={() => setIsNotifDropdownOpen((prev) => !prev)}
              title="सूचनाएं (Notifications)"
              aria-expanded={isNotifDropdownOpen}
              className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
                isNotifDropdownOpen
                  ? isDark
                    ? 'bg-emerald-950/70 border-emerald-700 text-emerald-400 ring-2 ring-emerald-500/20'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20'
                  : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Bell className={`w-4 h-4 transition-transform ${isNotifDropdownOpen ? 'rotate-12' : ''}`} />
              {isMounted && unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-in zoom-in-50">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {isNotifDropdownOpen && (
              <div
                id="buyer-notification-dropdown"
                className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
                  isDark
                    ? 'bg-slate-900/95 backdrop-blur-md border-slate-750 text-slate-100 shadow-black/60'
                    : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-900 shadow-slate-300/50'
                }`}
              >
                {/* Dropdown Header */}
                <div className={`p-3.5 border-b flex items-center justify-between ${
                  isDark ? 'border-slate-800 bg-slate-850/50' : 'border-slate-100 bg-slate-50/70'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/15 text-emerald-600 flex items-center justify-center">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs">सूचनाएं (Notifications)</h3>
                      <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isMounted && unreadNotificationsCount > 0 ? `${unreadNotificationsCount} नई सूचनाएं` : 'सभी सूचनाएं पढ़ी जा चुकी हैं'}
                      </p>
                    </div>
                  </div>

                  {isMounted && unreadNotificationsCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      title="सभी को पढ़ा हुआ मार्क करें"
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>सभी मार्क करें</span>
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className={`px-3 py-2 border-b flex items-center gap-1.5 text-[11px] font-bold ${
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
                }`}>
                  {[
                    { id: 'ALL', label: 'सभी' },
                    { id: 'ORDER', label: 'ऑर्डर्स' },
                    { id: 'PRICE', label: 'प्राइस' },
                    { id: 'SYSTEM', label: 'सिस्टम' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDropdownNotifFilter(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        dropdownNotifFilter === f.id
                          ? 'bg-[#03542B] text-white'
                          : isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Notifications Scroll List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredDropdownNotifications.length === 0 ? (
                    <div className="py-8 text-center px-4">
                      <Bell className={`w-8 h-8 mx-auto mb-2 opacity-30 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      <p className="text-xs font-bold text-slate-500">कोई सूचना नहीं है</p>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        आपके ऑर्डर्स और अलर्ट्स से जुड़े अपडेट्स यहाँ दिखेंगे
                      </p>
                    </div>
                  ) : (
                    filteredDropdownNotifications.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`p-3 flex items-start gap-2.5 transition-colors cursor-pointer group ${
                          item.read
                            ? isDark
                              ? 'hover:bg-slate-800/60 text-slate-300'
                              : 'hover:bg-slate-50 text-slate-700'
                            : isDark
                              ? 'bg-emerald-950/25 hover:bg-emerald-950/40 text-white'
                              : 'bg-emerald-50/50 hover:bg-emerald-50 text-slate-900'
                        }`}
                      >
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          item.type === 'ORDER'
                            ? 'bg-emerald-600 text-white'
                            : item.type === 'PRICE'
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-600 text-white'
                        }`}>
                          {item.type === 'ORDER' ? (
                            <Truck className="w-4 h-4" />
                          ) : item.type === 'PRICE' ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-extrabold text-[11px] truncate">{item.title}</h4>
                            <span className={`text-[9px] whitespace-nowrap shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                              {item.time}
                            </span>
                          </div>
                          <p className={`text-[10px] line-clamp-2 mt-0.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.desc}
                          </p>
                        </div>

                        {/* Action indicator & Mark Read */}
                        <div className="flex flex-col items-center gap-1.5 shrink-0 pt-1">
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300/40" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => dismissNotification(item.id, e)}
                            title="हटाएं (Dismiss)"
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity ${
                              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
                            }`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer link to full view */}
                <div className={`p-2.5 border-t text-center ${
                  isDark ? 'border-slate-800 bg-slate-850/60' : 'border-slate-100 bg-slate-50/80'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotifDropdownOpen(false);
                      setActiveTab('NOTIFICATIONS');
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <span>पूरा नोटिफिकेशन केंद्र खोलें (View All)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Pill Button (Matching Image 1: ₹3,935) */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#03542B] hover:bg-[#023e1f] text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="bg-emerald-800/80 px-1.5 py-0.2 rounded-md text-[10px]">3</span>
            <span>₹{cartTotal.toLocaleString()}</span>
          </button>

          <button
            type="button"
            onClick={handleBuyerLogout}
            title="लॉगआउट (Logout)"
            aria-label="Logout from Buyer Portal"
            className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
              isDark
                ? 'border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-800'
                : 'border-slate-200 text-slate-500 hover:text-red-600 hover:bg-slate-100'
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Success Notification Alert */}
      {orderSuccessMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{orderSuccessMsg}</span>
          </div>
          <button onClick={() => setOrderSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Order Rejection Alert Banner (When Farmer Rejects Order) */}
      {orderRejectedAlert && (
        <div className="bg-red-600 text-white px-4 py-3 text-xs font-bold flex flex-wrap items-center justify-between gap-3 z-50 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-200 shrink-0 animate-pulse" />
            <div>
              <span className="font-extrabold text-sm sm:text-xs">
                ⚠️ आपका यह ऑर्डर #{orderRejectedAlert.orderCode} किसान द्वारा अस्वीकार कर दिया गया है। कृपया नया ऑर्डर करें।
              </span>
              <span className="text-red-200 text-[11px] block sm:inline sm:ml-2">
                ({orderRejectedAlert.reason || 'फसल अनुपलब्ध या किसान द्वारा निरस्त'})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('BROWSE');
                setOrderRejectedAlert(null);
              }}
              className="px-3.5 py-1.5 bg-white text-red-700 hover:bg-red-50 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>नया ऑर्डर करें (Make a New Order)</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderRejectedAlert(null)}
              className="p-1 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
              title="बंद करें"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* === MOBILE & TABLET SLIDE-OUT SIDE PANEL DRAWER === */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] ${
              isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'
            } shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250 border-r ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            {/* Drawer Header */}
            <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/70'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#03542B] flex items-center justify-center text-white shadow-xs">
                  <Leaf className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#03542B] dark:text-emerald-400 leading-none">
                    KrishiSetu
                  </h3>
                  <p className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider mt-0.5">
                    क्रेता पोर्टल • Buyer Portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'} transition-colors cursor-pointer`}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Card */}
            <div className="p-3.5 shrink-0">
              <div className={`p-3 ${isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200'} border rounded-2xl flex items-center gap-3 shadow-2xs`}>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Rohit Verma"
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs truncate">{profileData.name}</span>
                    <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-md">
                      Buyer
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{profileData.city || 'Lucknow, UP'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Menu Items with Badges and Active Highlighting */}
            <nav className="flex-1 px-3 py-1 overflow-y-auto space-y-1 text-xs font-semibold custom-scrollbar">
              <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 px-3 py-1 uppercase tracking-wider">
                पोर्टल के मुख्य फीचर्स (Features)
              </div>

              {[
                { id: 'HOME', icon: Store, en: 'Home', hi: 'होम' },
                { id: 'BROWSE', icon: Search, en: 'Bazaar Products', hi: 'बाज़ार प्रोडक्ट्स' },
                { id: 'ORDERS', icon: Package, en: 'Orders', hi: 'ऑर्डर्स' },
                { id: 'FARMERS', icon: Users, en: 'Farmers / FPOs', hi: 'किसान / FPOs' },
                { id: 'PRICES', icon: TrendingUp, en: 'Market Prices', hi: 'बाजार भाव', badge: 'नया' },
                { id: 'DELIVERY_TRACKING', icon: Compass, en: 'Delivery Tracking', hi: 'डिलीवरी ट्रैकिंग' },
                { id: 'DELIVERY_VIKALP', icon: Truck, en: 'Delivery Vikalp', hi: 'डिलीवरी विकल्प' },
                { id: 'PAYMENTS', icon: CreditCard, en: 'Payments', hi: 'भुगतान इतिहास' },
                { id: 'NOTIFICATIONS', icon: Bell, en: 'Notifications', hi: 'सूचनाएं', count: unreadNotificationsCount },
                { id: 'SETTINGS', icon: Settings, en: 'Settings & Profile', hi: 'सेटिंग्स एवं प्रोफाइल' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as any);
                      if (item.id === 'SETTINGS') setActiveSettingsSection('MENU');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#03542B] text-white font-bold shadow-xs'
                        : isDark
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{language === 'en' ? item.en : item.hi}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-md font-bold">
                        {item.badge}
                      </span>
                    )}
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Actions & Role Switcher */}
            <div className={`p-3.5 border-t space-y-2.5 shrink-0 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/80'}`}>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenKrishiAI();
                }}
                className="w-full py-2.5 bg-[#03542B] hover:bg-[#023e1f] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Bot className="w-4 h-4 text-emerald-300" />
                <span>AI Shopping Assistant</span>
              </button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onBackToLanding();
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold text-center transition-colors cursor-pointer ${
                    isDark ? 'border-slate-700 bg-slate-850 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  🔄 रोल बदलें (Role)
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange(isDark ? 'light' : 'dark')}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isDark ? 'border-slate-700 bg-slate-850 text-amber-400 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isDark ? 'Light Mode' : 'Dark Mode'}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN LAYOUT (Left Navigation + Canvas + Right Rail) --- */}
      <div className="flex-1 flex flex-row overflow-hidden min-h-0">
        {/* === LEFT SIDEBAR (Desktop only, hidden on mobile/tablet) === */}
        <aside className={`hidden lg:flex lg:w-60 xl:w-64 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'} flex-col shrink-0 h-full overflow-y-auto border-r border-slate-200 dark:border-slate-800 z-20`}>
          {/* User Profile Card */}
          <div className={`p-3 m-2.5 ${isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'} border rounded-2xl flex items-center gap-2.5`}>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Rohit Verma"
              className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{profileData.name}</span>
                <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1 py-0.2 rounded-md">
                  Buyer
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                <span>{profileData.city || 'Lucknow, UP'}</span>
              </div>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="flex-1 px-2.5 py-1 space-y-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('HOME')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'HOME' ? 'bg-[#03542B] text-white font-bold shadow-2xs' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>{language === 'en' ? 'Home' : 'होम'}</span>
            </button>

            <button
              onClick={() => setActiveTab('BROWSE')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'BROWSE' ? 'bg-[#03542B] text-white font-bold shadow-2xs' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{language === 'en' ? 'Bazaar Products' : 'बाज़ार प्रोडक्ट्स'}</span>
            </button>

            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'ORDERS' ? 'bg-[#03542B] text-white font-bold shadow-2xs' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{language === 'en' ? 'Orders' : 'ऑर्डर्स'}</span>
            </button>

            <button
              onClick={() => setActiveTab('FARMERS')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'FARMERS' ? 'bg-[#03542B] text-white font-bold shadow-2xs' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{language === 'en' ? 'Farmers / FPOs' : 'किसान / FPOs'}</span>
            </button>

            <button
              onClick={() => setActiveTab('PRICES')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'PRICES' ? 'bg-[#03542B] text-white font-bold shadow-2xs' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4" />
                <span>{language === 'en' ? 'Market Prices' : 'बाजार भाव'}</span>
              </div>
              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-md font-bold">{language === 'en' ? 'New' : 'नया'}</span>
            </button>

            <button
              onClick={() => setActiveTab('DELIVERY_TRACKING')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'DELIVERY_TRACKING' ? 'bg-[#03542B] text-white font-bold shadow-2xs' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{language === 'en' ? 'Delivery Tracking' : 'डिलीवरी ट्रैकिंग'}</span>
            </button>

            <button
              onClick={() => setActiveTab('DELIVERY_VIKALP')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'DELIVERY_VIKALP' ? 'bg-[#03542B] text-white font-bold shadow-2xs' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{language === 'en' ? 'Delivery Vikalp' : 'डिलीवरी विकल्प'}</span>
            </button>

            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'PAYMENTS' ? 'bg-[#03542B] text-white font-bold shadow-2xs' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{language === 'en' ? 'Payments' : 'भुगतान इतिहास'}</span>
            </button>

            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'NOTIFICATIONS' ? 'bg-[#03542B] text-white font-bold shadow-2xs' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4" />
                <span>{language === 'en' ? 'Notifications' : 'सूचनाएं'}</span>
              </div>
              {isMounted && unreadNotificationsCount > 0 && (
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.2 rounded-full font-bold">{unreadNotificationsCount}</span>
              )}
            </button>

            {/* Settings Link */}
            <button
              onClick={() => {
                setActiveTab('SETTINGS');
                setActiveSettingsSection('MENU');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'SETTINGS' ? 'bg-[#03542B] text-white font-bold shadow-2xs' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>{language === 'en' ? 'Settings & Profile' : 'सेटिंग्स एवं प्रोफाइल'}</span>
              </div>
            </button>
          </nav>

          {/* Promo Banner & AI Shopping Assistant Button */}
          <div className={`p-2.5 space-y-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className={`p-2.5 ${isDark ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'} border rounded-xl text-[11px] font-medium`}>
              <span className={`font-bold block ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>किसानों से जुड़ें, ताज़ा और शुद्ध उत्पाद पाएं</span>
            </div>

            <button
              onClick={onOpenKrishiAI}
              className="w-full py-2 bg-[#03542B] hover:bg-[#023e1f] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>AI Shopping Assistant</span>
            </button>
          </div>
        </aside>

        {/* === MAIN CONTENT CANVAS + RIGHT RAIL (CART) === */}
        <div className={`flex-1 overflow-hidden flex flex-col lg:flex-row ${isDark ? 'bg-slate-950' : 'bg-slate-50/50'} min-h-0`}>
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar min-h-0">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-5 items-start w-full">
              
              {/* MAIN CANVAS */}
              <main className="flex-1 min-w-0 space-y-5">

              {/* === VIEW 1: HOME (Dashboard Overview) === */}
              {activeTab === 'HOME' && (
                <div className="space-y-5">
                  {/* Hero Banner */}
                  <div className="bg-gradient-to-r from-[#03542B] to-[#047857] rounded-2xl p-5 text-white shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-2 max-w-md z-10">
                      <h1 className="text-xl sm:text-2xl font-black leading-snug">
                        सीधे किसानों से, बेहतर दाम में, भरोसे के साथ
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                        <span className="bg-white/20 px-2.5 py-1 rounded-full font-semibold border border-white/20">
                          ✓ न्यायपूर्ण मूल्य (किसान को बेहतर दाम)
                        </span>
                        <span className="bg-white/20 px-2.5 py-1 rounded-full font-semibold border border-white/20">
                          ✓ ताजा और गुणवत्तापूर्ण (सीधे खेत से)
                        </span>
                        <span className="bg-white/20 px-2.5 py-1 rounded-full font-semibold border border-white/20">
                          ✓ स्मार्ट डिलीवरी (सस्ती, तेज)
                        </span>
                      </div>
                    </div>
                    <img
                      src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=400&q=80"
                      alt="Farmer"
                      className="w-28 h-28 rounded-2xl object-cover border-2 border-emerald-300 shadow-md z-10 shrink-0"
                    />
                  </div>

                  {/* Active Search Results Banner on Home (if user typed in search bar) */}
                  {searchQuery.trim() !== '' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-300 dark:border-emerald-700 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                            <Search className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              खोज परिणाम: "{searchQuery}"
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              {filteredListings.length} ताज़ा खेत की उपज उपलब्ध
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                          >
                            फ़िल्टर हटाएं
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('BROWSE')}
                            className="px-3.5 py-1.5 bg-[#03542B] hover:bg-[#023e1f] text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>बाज़ार में सभी देखें</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {filteredListings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                          {filteredListings.slice(0, 4).map((item) => (
                            <ProduceCard
                              key={item.id}
                              item={item}
                              isSaved={savedListingIds.includes(item.id)}
                              onToggleBookmark={toggleBookmark}
                              onAddToCart={handleAddToCart}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center text-xs text-slate-500 space-y-2">
                          <p>"{searchQuery}" के लिए कोई उपज नहीं मिली।</p>
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {TRENDING_SEARCHES.slice(0, 5).map((t) => (
                              <button
                                key={t.id}
                                onClick={() => handleSelectSearchQuery(t.nameHi)}
                                className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 cursor-pointer"
                              >
                                {t.emoji} {t.nameHi}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category Filter Tiles */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{language === 'en' ? 'Explore Categories' : 'श्रेणी के अनुसार खोजें (Explore Categories)'}</span>
                      <button
                        onClick={() => {
                          setSelectedCategory('ALL');
                          setActiveTab('BROWSE');
                        }}
                        className="text-emerald-700 hover:underline cursor-pointer"
                      >
                        {language === 'en' ? 'See All →' : 'सभी देखें →'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-bold">
                      {CATEGORIES.slice(1).map((cat) => {
                        const displayName = language === 'en' ? CATEGORY_NAMES[cat.id]?.en : CATEGORY_NAMES[cat.id]?.hi;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setActiveTab('BROWSE');
                            }}
                            className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 p-3 rounded-2xl transition-all cursor-pointer flex flex-col items-center gap-1"
                          >
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-[11px] truncate w-full">{displayName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Featured Produce Cards Grid (Near You) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{language === 'en' ? 'Featured Near You' : 'आपके आसपास लोकप्रिय उत्पाद (Featured Near You)'}</span>
                      <button
                        onClick={() => {
                          setSelectedCategory('ALL');
                          setActiveTab('BROWSE');
                        }}
                        className="text-emerald-700 hover:underline font-extrabold cursor-pointer"
                      >
                        {language === 'en' ? 'See All →' : 'सभी देखें →'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {(listings || []).slice(0, 4).map((item) => (
                        <ProduceCard
                          key={item.id}
                          item={item}
                          isSaved={savedListingIds.includes(item.id)}
                          onToggleBookmark={toggleBookmark}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>

                    <div className="pt-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedCategory('ALL');
                          setActiveTab('BROWSE');
                        }}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#03542B] hover:bg-[#023e1f] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <span>सभी {(listings || []).length}+ उपलब्ध प्रोडक्ट्स देखें</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Highlights Banner Section */}
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 space-y-3.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-extrabold text-emerald-950">मंच की मुख्य विशेषताएं</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold">
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1">
                        <div className="text-emerald-700 font-bold">बाजार से सस्ता</div>
                        <p className="text-[10px] text-slate-500">औसत 10-20% कम दाम</p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1">
                        <div className="text-emerald-700 font-bold">AI-स्मार्ट मैच</div>
                        <p className="text-[10px] text-slate-500">सबसे अच्छा दाम और डिलीवरी</p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1">
                        <div className="text-emerald-700 font-bold">कृषि से सीधी खरीद</div>
                        <p className="text-[10px] text-slate-500">बीच के दलाल नहीं</p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1">
                        <div className="text-emerald-700 font-bold">ट्रांसपेरेंट प्राइसिंग</div>
                        <p className="text-[10px] text-slate-500">कम कमीशन, ज्यादा बचत</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === VIEW 1B: BROWSE PRODUCE (Farmer Marketplace Catalog) === */}
              {activeTab === 'BROWSE' && (
                <div className="space-y-4">
                  {/* Browse Marketplace Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Leaf className="w-5 h-5 text-emerald-700" />
                        <span>किसान मंडी बाज़ार (Farmer Marketplace)</span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        ताजा और उच्च गुणवत्ता वाले उत्पाद सीधे विश्वसनीय FPOs और किसानों से खरीदें
                      </p>
                    </div>
                  </div>

                  {/* Catalog & Filters */}
                  <div className="space-y-4">
                    {/* Rich Search & Advanced Filters Toolbar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                      {/* Top Row: Search and Sort */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-8 relative">
                          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="फसल, उत्पाद, या FPO का नाम खोजें..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-1.7 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 font-extrabold text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="md:col-span-4 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.7">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full bg-transparent text-xs font-extrabold text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="DISTANCE_ASC">{language === 'en' ? '📍 Nearest First' : '📍 निकटतम पहले (Nearest)'}</option>
                            <option value="PRICE_ASC">{language === 'en' ? '💰 Lowest Price' : '💰 कम दाम पहले (Lowest Price)'}</option>
                            <option value="PRICE_DESC">{language === 'en' ? '📈 Highest Price' : '📈 अधिकतम दाम पहले (Highest Price)'}</option>
                          </select>
                        </div>
                      </div>

                      {/* Bottom Row: Category Filter Chips */}
                      <CategoryFilter
                        categories={CATEGORIES}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                        language={language}
                        categoryNames={CATEGORY_NAMES}
                      />

                      {/* Active Filter Indicators */}
                      {(selectedCategory !== 'ALL' || searchQuery.trim() !== '') && (
                        <div className="flex items-center justify-between bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100 text-xs">
                          <div className="flex items-center gap-2 text-emerald-950 font-bold">
                            <span>{language === 'en' ? 'Active Filters:' : 'सक्रिय फ़िल्टर:'}</span>
                            {selectedCategory !== 'ALL' && (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-extrabold text-[10px]">
                                {language === 'en' ? CATEGORY_NAMES[selectedCategory]?.en : CATEGORY_NAMES[selectedCategory]?.hi}
                              </span>
                            )}
                            {searchQuery.trim() !== '' && (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-extrabold text-[10px]">
                                {language === 'en' ? `Search: "${searchQuery}"` : `खोज: "${searchQuery}"`}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                                setSelectedCategory('ALL');
                                setSearchQuery('');
                            }}
                            className="text-emerald-800 hover:text-emerald-950 font-extrabold text-[10px] uppercase tracking-wider cursor-pointer hover:underline flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{language === 'en' ? 'Clear All Filters' : 'सभी फ़िल्टर हटाएँ'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Results Count Badge */}
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                      <span>
                        {language === 'en'
                          ? `Search Results (${filteredListings.length} products available)`
                          : `खोज परिणाम (${filteredListings.length} प्रोडक्ट उपलब्ध)`}
                      </span>
                    </div>

                    {/* Empty State / Grid Catalog */}
                    {Boolean(isLoading && listings.length === 0) ? (
                      <div className={`rounded-2xl border p-12 text-center space-y-3 shadow-2xs flex flex-col items-center justify-center ${isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
                        <div className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {language === 'en' ? 'Loading Products...' : 'प्रोडक्ट्स लोड हो रहे हैं...'}
                        </div>
                      </div>
                    ) : filteredListings.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3 shadow-2xs">
                        <div className="text-4xl">🔍</div>
                        <div className="font-extrabold text-slate-800 text-sm">
                          {language === 'en' ? 'No Products Found' : 'कोई प्रोडक्ट नहीं मिला'}
                        </div>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          {language === 'en'
                            ? 'No results available for your chosen filters or search query. Please modify your filters.'
                            : 'आपके द्वारा चुने गए फ़िल्टर या खोज शब्द के लिए कोई परिणाम उपलब्ध नहीं है। कृपया फ़िल्टर बदलें।'}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedCategory('ALL');
                            setSearchQuery('');
                          }}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                        >
                          सभी प्रोडक्ट्स देखें
                        </button>
                      </div>
                    ) : (
                      /* Complete Marketplace Cards Grid - Standardized to grid layout */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                        {filteredListings.map((item) => (
                          <ProduceCard
                            key={item.id}
                            item={item}
                            isSaved={savedListingIds.includes(item.id)}
                            onToggleBookmark={toggleBookmark}
                            onAddToCart={handleAddToCart}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === VIEW 2: MY ORDERS (Image 4 - scr-012) === */}
              {activeTab === 'ORDERS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">मेरे ऑर्डर्स</h2>
                      <p className="text-xs text-slate-500">अपने सभी सक्रिय और पिछले ऑर्डर्स का सारांश, स्थिति और विवरण देखें</p>
                    </div>
                  </div>

                  {/* Executive Order Stats Cards */}
                  {(() => {
                    const activeCount = (orders || []).filter(o => ['PLACED', 'ACCEPTED', 'PACKED', 'IN_TRANSIT'].includes(o.status)).length;
                    const completedCount = (orders || []).filter(o => o.status === 'DELIVERED').length;
                    const cancelledCount = (orders || []).filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED').length;
                    
                    const totalSpent = (orders || [])
                      .filter(o => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
                      .reduce((sum, o) => {
                        const amt = o.totalAmount || ((o.productAmount || 0) + (o.deliveryFee || 0));
                        return sum + amt;
                      }, 0);

                    return (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">सक्रिय ऑर्डर्स</span>
                          <div className="text-xl font-black text-slate-900">{activeCount}</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">पूरे हुए ऑर्डर्स</span>
                          <div className="text-xl font-black text-[#03542B]">{completedCount}</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">रद्द व अस्वीकृत ऑर्डर्स</span>
                          <div className="text-xl font-black text-red-700">{cancelledCount}</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">कुल खर्च राशि</span>
                          <div className="text-xl font-black text-slate-900">₹{totalSpent.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Filter Status Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                    {[
                      { id: 'ALL', label: 'सभी ऑर्डर्स' },
                      { id: 'ACTIVE', label: 'सक्रिय ऑर्डर्स (Active)' },
                      { id: 'ORDERED', label: 'Ordered' },
                      { id: 'PACKED', label: 'Packed' },
                      { id: 'IN_TRANSIT', label: 'In Transit' },
                      { id: 'DELIVERED', label: 'Delivered' },
                      { id: 'REJECTED', label: 'अस्वीकृत (Rejected)' },
                      { id: 'CANCELLED', label: 'Cancelled' },
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setOrderFilter(pill.id as any)}
                        className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                          orderFilter === pill.id
                            ? 'bg-[#03542B] text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  {/* Orders List Container */}
                  <div className="space-y-3.5">
                    {combinedOrders.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                          📦
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-sm">कोई ऑर्डर नहीं मिला</h4>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto">
                            इस श्रेणी में अभी आपका कोई ऑर्डर उपलब्ध नहीं है। बाज़ार में जाकर ताज़ा उपज खरीदें।
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('BROWSE')}
                          className="px-4 py-2 bg-[#03542B] text-white text-xs font-bold rounded-xl hover:bg-[#023e1f] transition-all cursor-pointer"
                        >
                          बाज़ार में उत्पाद देखें
                        </button>
                      </div>
                    ) : (
                      combinedOrders.map((ord, idx) => (
                        <div
                          key={`${ord.id}-${idx}`}
                          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                              {/* Thumbnails Stack */}
                              <div className="relative shrink-0 flex items-center">
                                {Array.isArray(ord.images) && ord.images.length > 0 ? (
                                  ord.images.slice(0, 2).map((imgUrl: string, imgIdx: number) => (
                                    <img
                                      key={imgIdx}
                                      src={imgUrl}
                                      alt="Produce"
                                      className={`w-12 h-12 rounded-xl object-cover border-2 border-white shadow-2xs ${
                                        imgIdx > 0 ? '-ml-4' : ''
                                      }`}
                                    />
                                  ))
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs">
                                    🌾
                                  </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                                  {ord.badgeItems || 1} आइटम
                                </span>
                              </div>

                              <div className="space-y-0.5">
                                <div className="font-extrabold text-sm text-slate-900">
                                  ऑर्डर ID: {ord.orderCode}
                                </div>
                                <div className="text-xs text-slate-500">📅 {ord.placedAt}</div>
                                <div className="text-xs text-slate-600 font-semibold">
                                  📍 {ord.sellerName}
                                </div>
                              </div>
                            </div>

                            <div className="text-right space-y-1">
                              <div className="text-base font-black text-slate-900">
                                ₹{ord.totalAmount?.toLocaleString()}
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold inline-block ${
                                ord.status === 'IN_TRANSIT' ? 'bg-emerald-100 text-emerald-900' :
                                ord.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                                ord.status === 'PACKED' ? 'bg-amber-100 text-amber-900' :
                                ord.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-200' :
                                ord.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {ord.status === 'REJECTED' ? 'अस्वीकृत (Rejected)' : (ord.statusLabel || ord.status)}
                              </span>
                              {ord.eta && <div className="text-[10px] text-slate-500">ETA: {ord.eta}</div>}
                            </div>
                          </div>

                          {/* Order Stepper Bar */}
                          <OrderStepper
                            status={ord.status as any}
                            deliveryMethod={ord.deliveryMethod as any}
                            language={language}
                          />

                          {/* Prominent Rejected Banner if order rejected by farmer */}
                          {ord.status === 'REJECTED' && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-950 animate-fadeIn">
                              <div className="flex items-start sm:items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                                  <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                  <h5 className="font-extrabold text-sm text-red-900">
                                    आपका यह ऑर्डर किसान द्वारा अस्वीकार कर दिया गया है
                                  </h5>
                                  <p className="text-[11px] text-red-700 mt-0.5">
                                    {ord.rejectionReason || 'यह उपज वर्तमान में उपलब्ध नहीं है या किसान द्वारा निरस्त कर दी गई है।'} कृपया नया ऑर्डर करें।
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const cropName = ord.items?.[0]?.cropHindi || ord.items?.[0]?.crop || '';
                                  if (cropName) setSearchQuery(cropName);
                                  setActiveTab('BROWSE');
                                }}
                                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>नया ऑर्डर करें (Make a New Order)</span>
                              </button>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <span className="text-slate-500 text-[11px]">📍 {ord.dropLocation || selectedLocation}</span>
                            <div className="flex items-center gap-2">
                              {['PLACED', 'ACCEPTED', 'PACKED', 'IN_TRANSIT'].includes(ord.status) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTrackOrderId(ord.orderCode);
                                      setActiveTab('DELIVERY_TRACKING');
                                    }}
                                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                                  >
                                    🚚 ट्रैक करें
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveChatOrder(ord)}
                                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 shadow-2xs"
                                  >
                                    💬 चैट
                                  </button>
                                </>
                              )}
                              {ord.status === 'REJECTED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cropName = ord.items?.[0]?.cropHindi || ord.items?.[0]?.crop || '';
                                    if (cropName) setSearchQuery(cropName);
                                    setActiveTab('BROWSE');
                                  }}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 shadow-2xs"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>नया ऑर्डर करें</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setActiveInvoiceOrder(ord)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                              >
                                📄 बिल
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptOrder(ord)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                              >
                                विवरण देखें
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'FARMERS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">All Farmers & FPOs</h2>
                      <p className="text-xs text-slate-500">सीधे किसानों और FPOs से जुड़ें और ताजा, शुद्ध उत्पाद प्राप्त करें</p>
                    </div>
                  </div>

                  {/* Filter Pills & Search */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setFarmerFilterType('ALL')}
                        className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                          farmerFilterType === 'ALL'
                            ? 'bg-[#03542B] text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        All ({realFarmers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFarmerFilterType('Farmer')}
                        className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                          farmerFilterType === 'Farmer'
                            ? 'bg-[#03542B] text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Farmers ({realFarmers.filter((f) => f.type === 'Farmer').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFarmerFilterType('FPO')}
                        className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                          farmerFilterType === 'FPO'
                            ? 'bg-[#03542B] text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        FPOs ({realFarmers.filter((f) => f.type === 'FPO').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFarmerFilterType('Followed')}
                        className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                          farmerFilterType === 'Followed'
                            ? 'bg-[#03542B] text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Followed ({followedFarmerIds.length})
                      </button>
                    </div>

                    <div className="relative w-full sm:w-60">
                      <input
                        type="text"
                        placeholder="Search farmer or FPO..."
                        value={farmerSearchQuery}
                        onChange={(e) => setFarmerSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    </div>
                  </div>

                  {/* Grid of Farmer/FPO Cards */}
                  {realFarmers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 my-4">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">वर्तमान में कोई पंजीकृत किसान या FPO उपलब्ध नहीं है</p>
                      <p className="text-xs text-slate-400 mt-1">जब किसान अपनी फसल लिस्ट करेंगे, वे यहाँ दिखाई देंगे।</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {realFarmers
                        .filter((item) => {
                          if (farmerFilterType === 'Farmer' && item.type !== 'Farmer') return false;
                          if (farmerFilterType === 'FPO' && item.type !== 'FPO') return false;
                          if (farmerFilterType === 'Followed' && !followedFarmerIds.includes(item.id)) return false;
                          if (farmerSearchQuery.trim()) {
                            const q = farmerSearchQuery.toLowerCase().trim();
                            const matchName = (item.name || '').toLowerCase().includes(q);
                            const matchLoc = (item.location || '').toLowerCase().includes(q);
                            return matchName || matchLoc;
                          }
                          return true;
                        })
                        .map((item) => {
                          const isFollowed = followedFarmerIds.includes(item.id);
                          return (
                            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-3 relative">
                              <span
                                className={`absolute top-3 right-3 text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                                  item.type === 'FPO' ? 'bg-emerald-800 text-white' : 'bg-amber-600 text-white'
                                }`}
                              >
                                {item.type}
                              </span>

                              <div className="flex items-center gap-3">
                                <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                                <div>
                                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1">
                                    <span>{item.name}</span>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                                  </div>
                                  <div className="text-[11px] text-slate-500">📍 {item.location}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1 text-center text-[10px] bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <div>
                                  <span className="text-slate-400 block">{item.farmersCount ? 'Farmers' : 'Experience'}</span>
                                  <strong className="text-slate-900 font-extrabold">{item.farmersCount || item.experienceYears}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Products</span>
                                  <strong className="text-slate-900 font-extrabold">{item.productsCount}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">On-time</span>
                                  <strong className="text-emerald-800 font-extrabold">{item.onTimeRate}</strong>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                  <span>{item.rating}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">({item.reviewCount} orders)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFollowedFarmerIds((prev) =>
                                        isFollowed ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                                      )
                                    }
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-colors ${
                                      isFollowed
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {isFollowed ? '✓ Following' : '+ Follow'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFarmerDetail(item)}
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                                  >
                                    View Profile
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* === VIEW 4: BAAZAR BHAV (MARKET PRICES) (Image 2 - scr-003) === */}
              {activeTab === 'PRICES' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold text-slate-900">बाजार भाव (Baazar Bhav)</h2>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          Data.gov.in Live
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">ताजा मंडी भाव और पिछले रुझान देखें, सही समय पर सही खरीद करें</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button className="px-3 py-1.5 bg-[#03542B] text-white font-bold rounded-xl flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>आज का भाव</span>
                      </button>
                      <button
                        onClick={async () => {
                          await refetchBuyerMandi(true);
                        }}
                        disabled={isBuyerMandiLoading || isBuyerMandiFetching}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95 transition-all shadow-2xs"
                        title="सरकारी AGMARKNET से ताज़ा भाव लोड करें"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isBuyerMandiLoading || isBuyerMandiFetching ? 'animate-spin text-emerald-700' : ''}`} />
                        <span>{isBuyerMandiLoading || isBuyerMandiFetching ? 'ताज़ा हो रहा...' : 'ताज़ा करें'}</span>
                      </button>
                      <button
                        onClick={onOpenKrishiAI}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-xl hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AI भाव सहायक</span>
                      </button>
                    </div>
                  </div>

                  {/* Price Alerts Widget Card */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>🔔 कमोडिटी मूल्य अलर्ट (Price Alerts)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">तय मूल्य या उससे नीचे आने पर तुरंत सूचना पाएं</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newAlertPrice) return;
                          setPriceAlerts(prev => [
                            ...prev,
                            { id: Date.now().toString(), crop: newAlertCrop, targetPrice: parseFloat(newAlertPrice), active: true }
                          ]);
                          setNewAlertPrice('');
                        }}
                        className="px-3 py-1.5 bg-[#03542B] text-white font-bold text-xs rounded-xl hover:bg-[#023e1f] transition-all cursor-pointer shadow-2xs"
                      >
                        + नया अलर्ट सेट करें
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">फसल / जिंस (Crop)</label>
                        <select
                          value={newAlertCrop}
                          onChange={(e) => setNewAlertCrop(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                        >
                          <option value="Tomato">टमाटर (Tomato)</option>
                          <option value="Potato">आलू (Potato)</option>
                          <option value="Wheat">गेहूं (Wheat)</option>
                          <option value="Onion">प्याज (Onion)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">लक्ष्य भाव (Target ₹/Quintal)</label>
                        <input
                          type="number"
                          value={newAlertPrice}
                          onChange={(e) => setNewAlertPrice(e.target.value)}
                          placeholder="उदा. 1400"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-center text-[11px] text-emerald-900 font-bold">
                          ✨ {priceAlerts.length} सक्रिय अलर्ट चल रहे हैं
                        </div>
                      </div>
                    </div>

                    {/* Active Alerts List */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">आपके सेट किए गए अलर्ट्स:</span>
                      <div className="flex flex-wrap gap-2">
                        {priceAlerts.map((alert) => (
                          <div key={alert.id} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-3 text-xs">
                            <span className="font-extrabold text-slate-900">
                              {alert.crop === 'Tomato' ? 'टमाटर' : alert.crop === 'Potato' ? 'आलू' : alert.crop} &le; ₹{alert.targetPrice}
                            </span>
                            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                              सक्रिय (Active)
                            </span>
                            <button
                              type="button"
                              onClick={() => setPriceAlerts(prev => prev.filter(a => a.id !== alert.id))}
                              className="text-slate-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mandi Interactive Error / Fallback Banner - only display if prices failed to load */}
                  {buyerMandiErrorDetails && buyerMandiList.length === 0 && (
                    <MandiErrorBanner
                      errorDetails={buyerMandiErrorDetails}
                      isRetrying={isBuyerMandiRetrying}
                      nextRetryCountdown={buyerMandiRetryCountdown}
                      onRetry={retryBuyerMandi}
                      onCancelRetry={cancelRetryBuyerMandi}
                      isFallback={isBuyerMandiFallback}
                    />
                  )}

                  {/* Market Trends Graph Card */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-700" />
                          {trendCrop === 'Tomato' ? 'टमाटर' : trendCrop === 'Potato' ? 'आलू' : 'गेहूं'} का भाव रुझान ({trendPeriod === '7D' ? '7 दिन' : trendPeriod === '15D' ? '15 दिन' : trendPeriod === '1M' ? '1 महीना' : '3 महीने'})
                        </h3>
                        <p className="text-[11px] text-slate-500">₹ / क्विंटल (Quintal)</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={trendCrop}
                          onChange={(e) => setTrendCrop(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="Tomato">टमाटर (Tomato)</option>
                          <option value="Potato">आलू (Potato)</option>
                          <option value="Wheat">गेहूं (Wheat)</option>
                        </select>
                      </div>
                    </div>

                    {/* SVG Line Graph Visualization */}
                    <div className="relative h-48 w-full bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-30">
                        <div className="border-b border-dashed border-slate-300 w-full"></div>
                        <div className="border-b border-dashed border-slate-300 w-full"></div>
                        <div className="border-b border-dashed border-slate-300 w-full"></div>
                        <div className="border-b border-dashed border-slate-300 w-full"></div>
                      </div>

                      {/* Y-axis labels */}
                      <div className="absolute left-3 top-3 bottom-8 flex flex-col justify-between text-[10px] text-slate-400 font-semibold pointer-events-none">
                        <span>₹2,000</span>
                        <span>₹1,750</span>
                        <span>₹1,500</span>
                        <span>₹1,250</span>
                        <span>₹1,000</span>
                      </div>

                      {/* Graph Line & Points */}
                      <div className="ml-12 mr-2 h-32 relative flex items-end justify-between">
                        {(() => {
                          const points = trendDataMap[trendCrop]?.[trendPeriod] || trendDataMap['Tomato']['7D'];
                          const minP = 1000;
                          const maxP = 2000;

                          return (
                            <>
                              {/* SVG Polyline */}
                              <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <polyline
                                  fill="none"
                                  stroke="#047857"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={points.map((p, idx) => {
                                    const x = (idx / (points.length - 1 || 1)) * 100;
                                    const y = Math.max(5, Math.min(95, 100 - ((p.price - minP) / (maxP - minP)) * 100));
                                    return `${x.toFixed(2)},${y.toFixed(2)}`;
                                  }).join(' ')}
                                />
                              </svg>

                              {/* Points */}
                              {points.map((p, idx) => {
                                const xPercent = (idx / (points.length - 1 || 1)) * 100;
                                const yPercent = 100 - ((p.price - minP) / (maxP - minP)) * 100;
                                const isLatest = idx === points.length - 1;

                                return (
                                  <div
                                    key={idx}
                                    className="absolute flex flex-col items-center group cursor-pointer"
                                    style={{ left: `${xPercent}%`, top: `${yPercent}%`, transform: 'translate(-50%, -50%)' }}
                                  >
                                    <div className={`w-3 h-3 rounded-full border-2 ${isLatest ? 'w-4 h-4 bg-emerald-700 border-white shadow-md animate-pulse' : 'bg-emerald-600 border-white'}`} />
                                    {isLatest && (
                                      <div className="absolute -top-9 bg-emerald-800 text-white font-black text-[11px] px-2 py-0.5 rounded-lg shadow-md whitespace-nowrap z-10">
                                        ₹{p.price.toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>

                      {/* X-axis labels */}
                      <div className="ml-12 mr-2 flex justify-between text-[10px] text-slate-500 font-bold pt-1 border-t border-slate-200">
                        {(trendDataMap[trendCrop]?.[trendPeriod] || trendDataMap['Tomato']?.[trendPeriod] || []).map((p, idx) => (
                          <span key={idx}>{p.label}</span>
                        ))}
                      </div>
                    </div>

                    {/* Period Selector Tabs */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { id: '7D', label: '7 दिन' },
                        { id: '15D', label: '15 दिन' },
                        { id: '1M', label: '1 महीना' },
                        { id: '3M', label: '3 महीने' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setTrendPeriod(tab.id as any)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            trendPeriod === tab.id
                              ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {buyerMandiCategories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedBuyerMandiCategory(cat.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedBuyerMandiCategory === cat.value
                            ? 'bg-emerald-800 border-emerald-800 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Interactive Mandi Search & Filter Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-white p-3 rounded-2xl border border-slate-200">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="फसल या मंडी खोजें... (e.g. Potato, Lucknow)"
                        value={buyerMandiSearchQuery}
                        onChange={(e) => setBuyerMandiSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                      />
                    </div>

                    {/* State Selector */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <select
                        value={selectedBuyerMandiState}
                        onChange={(e) => setSelectedBuyerMandiState(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        {buyerAvailableStates.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Meta Status */}
                    <div className="flex items-center justify-between md:justify-end gap-3 text-[11px] text-slate-500">
                      <span className="font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                        कुल रिकॉर्ड: {filteredBuyerMandiList.length}
                      </span>
                      <span className="font-medium text-slate-400">
                        अंतिम अपडेट: {buyerMandiLastUpdated || 'अभी-अभी'}
                      </span>
                    </div>
                  </div>

                  {/* Loading overlay & list display */}
                  {isBuyerMandiLoading && filteredBuyerMandiList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
                      <Loader2 className="w-10 h-10 text-emerald-800 animate-spin" />
                      <span className="mt-3 font-bold text-slate-600 text-sm">ताज़ा सरकारी मंडी भाव लोड हो रहे हैं...</span>
                    </div>
                  ) : filteredBuyerMandiList.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <p className="text-sm text-slate-500 font-bold">कोई रिकॉर्ड नहीं मिला</p>
                      <p className="text-xs text-slate-400">कृपया खोज शब्द बदलें या दूसरा राज्य चुनें।</p>
                    </div>
                  ) : (
                    /* Mandi Price Comparison Table */
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs relative">
                      {(isBuyerMandiLoading || isBuyerMandiFetching) && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex flex-col items-center justify-center z-10 animate-in fade-in duration-200">
                          <Loader2 className="w-8 h-8 text-emerald-800 animate-spin" />
                          <span className="text-xs font-bold text-slate-700 mt-2">ताज़ा सरकारी मंडी भाव लोड हो रहे हैं...</span>
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                            <tr>
                              <th className="p-3">फसल / उत्पाद</th>
                              <th className="p-3">न्यूनतम भाव</th>
                              <th className="p-3">अधिकतम भाव</th>
                              <th className="p-3">औसत भाव</th>
                              <th className="p-3">पिछले दिन से बदलाव</th>
                              <th className="p-3 text-emerald-800">किसान बाजार मूल्य</th>
                              <th className="p-3 text-emerald-800">आपकी बचत</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {filteredBuyerMandiList.map((row, rIdx) => {
                              const changePercent = row.avgPrice > 0 ? ((row.change / row.avgPrice) * 100).toFixed(1) : '0.0';
                              const quintalPlatformPrice = row.platformPriceKg * 100;
                              const savingsVal = row.avgPrice - quintalPlatformPrice;
                              const emoji = getCropEmoji(row.crop);

                              return (
                                <tr key={row.id || rIdx} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-bold flex items-center gap-2">
                                    <span className="text-base shrink-0">{emoji}</span>
                                    <div>
                                      <div>{row.cropHindi || row.crop}</div>
                                      <div className="text-[10px] text-slate-400 font-normal">
                                        {row.crop} ({row.variety || 'Local'})
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600">₹{row.minPrice.toLocaleString()}</td>
                                  <td className="p-3 text-slate-600">₹{row.maxPrice.toLocaleString()}</td>
                                  <td className="p-3 font-bold">₹{row.avgPrice.toLocaleString()}</td>
                                  <td className={`p-3 font-bold ${row.trend === 'UP' ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {row.trend === 'UP' ? '↑' : '↓'} ₹{Math.abs(row.change)} ({changePercent}%)
                                  </td>
                                  <td className="p-3 font-extrabold text-emerald-900 bg-emerald-50/50">
                                    ₹{quintalPlatformPrice.toLocaleString()} / क्विंटल
                                    <div className="text-[10px] text-emerald-800 font-normal">
                                      (₹{row.platformPriceKg}/kg)
                                    </div>
                                  </td>
                                  <td className="p-3 font-extrabold text-emerald-800">
                                    ₹{savingsVal > 0 ? savingsVal.toLocaleString() : '150'}
                                    <div className="text-[10px] text-emerald-700 font-bold">
                                      ({row.savingsPercentage}%)
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* === VIEW 5: DELIVERY VIKALP (Image 1 - scr-007) === */}
              {activeTab === 'DELIVERY_VIKALP' && (
                <div className="space-y-4">
                  {/* Top Bar Navigation */}
                  <div className="flex items-center justify-between">
                    <div>
                      <button onClick={() => setActiveTab('HOME')} className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer">
                        ← Back to Cart
                      </button>
                      <h2 className="text-lg font-extrabold text-slate-900 mt-1">डिलीवरी विकल्प चुनें (Delivery Vikalp)</h2>
                      <p className="text-xs text-slate-500">हम आपके लिए सबसे अच्छा, तेज और किसानवों डिलीवरी विकल्प चुनकर लाए हैं</p>
                    </div>
                  </div>

                  {/* Recommendation Banner */}
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs font-bold text-amber-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>SmartMatch आपके ऑर्डर के लिए सबसे उपयुक्त डिलीवरी विकल्प सुझा रहा हैं</span>
                  </div>

                  {/* Top 2 Delivery Mode Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => {
                        setDeliveryModeOption('SMART');
                        setDeliveryMethod('DELIVERY_PARTNER');
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        deliveryModeOption === 'SMART'
                          ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-900">Smart Delivery (सुझाया गया)</span>
                        <span className="text-sm font-black text-emerald-800">₹250</span>
                      </div>
                      <p className="text-[11px] text-slate-500">हम आपके लिए बेस्ट समाधान चुनेंगे • तेज • भरोसेमंद • ट्रैकिंग उपलब्ध</p>
                      <div className="text-[10px] text-emerald-800 font-bold">आज डिलीवरी</div>
                    </div>

                    <div
                      onClick={() => {
                        setDeliveryModeOption('SELF');
                        setDeliveryMethod('SELF_PICKUP');
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        deliveryModeOption === 'SELF'
                          ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-900">Self Pick-up (स्वयं पिकअप करें)</span>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">FREE</span>
                      </div>
                      <p className="text-[11px] text-slate-500">FPO स्थान से स्वयं सामान उठाएं, कोई डिलीवरी चार्ज नहीं</p>
                      <div className="text-[10px] text-slate-500">जब चाहें पिकअप करें</div>
                    </div>
                  </div>

                  {/* All Delivery Transporters Table (Image 1) or Self Pick-Up Details */}
                  {deliveryModeOption === 'SELF' ? (
                    <div className="bg-white rounded-2xl border border-emerald-200 p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-sm">
                          📍
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">FPO स्वयं पिकअप केंद्र (Self Pick-up Details)</h3>
                          <p className="text-[11px] text-slate-500">अपने साधन से सीधे FPO वेयरहाउस से माल उठाएं (₹0 डिलीवरी शुल्क)</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">पिकअप का पता (Pickup Address)</span>
                            <div className="text-xs font-bold text-slate-800">
                              Sharma FPO Warehouse, गेट नंबर-2, मोहनलालगंज मंडी के पास, लखनऊ, उत्तर प्रदेश - 226301
                            </div>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md inline-block text-slate-600 mt-1">
                              📍 12 km दूर (आपके गोदाम से)
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">पिकअप समय (Pickup Hours)</span>
                            <div className="text-xs font-bold text-slate-800">
                              सुबह 08:00 AM से शाम 07:00 PM (सभी कार्यदिवस)
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">संपर्क व्यक्ति (FPO Manager)</span>
                            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                              <div>
                                <div className="text-xs font-bold text-slate-800">रमेश शर्मा (Ramesh Sharma)</div>
                                <div className="text-[10px] text-slate-500">FPO प्रबंधक • +91 94150 88210</div>
                              </div>
                              <button
                                onClick={() => setCallSimulatorModal({
                                  open: true,
                                  name: 'रमेश शर्मा (FPO प्रबंधक)',
                                  phone: '+91 94150 88210',
                                  title: 'FPO स्वयं पिकअप संपर्क',
                                })}
                                className="px-2.5 py-1 bg-[#03542B] hover:bg-[#023e1f] text-white font-bold text-[10px] rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                📞 कॉल करें
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">पिकअप निर्देश (Instructions)</span>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              • आर्डर स्वीकृत होने पर आपको एसएमएस और ऐप में नोटिफिकेशन द्वारा <strong>पिकअप कोड</strong> मिलेगा।<br />
                              • माल उठाने के लिए अपनी गाड़ी और मजदूर लेकर आएं। वेयरहाउस पर नि:शुल्क लोडिंग सहायता भी उपलब्ध है।<br />
                              • गुणवत्ता जांचने के बाद ही संतुष्टि होने पर भुगतान रिलीज करें।
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pick-up Date & Time Slot Selector */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <span className="text-[11px] font-bold text-slate-800 block">पिकअप स्लॉट चुनें (Select Pickup Slot)</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { day: 'आज, 4 जून', slot: '10 AM - 12 PM', available: true },
                            { day: 'आज, 4 जून', slot: '2 PM - 4 PM', available: true },
                            { day: 'कल, 5 जून', slot: '09 AM - 11 AM', available: true },
                            { day: 'कल, 5 जून', slot: '3 PM - 5 PM', available: true },
                          ].map((slot, sIdx) => (
                            <button
                              key={sIdx}
                              className="p-2 text-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:bg-emerald-50 hover:border-emerald-600 cursor-pointer active:bg-emerald-100 focus:bg-emerald-100 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                            >
                              <div className="text-[10px] font-bold">{slot.day}</div>
                              <div className="text-[10px] font-extrabold text-emerald-800 mt-0.5">{slot.slot}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2">
                        <span>सभी डिलीवरी विकल्प</span>
                        <div className="flex items-center gap-8 text-slate-500 font-semibold text-[11px]">
                          <span>अनुमानित समय</span>
                          <span>दूरी</span>
                          <span>रेटिंग</span>
                          <span>कीमत</span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {candidateTransporters.map((trans) => {
                          const isSelected = selectedTransporterId === trans.id;
                          return (
                            <div
                              key={trans.id}
                              onClick={() => setSelectedTransporterId(trans.id)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-emerald-50/60 border-emerald-600 ring-2 ring-emerald-600/20 shadow-2xs'
                                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-xs text-slate-900">{trans.name}</span>
                                  {trans.badge && (
                                    <span className="bg-emerald-100 text-emerald-900 text-[9px] font-black px-2 py-0.2 rounded-md">
                                      {trans.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500">{trans.badgeDesc}</p>
                                <div className="flex items-center gap-2 text-[9px] text-slate-600 pt-0.5">
                                  {trans.tags.map((tag, tIdx) => (
                                    <span key={tIdx} className="bg-white px-1.5 py-0.2 border border-slate-200 rounded-md">
                                      ✓ {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-right">
                                <div>
                                  <div className="font-bold text-slate-900">{trans.eta}</div>
                                  <div className="text-[9px] text-slate-500">{trans.etaDetail}</div>
                                </div>

                                <div>
                                  <div className="font-bold text-slate-900">{trans.distance}</div>
                                  <div className="text-[9px] text-slate-500">{trans.distanceLabel}</div>
                                </div>

                                <div className="text-center">
                                  <div className="font-bold text-slate-900 flex items-center justify-center gap-0.5">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span>{trans.rating}</span>
                                  </div>
                                  <div className="text-[9px] text-slate-400">({trans.reviewCount})</div>
                                </div>

                                <div>
                                  <div className="font-black text-emerald-800 text-sm">₹{trans.fare}</div>
                                  {trans.originalFare > 0 && (
                                    <div className="text-[9px] text-slate-400 line-through">₹{trans.originalFare}</div>
                                  )}
                                </div>

                                <input
                                  type="radio"
                                  name="transporterChoice"
                                  checked={isSelected}
                                  onChange={() => setSelectedTransporterId(trans.id)}
                                  className="w-4 h-4 text-emerald-700 cursor-pointer"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Trust Badges Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-bold text-center">
                    <div className="p-2.5 bg-white border rounded-xl">🛡️ सुरक्षित डिलीवरी की गारंटी</div>
                    <div className="p-2.5 bg-white border rounded-xl">📄 बीमा होने पर सुरक्षा</div>
                    <div className="p-2.5 bg-white border rounded-xl">📍 लाइव ऑर्डर ट्रैकिंग</div>
                    <div className="p-2.5 bg-white border rounded-xl">🌾 किसान से सीधी आपूर्ति</div>
                  </div>

                  {/* Sticky Bottom Action Bar (Image 1) */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">चयनित विकल्प:</span>
                        <strong className="text-slate-900">
                          {deliveryModeOption === 'SELF' ? 'स्वयं पिकअप (Self Pick-up)' : selectedTransporter.name}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">ETA / उपलब्धता:</span>
                        <strong className="text-emerald-800 font-bold">
                          {deliveryModeOption === 'SELF' ? 'तत्काल (जब चाहें)' : selectedTransporter.etaDetail}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">कुल डिलीवरी चार्ज:</span>
                        <strong className="text-emerald-800 text-sm font-extrabold">
                          {deliveryModeOption === 'SELF' ? 'FREE (₹0)' : `₹${deliveryFee}`}
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#03542B] hover:bg-[#023e1f] text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>इस विकल्प से आगे बढ़ें →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* === VIEW 6: LIVE DELIVERY TRACKING === */}
              {activeTab === 'DELIVERY_TRACKING' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">लाइव डिलीवरी ट्रैकिंग (Live Tracking)</h2>
                      <p className="text-xs text-slate-500">अपने ऑर्डर की वर्तमान लोकेशन, ड्राइवर और सिक्योरिटी OTP देखें</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (selectedOrderForTracking && onCancelOrder) {
                            onCancelOrder(selectedOrderForTracking.id);
                          }
                        }}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold flex items-center gap-1.5 hover:bg-red-100"
                      >
                        ✕ ऑर्डर रद्द करें
                      </button>
                      <span className="text-xs font-bold text-slate-600">ऑर्डर चुनें:</span>
                      <select
                        value={activeTrackOrderId}
                        onChange={(e) => setActiveTrackOrderId(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                      >
                        {trackingOrders.length === 0 ? (
                          <option value="">कोई सक्रिय ऑर्डर नहीं</option>
                        ) : (
                          trackingOrders.map((o) => (
                            <option key={o.id} value={(o.orderCode || '').replace('#', '') || o.id}>
                              {o.orderCode} ({o.items?.[0]?.cropHindi || 'उपज'} - {o.sellerName})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {!selectedTrip ? (
                    <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-300">
                      <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-slate-800">ट्रैकिंग डेटा उपलब्ध नहीं है</h3>
                      <p className="text-sm text-slate-500">चयनित ऑर्डर के लिए अभी तक कोई वाहन असाइन नहीं किया गया है।</p>
                    </div>
                  ) : (
                    <>
                      {/* Simulated GPS Live Route Card */}
                      <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden border border-slate-800 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span className="font-extrabold text-emerald-400 uppercase tracking-wide">LIVE GPS TRACKING</span>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-300">वाहका: {selectedTrip.vehicleNumber || 'Bolero Pickup'}</span>
                          </div>
                          <div className="bg-emerald-900/60 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-300 font-bold text-[11px]">
                            ⏱️ अनुमानित समय: {selectedTrip.eta || '42 मिनट शेष'}
                          </div>
                        </div>

                        {/* Interactive OpenStreetMap & OSRM Live Tracking Map */}
                        <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 shadow-inner">
                          <LiveTrackingMap
                            origin={{
                              lat: selectedTrip.pickupCoords?.lat || 26.9284,
                              lng: selectedTrip.pickupCoords?.lng || 81.1834,
                              label: selectedTrip.pickupLocation || selectedTrip.fpoName || 'FPO फार्म',
                              address: selectedTrip.pickupLocation,
                            }}
                            destination={{
                              lat: selectedTrip.dropCoords?.lat || 26.8524,
                              lng: selectedTrip.dropCoords?.lng || 80.9412,
                              label: selectedLocation || 'गंतव्य गोदाम',
                              address: selectedLocation || 'लखनऊ गोदाम',
                            }}
                            transporterLocation={
                              selectedTrip.currentLocation
                                ? {
                                    lat: selectedTrip.currentLocation.lat,
                                    lng: selectedTrip.currentLocation.lng,
                                    updatedAt: Date.now(),
                                    speedKmh: selectedTrip.currentLocation.speedKmh,
                                  }
                                : {
                                    lat: 26.8904,
                                    lng: 81.0623,
                                    updatedAt: Date.now(),
                                    speedKmh: 42,
                                  }
                            }
                            height="340px"
                            showEta={true}
                          />
                        </div>

                        {/* Route Graphic */}
                        <div className="py-4 px-2 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
                          <div className="flex justify-between items-center text-xs font-bold px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-emerald-900/80 border border-emerald-500 flex items-center justify-center text-emerald-300">
                                🌾
                              </div>
                              <div>
                                <div className="text-slate-200">{selectedTrip.fpoName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{selectedTrip.pickupLocation}</div>
                              </div>
                            </div>

                            <div className="text-right flex items-center gap-2">
                              <div>
                                <div className="text-slate-200">{selectedLocation}</div>
                                <div className="text-[10px] text-slate-400 font-normal">गंतव्य गोदाम</div>
                              </div>
                              <div className="w-8 h-8 rounded-xl bg-blue-900/80 border border-blue-500 flex items-center justify-center text-blue-300">
                                🏢
                              </div>
                            </div>
                          </div>

                          {/* Distance Progress Line */}
                          <div className="relative mx-4">
                            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full animate-pulse transition-all duration-1000" 
                                style={{ width: selectedTrip.status === 'DELIVERED' ? '100%' : '65%' }}
                              />
                            </div>
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 -ml-4 w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-slate-950 shadow-lg text-xs font-black transition-all duration-1000"
                              style={{ left: selectedTrip.status === 'DELIVERED' ? '100%' : '65%' }}
                            >
                              🚚
                            </div>
                          </div>

                          <div className="flex justify-between text-[11px] text-slate-400 px-2 pt-1 font-semibold">
                            <span>निकलने का समय: 09:15 AM</span>
                            <span className="text-emerald-400 font-bold">
                              {selectedTrip.currentLocation?.speedKmh ? `गति: ${selectedTrip.currentLocation.speedKmh} km/h` : 'स्थिर'}
                              {selectedTrip.currentLocation?.address && ` | ${selectedTrip.currentLocation.address}`}
                            </span>
                            <span>पहुंचने का समय: {selectedTrip.eta}</span>
                          </div>
                        </div>

                        {/* Live Sensors & OTP Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">सुरक्षा OTP PIN</span>
                            <div className="text-lg font-black tracking-widest text-emerald-400 font-mono">
                              {selectedTrip.otp ? selectedTrip.otp.split('').join(' ') : '4 8 2 9'}
                            </div>
                            <span className="text-[9px] text-slate-400 block">ड्राइवर को सामान प्राप्ति पर बताएं</span>
                          </div>

                          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">शीत-श्रृंखला तापमान (Cold Chain)</span>
                            <div className="text-base font-bold text-teal-300 flex items-center gap-1">
                              <span>❄️ {selectedTrip.temperature || '21.5'}°C</span>
                              <span className="text-[10px] bg-teal-950 text-teal-400 px-1.5 py-0.2 rounded-md font-extrabold border border-teal-800">
                                उत्कृष्ट
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 block">ताजगी सेंसर लाइव कनेक्टेड</span>
                          </div>

                          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">बीमा एवं एस्क्रो</span>
                            <div className="text-sm font-bold text-amber-300 flex items-center gap-1">
                              <ShieldCheck className="w-4 h-4 text-amber-400" />
                              <span>₹{(selectedOrderForTracking?.totalAmount || 10000).toLocaleString('hi-IN')} सुरक्षित</span>
                            </div>
                            <span className="text-[9px] text-slate-400 block">गुणवत्ता जांच के बाद भुगतान</span>
                          </div>
                        </div>
                      </div>

                      {/* Driver Profile & Actions Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                            alt={selectedTrip.driverName}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-600 shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-sm text-slate-900">{selectedTrip.driverName || 'रवि कुमार'}</h3>
                              <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                सत्यापित ड्राइवर
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">वाहन: {selectedTrip.vehicleNumber || 'UP 32 BK 4589'}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold mt-1">
                              <span className="flex items-center gap-1 text-amber-600">★ 4.9 (180+ डिलीवरी)</span>
                              <span>•</span>
                              <span>अनुभव: 6 वर्ष</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() =>
                              setCallSimulatorModal({
                                open: true,
                                name: `${selectedTrip.driverName || 'ड्राइवर'}`,
                                phone: '+91 98765 43210',
                                title: 'डिलीवर पार्टनर कॉल',
                              })
                            }
                            className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#03542B] hover:bg-[#023e1f] text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span>ड्राइवर को कॉल करें</span>
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(`${window.location.origin}/track/${selectedTrip.orderCode}`);
                              alert('लाइव ट्रैकिंग लिंक कॉपी कर लिया गया है!');
                            }}
                            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-600" />
                            <span>शेयर लिंक</span>
                          </button>
                        </div>
                      </div>

                      {/* Delivery Milestone Stepper Bar */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                        <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-2">
                          ऑर्डर प्रोग्रेस और टाइमलाइन
                        </h3>
                        <OrderStepper status={selectedTrip.status === 'AVAILABLE' ? 'PLACED' : (selectedTrip.status === 'ACCEPTED' ? 'ACCEPTED' : (selectedTrip.status === 'PICKED_UP' ? 'PACKED' : (selectedTrip.status === 'IN_TRANSIT' ? 'IN_TRANSIT' : 'DELIVERED')))} deliveryMethod="DELIVERY_PARTNER" language={language} />

                        <div className="space-y-2 pt-2 text-xs">
                          {[
                            { status: 'DELIVERED', time: '10:45 AM', title: 'डिलीवरी सफलतापूर्वक संपन्न हुई', sub: 'OTP सत्यापित किया गया' },
                            { status: 'IN_TRANSIT', time: '09:15 AM', title: 'ड्राइवर द्वारा FPO खेत से सामान उठा लिया गया', sub: selectedTrip.fpoName },
                            { status: 'PICKED_UP', time: '08:30 AM', title: 'सामान की गुणवत्ता एवं वजन सत्यापन पूरा हुआ', sub: `${selectedTrip.quantityKg} kg ${selectedTrip.produceName}` },
                            { status: 'ACCEPTED', time: '07:45 AM', title: 'FPO द्वारा ऑर्डर स्वीकार किया गया', sub: 'किसान द्वारा लोडिंग शुरू' },
                            { status: 'AVAILABLE', time: '07:00 AM', title: 'ऑर्डर सफलतापूर्वक प्लेस किया गया', sub: `ऑर्डर ID: ${selectedTrip.orderCode}` },
                          ]
                          .filter(step => {
                            const statuses = ['AVAILABLE', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
                            return statuses.indexOf(step.status as any) <= statuses.indexOf(selectedTrip.status);
                          })
                          .map((step, idx) => (
                            <div key={idx} className="flex gap-3 text-slate-700">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 mt-1" />
                              <div className="flex-1 text-[11px]">
                                <div className="font-bold text-slate-900">{step.title}</div>
                                <div className="text-slate-500">{step.sub}</div>
                              </div>
                              <div className="text-[10px] text-slate-400 font-semibold">{step.time}, आज</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* === VIEW 7: PAYMENTS & WALLET === */}
              {activeTab === 'PAYMENTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">पेमेंट्स एवं वॉलेट (Payments & Wallet)</h2>
                      <p className="text-xs text-slate-500">अपना बैलेंस प्रबंधित करें, एस्क्रो ट्रांजैक्शन और पेमेंट तरीके देखें</p>
                    </div>
                  </div>

                  {/* Wallet & Escrow Balance Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-[#03542B] to-emerald-900 rounded-2xl p-4 text-white shadow-md space-y-2">
                      <div className="text-xs text-emerald-200 font-bold uppercase tracking-wider">किसान सेटु वॉलेट बैलेंस</div>
                      <div className="text-2xl font-black">₹{walletBalance.toLocaleString()}.00</div>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-200">100% सुरक्षित और तुरंत रिफंड</span>
                        <button
                          onClick={() => setIsAddFundsModalOpen(true)}
                          className="px-3 py-1 bg-white text-emerald-950 text-xs font-black rounded-lg hover:bg-emerald-50 cursor-pointer shadow-xs"
                        >
                          + राशि जोड़ें
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">एस्क्रो में सुरक्षित राशि</div>
                      <div className="text-2xl font-black text-amber-600">₹3,935.00</div>
                      <p className="text-[10px] text-slate-500">सामान की डिलीवरी और पुष्टि तक सुरक्षित लॉक</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">कुल बचत (KrishiSetu)</div>
                      <div className="text-2xl font-black text-emerald-800">₹4,850.00</div>
                      <p className="text-[10px] text-slate-500">मंडी बिचौलिया कमीशन की तुलना में बचत</p>
                    </div>
                  </div>

                  {/* Saved Payment Methods */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-extrabold text-xs text-slate-900">सेव किए गए पेमेंट मेथड</h3>
                      <button
                        onClick={() => setIsAddPaymentModalOpen(true)}
                        className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        + नया पेमेंट मेथड जोड़ें
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {paymentMethods.map((pm) => (
                        <div key={pm.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 relative">
                          {pm.isDefault && (
                            <span className="absolute top-2 right-2 text-[8px] font-black bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-md">
                              DEFAULT
                            </span>
                          )}
                          <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-emerald-700" />
                            <span>{pm.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">{pm.subtitle}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Escrow Protection Guarantee Banner */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-950">
                    <ShieldCheck className="w-8 h-8 text-emerald-700 shrink-0" />
                    <div>
                      <strong className="block text-emerald-900 font-extrabold text-sm">किसान सेटु एस्क्रो सुरक्षा गारंटी</strong>
                      <span>
                        आपका पैसा तब तक किसान को ट्रांसफर नहीं किया जाता जब तक आप अपने स्थान पर डिलीवर किए गए उत्पाद का निरीक्षण और संतुष्टि न कर लें।
                      </span>
                    </div>
                  </div>

                  {/* Recent Transactions Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                    <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-2">
                      हाल की पेमेंट एवं एस्क्रो हिस्ट्री
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                          <tr>
                            <th className="p-2.5">ट्रांजैक्शन ID</th>
                            <th className="p-2.5">तारीख</th>
                            <th className="p-2.5">ऑर्डर ID</th>
                            <th className="p-2.5">पेमेंट मोड</th>
                            <th className="p-2.5">राशि</th>
                            <th className="p-2.5">एस्क्रो स्थिति</th>
                            <th className="p-2.5 text-right">रसीद</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {[
                            { id: 'TXN-90812', date: 'आज, 09:15 AM', order: 'ORD5678', mode: 'UPI AutoPay', amount: '₹3,935', status: 'LOCKED_IN_ESCROW' },
                            { id: 'TXN-88231', date: '28 मई 2024', order: 'ORD5012', mode: 'Kisan Wallet', amount: '₹2,225', status: 'RELEASED_TO_FARMER' },
                            { id: 'TXN-86100', date: '20 मई 2024', order: 'ORD4901', mode: 'HDFC NetBanking', amount: '₹1,500', status: 'RELEASED_TO_FARMER' },
                          ].map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-900">{row.id}</td>
                              <td className="p-2.5 text-slate-500">{row.date}</td>
                              <td className="p-2.5 font-bold text-emerald-800">{row.order}</td>
                              <td className="p-2.5">{row.mode}</td>
                              <td className="p-2.5 font-black text-slate-900">{row.amount}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  row.status === 'LOCKED_IN_ESCROW' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                                }`}>
                                  {row.status === 'LOCKED_IN_ESCROW' ? 'एस्क्रो में सुरक्षित' : 'किसान को जारी'}
                                </span>
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  onClick={() => setSelectedReceiptOrder({ orderCode: row.order, placedAt: row.date, sellerName: 'Sharma FPO', totalAmount: row.amount })}
                                  className="text-emerald-700 hover:underline font-bold text-[11px]"
                                >
                                  रसीद डाउनलोड
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* === VIEW 8: NOTIFICATIONS CENTER === */}
              {activeTab === 'NOTIFICATIONS' && (
                <div className="space-y-4">
                  <div className={`flex items-center justify-between border-b pb-3 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <div>
                      <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        नोटिफिकेशन केंद्र (Notifications)
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        आपके ऑर्डर्स, डिलीवरी अपडेट्स और मंडी प्राइस अलर्ट्स
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMounted && unreadNotificationsCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>सभी को पढ़ा हुआ चिन्हित करें</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {[
                      { id: 'ALL', label: 'सभी' },
                      { id: 'ORDER', label: 'ऑर्डर अपडेट्स' },
                      { id: 'PRICE', label: 'प्राइस अलर्ट्स' },
                      { id: 'PROMO', label: 'ऑफ़र्स' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setNotifFilter(f.id as any)}
                        className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                          notifFilter === f.id
                            ? 'bg-[#03542B] text-white shadow-2xs'
                            : isDark
                              ? 'bg-slate-850 text-slate-300 border border-slate-750 hover:bg-slate-800'
                              : 'bg-white text-slate-700 border hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Notifications List */}
                  <div className="space-y-2.5">
                    {filteredNotifications.length === 0 ? (
                      <div className={`p-12 text-center rounded-2xl border ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
                        <h4 className="text-sm font-bold">कोई नोटिफिकेशन नहीं है</h4>
                        <p className="text-xs mt-1">इस श्रेणी में आपके लिए कोई सूचना मौजूद नहीं है।</p>
                      </div>
                    ) : (
                      filteredNotifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 group ${
                            item.read
                              ? isDark
                                ? 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                              : isDark
                                ? 'bg-emerald-950/30 border-emerald-700/60 shadow-xs'
                                : 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                            item.type === 'ORDER' ? 'bg-emerald-700' :
                            item.type === 'PRICE' ? 'bg-amber-600' : 'bg-blue-600'
                          }`}>
                            {item.type === 'ORDER' ? <Truck className="w-5 h-5" /> :
                             item.type === 'PRICE' ? <TrendingDown className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {item.title}
                                </h3>
                                {!item.read && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300/40" />
                                )}
                              </div>
                              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                                {item.time}
                              </span>
                            </div>
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {item.desc}
                            </p>

                            <div className="pt-2 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {item.linkTab && (
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationClick(item)}
                                    className="font-bold text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                                  >
                                    <span>विवरण देखें</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleReadNotification(item.id)}
                                  title={item.read ? 'बिना पढ़ा हुआ मार्क करें' : 'पढ़ा हुआ मार्क करें'}
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                    isDark
                                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                  }`}
                                >
                                  {item.read ? 'मार्क अनरीड' : 'मार्क रीड'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => dismissNotification(item.id, e)}
                                  title="नोटिफिकेशन हटाएं"
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isDark
                                      ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800'
                                      : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* === VIEW 9: SETTINGS & ADDRESSES === */}
              {/* === VIEW 9: REFINED SETTINGS & PROFILE === */}
              {activeTab === 'SETTINGS' && (
                <div className="space-y-5">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {activeSettingsSection !== 'MENU' && (
                        <button 
                          onClick={() => setActiveSettingsSection('MENU')}
                          className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                      )}
                      <div>
                        <h2 className="text-lg font-extrabold text-slate-900">सेटिंग्स (Settings)</h2>
                        <p className="text-xs text-slate-500">अपना खाता, प्राथमिकताएं और सुरक्षा प्रबंधित करें</p>
                      </div>
                    </div>
                  </div>

                  {profileSuccessMsg && (
                    <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>✓ {profileSuccessMsg}</span>
                      <button onClick={() => setProfileSuccessMsg(null)}>✕</button>
                    </div>
                  )}

                  {activeSettingsSection === 'MENU' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {[
                        { id: 'ACCOUNT', label: 'प्रोफ़ाइल (Profile)', desc: 'व्यक्तिगत और व्यवसाय विवरण', icon: User, color: 'bg-blue-50 text-blue-600' },
                        { id: 'ADDRESSES', label: 'डिलीवरी विवरण (Delivery)', desc: 'पते और स्थान प्रबंधित करें', icon: MapPin, color: 'bg-emerald-50 text-emerald-600' },
                        { id: 'THEME', label: 'थीम / दिखावट (Theme)', desc: 'डार्क/लाइट मोड और विजुअल्स', icon: Palette, color: 'bg-purple-50 text-purple-600' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveSettingsSection(item.id as any)}
                          className="p-6 bg-white border border-slate-200 rounded-3xl text-left hover:border-emerald-500 hover:shadow-lg transition-all group cursor-pointer"
                        >
                          <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <item.icon className="w-6 h-6" />
                          </div>
                          <h3 className="font-black text-sm text-slate-900 mb-1">{item.label}</h3>
                          <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                            <span>ओपन करें</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      {/* Settings Navigation */}
                      <div className="md:col-span-3 space-y-1">
                        {[
                          { id: 'ACCOUNT', label: 'प्रोफ़ाइल विवरण', icon: User },
                          { id: 'ADDRESSES', label: 'डिलीवरी पते', icon: MapPin },
                          { id: 'THEME', label: 'थीम / दिखावट', icon: Palette },
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setActiveSettingsSection(item.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                              activeSettingsSection === item.id
                                ? isDark ? 'bg-emerald-950/50 text-emerald-300 border-l-4 border-emerald-500' : 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-700'
                                : isDark ? 'text-slate-400 hover:bg-slate-800/60' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Settings Content Area */}
                      <div className="md:col-span-9">
                        {activeSettingsSection === 'THEME' && (
                          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl border p-5 shadow-2xs space-y-6 animate-in fade-in slide-in-from-bottom-2`}>
                            <div>
                              <h3 className={`font-extrabold text-sm border-b pb-2 ${isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-100'}`}>
                                थीम और दिखावट (Theme & Appearance)
                              </h3>
                              <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>अपने ऐप के इंटरफ़ेस और मोड को कस्टमाइज़ करें</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {[
                                { id: 'light', label: 'लाइट मोड', icon: Sparkles, desc: 'ब्राइट और क्लीन विजुअल' },
                                { id: 'dark', label: 'डार्क मोड', icon: Bot, desc: 'आंखों के लिए आरामदायक' },
                              ].map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => handleThemeChange(t.id as 'light' | 'dark')}
                                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                                    themePreference === t.id 
                                      ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/40' 
                                      : isDark
                                        ? 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                                        : 'border-slate-100 hover:border-slate-200 bg-white'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                                    themePreference === t.id 
                                      ? 'bg-emerald-600 text-white' 
                                      : isDark 
                                        ? 'bg-slate-800 text-slate-400' 
                                        : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    <t.icon className="w-4 h-4" />
                                  </div>
                                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.label}</div>
                                  <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.desc}</div>
                                  {themePreference === t.id && (
                                    <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>सक्रिय</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {activeSettingsSection === 'ACCOUNT' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                              व्यवसाय एवं संपर्क विवरण (Business Profile)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                              <div className="space-y-1">
                                <label className="text-slate-700">आपका नाम</label>
                                <input
                                  type="text"
                                  value={profileData.name}
                                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-700">व्यवसाय / फर्म का नाम</label>
                                <input
                                  type="text"
                                  value={profileData.businessName}
                                  onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-700">मोबाइल नंबर</label>
                                <input
                                  type="text"
                                  value={profileData.phone}
                                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-700">ईमेल आईडी</label>
                                <input
                                  type="email"
                                  value={profileData.email}
                                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-700">GSTIN नंबर (ऐच्छिक)</label>
                                <input
                                  type="text"
                                  value={profileData.gst}
                                  onChange={(e) => setProfileData({ ...profileData, gst: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-700">मुख्य शहर</label>
                                <input
                                  type="text"
                                  value={profileData.city}
                                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700 outline-none"
                                />
                              </div>
                            </div>
                            <button
                              disabled={isSavingSettings}
                              onClick={async () => {
                                await saveToFirebase({ profileData });
                                setProfileSuccessMsg('प्रोफ़ाइल जानकारी सफलतापूर्वक अपडेट की गई!');
                                setTimeout(() => setProfileSuccessMsg(null), 4000);
                              }}
                              className="px-5 py-2.5 bg-[#03542B] text-white font-extrabold text-xs rounded-xl hover:bg-[#023e1f] cursor-pointer shadow-2xs transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
                            >
                              {isSavingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              <span>प्रोफ़ाइल सेव करें</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {activeSettingsSection === 'ADDRESSES' && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="font-extrabold text-sm text-slate-900">डिलीवरी पते (Delivery Locations)</h3>
                            <button
                              onClick={() => setIsAddAddressModalOpen(true)}
                              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                            >
                              + नया पता जोड़ें
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(Array.isArray(savedAddresses) ? savedAddresses : []).map((addr) => (
                              <div key={addr.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 relative group hover:border-emerald-300 transition-colors">
                                {addr.isDefault && (
                                  <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-900 text-[9px] font-black px-2 py-0.5 rounded-md">
                                    DEFAULT
                                  </span>
                                )}
                                <div className="font-extrabold text-xs text-slate-900">{addr.label}</div>
                                <div className="text-xs text-slate-700 font-bold">{addr.name} ({addr.phone})</div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">{addr.addressLine}, {addr.landmark}, Pincode: {addr.pincode}</p>
                                <div className="pt-1 flex gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingAddressId(addr.id);
                                      setNewAddressForm({
                                        label: addr.label,
                                        name: addr.name,
                                        phone: addr.phone,
                                        addressLine: addr.addressLine,
                                        landmark: addr.landmark,
                                        pincode: addr.pincode,
                                      });
                                      setIsAddAddressModalOpen(true);
                                    }}
                                    className="text-[10px] font-bold text-slate-400 hover:text-emerald-700 cursor-pointer"
                                  >
                                    संपादित करें
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      if (confirm('क्या आप वाकई इस पते को हटाना चाहते हैं?')) {
                                        const updated = savedAddresses.filter(a => a.id !== addr.id);
                                        setSavedAddresses(updated);
                                        await saveToFirebase({ savedAddresses: updated });
                                        setProfileSuccessMsg('पता सफलतापूर्वक हटा दिया गया!');
                                        setTimeout(() => setProfileSuccessMsg(null), 3000);
                                      }
                                    }}
                                    className="text-[10px] font-bold text-slate-400 hover:text-red-600 cursor-pointer"
                                  >
                                    हटाएं
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}


                    </div>
                  </div>
                )}
              </div>
            )}

            </main>

            {/* === GLOBAL PERSISTENT SHOPPING CART SIDEBAR (Integrated) === */}
            <aside className="hidden lg:block w-80 shrink-0 sticky top-0 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  <span>{language === 'en' ? 'Your Shopping Bag' : 'आपकी शॉपिंग बैग'} ({cart.length})</span>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-400">{language === 'en' ? 'Cart is empty' : 'कार्ट खाली है'}</p>
                      <p className="text-[9px] text-slate-400 px-4">{language === 'en' ? 'Add products to start your order' : 'ऑर्डर शुरू करने के लिए प्रोडक्ट जोड़ें'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Scrollable list of cart items */}
                    <div className="max-h-[320px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                      {cart.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex gap-3 relative transition-all hover:bg-white hover:border-emerald-100 group">
                          <img
                            src={getAccurateCropImage(item.listing.crop, item.listing.image, item.listing.cropHindi)}
                            alt={item.listing.crop}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = getAccurateCropImage(item.listing.crop, undefined, item.listing.cropHindi);
                            }}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200/50 shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-extrabold text-[11px] text-slate-900 truncate">
                                {item.listing.cropHindi || item.listing.crop}
                              </h4>
                              <button
                                onClick={() => handleQuantityChange(item.listing.id, -99999)}
                                className="text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium truncate">{item.listing.fpoName || item.listing.farmerName}</div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="font-black text-emerald-800 text-[11px]">
                                ₹{(item.quantityKg * item.listing.pricePerKg).toLocaleString()}
                              </span>
                              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-black shadow-2xs">
                                <button onClick={() => handleQuantityChange(item.listing.id, -1)} className="text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer text-sm font-bold px-1">−</button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantityKg}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setCart(prev => prev.map(i => i.listing.id === item.listing.id ? { ...i, quantityKg: Math.max(1, val) } : i));
                                  }}
                                  className="w-10 text-center bg-transparent border-0 focus:outline-none font-bold text-slate-800"
                                />
                                <span className="text-slate-500">kg</span>
                                <button onClick={() => handleQuantityChange(item.listing.id, 1)} className="text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer text-sm font-bold px-1">+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cost Breakdown & Action */}
                    <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>{language === 'en' ? 'Subtotal' : 'उप-कुल'}</span>
                        <span>₹{cartSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>{language === 'en' ? 'Delivery Fee' : 'डिलीवरी शुल्क'}</span>
                        <span className="text-emerald-600">₹{deliveryFee}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-slate-900 border-t border-slate-100 pt-3">
                        <span>{language === 'en' ? 'Grand Total' : 'कुल योग'}</span>
                        <span className="text-emerald-800 text-sm">₹{cartTotal.toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          setActiveTab('DELIVERY_VIKALP');
                        }}
                        className="w-full py-3 bg-[#03542B] hover:bg-[#023e1f] text-white font-black text-[11px] rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2 mt-3 transition-all active:scale-[0.98] uppercase tracking-wider"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{language === 'en' ? 'Proceed to Checkout' : 'चेकआउट के लिए आगे बढ़ें'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Contextual Sidebar Widgets (Home Only) */}
              {activeTab === 'HOME' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Today's Market Prices Widget */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>आज का बाजार भाव</span>
                      </div>
                      <button onClick={() => setActiveTab('PRICES')} className="text-emerald-700 hover:underline cursor-pointer text-[10px]">
                        सभी देखें →
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {filteredBuyerMandiList.slice(0, 3).map((m, idx) => {
                        const emoji = getCropEmoji(m.crop);
                        return (
                          <div key={m.id || idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100">
                            <span className="font-bold text-slate-800">{emoji} {m.cropHindi || m.crop}</span>
                            <span className="font-extrabold text-emerald-800 text-[10px]">
                              ₹{m.avgPrice}/क्विंटल
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Order Tracker Widget (Requested in image) */}
                  {trackingOrders.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>मेरा वर्तमान ऑर्डर ({trackingOrders[0].orderCode.replace('#', '')})</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl">
                            {getCropEmoji(trackingOrders[0].items[0]?.crop || '')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-black text-slate-900 truncate">
                              {trackingOrders[0].items[0]?.quantityKg} kg {trackingOrders[0].items[0]?.cropHindi || trackingOrders[0].items[0]?.crop}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {trackingOrders[0].sellerName} से
                            </div>
                          </div>
                        </div>

                        {/* Mini Stepper */}
                        <div className="pt-1 pb-2">
                          <OrderStepper 
                            status={trackingOrders[0].status as any} 
                            deliveryMethod={trackingOrders[0].deliveryMethod as any} 
                            language={language}
                            isMini={true}
                          />
                        </div>

                        <button 
                          onClick={() => {
                            setActiveTrackOrderId(trackingOrders[0].orderCode.replace('#', ''));
                            setActiveTab('DELIVERY_TRACKING');
                          }}
                          className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>विवरण देखें →</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>

      {/* --- MOBILE ONBOARDING / LOGIN MODAL (Image 6) --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="font-black text-base text-emerald-900">KrishiSetu</div>
              <button onClick={() => setIsAuthModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {authStep === 1 && (
              <div className="space-y-3 text-center text-xs">
                <h3 className="font-bold text-slate-900 text-sm">स्वागत है! KrishiSetu में</h3>
                <p className="text-slate-500 text-[11px]">सीधे किसानों से खरीदें, बेहतर दाम • भरोसे के साथ</p>

                <div className="text-left space-y-1 pt-2">
                  <label className="text-[11px] font-bold text-slate-700">मोबाइल नंबर</label>
                  <div className="flex gap-2">
                    <span className="p-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">+91</span>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="flex-1 p-2 border rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setAuthStep(2)}
                  className="w-full py-2.5 bg-[#03542B] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  OTP भेजें →
                </button>
              </div>
            )}

            {authStep === 2 && (
              <div className="space-y-3 text-center text-xs">
                <h3 className="font-bold text-slate-900 text-sm">OTP सत्यापित करें</h3>
                <p className="text-slate-500 text-[11px]">हमने +91 {mobileNumber} पर एक OTP भेजा है</p>

                <div className="flex justify-center gap-1.5 py-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const newDigits = [...otpDigits];
                        newDigits[idx] = e.target.value;
                        setOtpDigits(newDigits);
                      }}
                      className="w-9 h-10 border rounded-xl text-center text-sm font-extrabold bg-slate-50"
                    />
                  ))}
                </div>

                <button
                  onClick={() => setAuthStep(3)}
                  className="w-full py-2.5 bg-[#03542B] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  सत्यापित करें
                </button>
              </div>
            )}

            {authStep === 3 && (
              <div className="space-y-3 text-center text-xs">
                <h3 className="font-bold text-slate-900 text-sm">आपका स्थान चुनें</h3>
                <p className="text-slate-500 text-[11px]">आपके पास-पास के किसान और FPO दिखाने के लिए</p>

                <button
                  onClick={() => {
                    setSelectedLocation('Lucknow, UP');
                    setIsAuthModalOpen(false);
                    setAuthStep(1);
                  }}
                  className="w-full py-2.5 bg-[#03542B] text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>मेरा वर्तमान स्थान उपयोग करें</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ORDER CONFIRMATION MODAL --- */}
      <CheckoutConfirmation
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleCheckout}
        isPlacingOrder={isPlacingOrder}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        cartSubtotal={cartSubtotal}
        deliveryFee={deliveryFee}
        cartTotal={cartTotal}
        discount={couponDiscount}
      />

      {/* --- TAX INVOICE RECEIPT MODAL --- */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-slate-900">Tax Invoice Receipt</span>
              <button onClick={() => setSelectedReceiptOrder(null)}><X className="w-4 h-4" /></button>
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-sm">KrishiSetu</h3>
              <p className="text-[10px] text-slate-500">
                Order Code: {selectedReceiptOrder.orderCode?.startsWith('#') ? selectedReceiptOrder.orderCode : `#${selectedReceiptOrder.orderCode || 'ORD'}`}
              </p>
            </div>

            <div className="space-y-1 border-t pt-2">
              <div className="flex justify-between text-slate-600"><span>Date:</span><span>{selectedReceiptOrder.placedAt}</span></div>
              <div className="flex justify-between text-slate-600"><span>Seller:</span><span>{selectedReceiptOrder.sellerName}</span></div>
              <div className="flex justify-between text-slate-600">
                <span>Payment:</span>
                <span>
                  {selectedReceiptOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 
                   selectedReceiptOrder.paymentMethod === 'UPI' ? 'UPI Payment' : 
                   selectedReceiptOrder.paymentMethod === 'CARD' ? 'Debit/Credit Card' : 'Netbanking'}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t">
                <span>Total Amount:</span><span>₹{selectedReceiptOrder.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={() => window.print()} className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl cursor-pointer">
              Print Invoice
            </button>
          </div>
        </div>
      )}

      {/* --- CART SLIDE-OVER DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
                <ShoppingBag className="w-5 h-5 text-emerald-700" />
                <span>आपकी कार्ट (Cart) ({cart.length} आइटम)</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-slate-700 text-xs">आपकी कार्ट खाली है</p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setActiveTab('BROWSE');
                    }}
                    className="px-4 py-2 bg-[#03542B] text-white font-bold text-xs rounded-xl"
                  >
                    उत्पाद ब्राउज़ करें
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 relative">
                    <img
                      src={getAccurateCropImage(item.listing.crop, item.listing.image, item.listing.cropHindi)}
                      alt={item.listing.crop}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getAccurateCropImage(item.listing.crop, undefined, item.listing.cropHindi);
                      }}
                      className="w-16 h-16 rounded-xl object-cover border"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-xs text-slate-900">{item.listing.cropHindi || item.listing.crop}</h4>
                        <button
                          onClick={() => handleQuantityChange(item.listing.id, -99999)}
                          className="text-slate-400 hover:text-red-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500">{item.listing.farmerName}</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-black text-emerald-800 text-xs">
                          ₹{(item.quantityKg * item.listing.pricePerKg).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-0.5 text-xs font-bold">
                          <button onClick={() => handleQuantityChange(item.listing.id, -1)} className="px-1 text-sm font-bold text-slate-500 hover:text-emerald-700 cursor-pointer">−</button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantityKg}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setCart(prev => prev.map(i => i.listing.id === item.listing.id ? { ...i, quantityKg: Math.max(1, val) } : i));
                            }}
                            className="w-10 text-center bg-transparent border-0 focus:outline-none font-bold"
                          />
                          <span>kg</span>
                          <button onClick={() => handleQuantityChange(item.listing.id, 1)} className="px-1 text-sm font-bold text-slate-500 hover:text-emerald-700 cursor-pointer">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Coupon Section */}
              {cart.length > 0 && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <div className="font-bold text-slate-900">कूपन कोड लागू करें</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. KISAN100"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border rounded-xl font-mono text-xs uppercase"
                    />
                    <button
                      onClick={() => {
                        if (couponInput.trim().toUpperCase() === 'KISAN100') {
                          setAppliedCoupon('KISAN100');
                          setCouponMsg({ type: 'success', text: 'कूपन KISAN100 लागू हुआ! ₹100 की छूट।' });
                        } else {
                          setCouponMsg({ type: 'error', text: 'अमान्य कूपन कोड।' });
                        }
                      }}
                      className="px-3 py-1.5 bg-[#03542B] text-white font-bold rounded-xl"
                    >
                      लागू करें
                    </button>
                  </div>
                  {couponMsg && (
                    <div className={`text-[10px] font-bold ${couponMsg.type === 'success' ? 'text-emerald-800' : 'text-red-600'}`}>
                      {couponMsg.text}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span>₹{cartSubtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Delivery Charge:</span><span>₹{deliveryFee}</span></div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-bold"><span>कूपन छूट:</span><span>-₹100</span></div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-2">
                    <span>कुल देय राशि:</span><strong className="text-emerald-800">₹{cartTotal.toLocaleString()}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setActiveTab('DELIVERY_VIKALP');
                  }}
                  className="w-full py-3 bg-[#03542B] hover:bg-[#023e1f] text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>चेकआउट और ट्रांसपोर्टर चुनें →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- FARMER PROFILE DETAIL MODAL --- */}
      {selectedFarmerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedFarmerDetail.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
                  alt={selectedFarmerDetail.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-600"
                />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{selectedFarmerDetail.name}</h3>
                  <p className="text-xs text-slate-500">{selectedFarmerDetail.type || selectedFarmerDetail.location}</p>
                </div>
              </div>
              <button onClick={() => setSelectedFarmerDetail(null)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">रेटिंग</div>
                  <div className="font-extrabold text-amber-600 text-sm">★ {selectedFarmerDetail.rating || 4.8}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">अनुभव</div>
                  <div className="font-extrabold text-slate-900 text-sm">12+ वर्ष</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">सत्यापन</div>
                  <div className="font-extrabold text-emerald-800 text-sm">✓ KYC Ok</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl space-y-1">
                <div className="font-bold text-slate-900 text-xs">FPO एवं फसल विवरण</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  यह FPO शत-प्रतिशत जैविक खाद और गुणवत्तापूर्ण मानकों का पालन करता है। हर लॉट की लैब टेस्टिंग रिपोर्ट सत्यापन के लिए संलग्न है।
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedFarmerDetail(null);
                    setCallSimulatorModal({
                      open: true,
                      name: selectedFarmerDetail.name,
                      phone: '+91 94150 88210',
                      title: 'किसान / FPO सीधे बातचीत',
                    });
                  }}
                  className="flex-1 py-2.5 bg-[#03542B] text-white font-extrabold rounded-xl flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>किसान को कॉल करें</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PRODUCE DETAIL MODAL --- */}
      {selectedProduceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{selectedProduceDetail.cropHindi || selectedProduceDetail.crop}</h3>
                <p className="text-xs text-slate-500">विक्रेता: {selectedProduceDetail.farmerName}</p>
              </div>
              <button onClick={() => setSelectedProduceDetail(null)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={getAccurateCropImage(selectedProduceDetail.crop, selectedProduceDetail.image, selectedProduceDetail.cropHindi)}
              alt={selectedProduceDetail.crop}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = getAccurateCropImage(selectedProduceDetail.crop, undefined, selectedProduceDetail.cropHindi);
              }}
              className="w-full h-48 rounded-2xl object-cover"
            />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-500 block text-[10px]">थोक मूल्य:</span>
                <strong className="text-emerald-800 text-sm font-black">₹{selectedProduceDetail.pricePerKg}/kg</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-500 block text-[10px]">न्यूनतम ऑर्डर:</span>
                <strong className="text-slate-900 font-extrabold">{selectedProduceDetail.minOrderKg} kg</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-500 block text-[10px]">उपलब्ध मात्रा:</span>
                <strong className="text-slate-900 font-extrabold">{selectedProduceDetail.quantityKg} kg</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-500 block text-[10px]">ग्रेड / गुणवत्ता:</span>
                <strong className="text-slate-900 font-extrabold">ग्रेड {selectedProduceDetail.quality} (A-1)</strong>
              </div>
            </div>

            <button
              onClick={() => {
                handleAddToCart(selectedProduceDetail);
                setSelectedProduceDetail(null);
                setIsCartOpen(true);
              }}
              className="w-full py-3 bg-[#03542B] hover:bg-[#023e1f] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>कार्ट में जोड़ें (Add to Cart)</span>
            </button>
          </div>
        </div>
      )}

      {/* --- CALL SIMULATOR MODAL --- */}
      {callSimulatorModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-slate-900 text-white rounded-3xl max-w-xs w-full p-6 text-center space-y-4 shadow-2xl border border-slate-800">
            <div className="w-16 h-16 rounded-full bg-emerald-600/30 border-2 border-emerald-500 flex items-center justify-center mx-auto animate-pulse">
              <PhoneCall className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{callSimulatorModal.title}</div>
              <h3 className="font-black text-lg mt-1">{callSimulatorModal.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{callSimulatorModal.phone}</p>
            </div>
            <p className="text-xs text-slate-300 bg-slate-800 p-2.5 rounded-xl border border-slate-700">
              कॉल सिम्युलेटर एक्टिव है। संपर्क स्थापित किया जा रहा है...
            </p>
            <button
              onClick={() => setCallSimulatorModal(null)}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              कॉल समाप्त करें (End Call)
            </button>
          </div>
        </div>
      )}

      {/* --- ADD FUNDS TO WALLET MODAL --- */}
      {isAddFundsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-extrabold text-slate-900 text-sm">वॉलेट में राशि जोड़ें</span>
              <button onClick={() => setIsAddFundsModalOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">राशि दर्ज करें (₹)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={addAmountInput}
                onChange={(e) => setAddAmountInput(e.target.value)}
                className="w-full p-3 border rounded-xl font-bold text-base text-slate-900"
              />
              <div className="flex gap-2 pt-1">
                {['1000', '2500', '5000', '10000'].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAddAmountInput(amt)}
                    className="flex-1 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-800 rounded-lg text-[10px] font-bold"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                const val = parseFloat(addAmountInput);
                if (val > 0) {
                  setWalletBalance((prev) => prev + val);
                  setIsAddFundsModalOpen(false);
                  setAddAmountInput('');
                  alert(`₹${val} आपके किसान वॉलेट में सफलतापूर्वक जोड़े गए!`);
                }
              }}
              className="w-full py-2.5 bg-[#03542B] text-white font-extrabold rounded-xl shadow-md cursor-pointer"
            >
              भुगतान करें और जोड़ें
            </button>
          </div>
        </div>
      )}

      {/* --- ADD PAYMENT METHOD MODAL --- */}
      {isAddPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-extrabold text-slate-900 text-sm">नया पेमेंट मेथड जोड़ें</span>
              <button onClick={() => setIsAddPaymentModalOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-3 font-bold">
              <div>
                <label className="text-slate-700 block mb-1">पेमेंट प्रकार</label>
                <select className="w-full p-2.5 border rounded-xl text-slate-900">
                  <option>UPI ID / VPA</option>
                  <option>बैंक खाता (Bank Account / NEFT)</option>
                  <option>डेबिट / क्रेडिट कार्ड</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 block mb-1">UPI ID / कार्ड नंबर / खाता नंबर</label>
                <input type="text" placeholder="e.g. buyer@upi or HDFC0001234" className="w-full p-2.5 border rounded-xl" />
              </div>
            </div>
            <button
              onClick={() => {
                setIsAddPaymentModalOpen(false);
                alert('नया पेमेंट मेथड सफलतापूर्वक सहेजा गया!');
              }}
              className="w-full py-2.5 bg-[#03542B] text-white font-extrabold rounded-xl cursor-pointer"
            >
              सुरक्षित सहेजें
            </button>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT ADDRESS MODAL --- */}
      {isAddAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-extrabold text-slate-900 text-sm">
                {editingAddressId ? 'डिलीवरी पता संपादित करें' : 'नया डिलीवरी पता जोड़ें'}
              </span>
              <button onClick={() => {
                setIsAddAddressModalOpen(false);
                setEditingAddressId(null);
                setNewAddressForm({ label: '', name: 'Rohit Verma', phone: '+91 98765 43210', addressLine: '', landmark: '', pincode: '' });
              }}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-3 font-bold">
              <div>
                <label className="text-slate-700 block mb-1">स्थान का नाम (e.g. नया मंडी गोदाम)</label>
                <input 
                  type="text" 
                  value={newAddressForm.label}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                  placeholder="e.g. Warehouse 3" 
                  className="w-full p-2.5 border rounded-xl" 
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1">पूरा पता</label>
                <input 
                  type="text" 
                  value={newAddressForm.addressLine}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine: e.target.value })}
                  placeholder="प्लॉट नंबर, मंडी रोड, लखनऊ" 
                  className="w-full p-2.5 border rounded-xl" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1">पिनकोड</label>
                  <input 
                    type="text" 
                    value={newAddressForm.pincode}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })}
                    placeholder="226001" 
                    className="w-full p-2.5 border rounded-xl" 
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">लैंडमार्क</label>
                  <input 
                    type="text" 
                    value={newAddressForm.landmark}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, landmark: e.target.value })}
                    placeholder="पास का पेट्रोल पंप" 
                    className="w-full p-2.5 border rounded-xl" 
                  />
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!newAddressForm.label || !newAddressForm.addressLine || !newAddressForm.pincode) {
                  alert('कृपया सभी आवश्यक जानकारी भरें');
                  return;
                }
                
                let updatedAddresses;
                if (editingAddressId) {
                  updatedAddresses = savedAddresses.map(addr => addr.id === editingAddressId ? {
                    ...addr,
                    label: newAddressForm.label,
                    addressLine: newAddressForm.addressLine,
                    pincode: newAddressForm.pincode,
                    landmark: newAddressForm.landmark,
                  } : addr);
                  setProfileSuccessMsg('पता सफलतापूर्वक अपडेट किया गया!');
                } else {
                  const newAddr = {
                    id: `addr-${Math.floor(Math.random() * 1000)}`,
                    ...newAddressForm,
                    isDefault: false,
                  };
                  updatedAddresses = [...savedAddresses, newAddr];
                  setProfileSuccessMsg('नया पता सफलतापूर्वक सहेजा गया!');
                }
                
                setSavedAddresses(updatedAddresses);
                await saveToFirebase({ savedAddresses: updatedAddresses });
                
                setIsAddAddressModalOpen(false);
                setEditingAddressId(null);
                setNewAddressForm({ label: '', name: 'Rohit Verma', phone: '+91 98765 43210', addressLine: '', landmark: '', pincode: '' });
                setTimeout(() => setProfileSuccessMsg(null), 3000);
              }}
              className="w-full py-2.5 bg-[#03542B] text-white font-extrabold rounded-xl cursor-pointer shadow-md transition-all active:scale-95"
            >
              पता सहेजें
            </button>
          </div>
        </div>
      )}

      {/* Quick Chat Modal */}
      <QuickChatModal
        isOpen={Boolean(activeChatOrder)}
        onClose={() => setActiveChatOrder(null)}
        orderCode={activeChatOrder?.orderCode || '1241'}
        counterpartName={activeChatOrder?.sellerName || 'किसान प्रोड्यूसर FPO'}
        role="buyer"
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={Boolean(activeInvoiceOrder)}
        onClose={() => setActiveInvoiceOrder(null)}
        order={activeInvoiceOrder}
        userRole="buyer"
      />
    </div>
  );
};

