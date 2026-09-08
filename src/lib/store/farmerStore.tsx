'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../firebase/client';
import { getFirebaseBearerToken, logoutFirebase } from '../firebase/authClient';
import {
  fetchFarmerProfile,
  fetchFarmerListings,
  fetchFarmerOrders,
  acceptFarmerOrder,
  rejectFarmerOrder,
  updateFarmerListing,
  deleteFarmerListing,
  pauseFarmerListing,
} from '../api/client';
import {
  UserProfile,
  ProduceItem,
  OrderItem,
  MarketPriceItem,
  FPOMemberItem,
} from '../seedData';
import { getAccurateCropImage } from '../cropImages';

interface FarmerStoreContextType {
  user: UserProfile;
  listings: ProduceItem[];
  orders: OrderItem[];
  marketPrices: MarketPriceItem[];
  fpoMembers: FPOMemberItem[];
  notificationsCount: number;
  isOffline: boolean;
  toggleEntityKind: () => void;
  addListing: (listing: any) => string;
  updateListing: (id: string, updates: Partial<ProduceItem>) => Promise<void> | void;
  deleteListing: (id: string) => Promise<void> | void;
  pauseListing: (id: string) => Promise<void> | void;
  acceptOrder: (orderId: string) => void | Promise<void>;
  rejectOrder: (orderId: string) => void | Promise<void>;
  addFPOMember: (member: Omit<FPOMemberItem, 'id' | 'joinedDate'>) => void;
  aggregateFPOLot: (memberIds: string[], crop: string) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  loadProfileFromSupabase: () => Promise<void>;
  refreshListings: () => Promise<void>;
  logout: () => Promise<void>;
  getListingById: (id: string) => ProduceItem | undefined;
  getOrderById: (id: string) => OrderItem | undefined;
}

const EMPTY_USER: UserProfile = {
  id: '',
  fullName: 'किसान साथी',
  fatherOrSpouseName: '',
  phone: '',
  dob: '',
  gender: 'पुरुष',
  role: 'FARMER_FPO',
  entityKind: 'farmer',
  verificationStatus: 'PENDING',
  aadhaarLast4: '',
  registrationDate: new Date().toISOString(),
  avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300',
  village: 'ग्राम बहरामघाट',
  postOffice: '',
  district: 'बाराबंकी',
  state: 'उत्तर प्रदेश',
  pincode: '225001',
  fpoName: '',
  memberCount: 0,
  onTimePct: 100,
};

const FarmerStoreContext = createContext<FarmerStoreContextType | undefined>(undefined);

export const FarmerStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(EMPTY_USER);
  const [listings, setListings] = useState<ProduceItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [marketPrices] = useState<MarketPriceItem[]>([]);
  const [fpoMembers, setFpoMembers] = useState<FPOMemberItem[]>([]);
  const [notificationsCount] = useState<number>(0);
  const [isOffline] = useState<boolean>(false);

  const loadProfileFromSupabase = async () => {
    try {
      const res = await fetchFarmerProfile();
      if (res.success && res.data?.user) {
        setUser((prev) => {
          const merged = { ...prev, ...res.data!.user };
          if (typeof window !== 'undefined') {
            localStorage.setItem('krishi_user_profile', JSON.stringify(merged));
          }
          return merged;
        });
      }
    } catch (err) {
      console.warn('Profile load note:', err);
    }
  };

  const refreshListings = async () => {
    try {
      const res = await fetchFarmerListings();
      if (res.success && Array.isArray(res.data)) {
        setListings(res.data);
      }
    } catch (err) {
      console.warn('refreshListings error:', err);
    }
  };

  const loadDataFromSupabase = async () => {
    try {
      await loadProfileFromSupabase();
      const [listingsRes, ordersRes] = await Promise.all([
        fetchFarmerListings(),
        fetchFarmerOrders(),
      ]);
      if (listingsRes.success && Array.isArray(listingsRes.data)) {
        setListings(listingsRes.data);
      }
      if (ordersRes.success && Array.isArray(ordersRes.data)) {
        setOrders(ordersRes.data);
      }
    } catch (err) {
      console.warn('Store hydration note:', err);
    }
  };

  const logout = async () => {
    await logoutFirebase();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('krishi_user_profile');
    }
    setUser(EMPTY_USER);
    setListings([]);
    setOrders([]);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('krishi_user_profile');
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch (e) {}
      }
      loadDataFromSupabase();

      if (firebaseAuth && typeof onAuthStateChanged === 'function') {
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
          if (fbUser) {
            await loadDataFromSupabase();
          }
        });
        return () => unsubscribe();
      }
    }
  }, []);

  const toggleEntityKind = () => {
    setUser((prev) => ({
      ...prev,
      entityKind: prev.entityKind === 'farmer' ? 'fpo' : 'farmer',
    }));
  };

  const addListing = (newListingData: any): string => {
    const id = newListingData.id || crypto.randomUUID();
    const newListing: ProduceItem = {
      ...newListingData,
      id,
      farmerId: newListingData.farmerId || user.id,
      viewsCount: newListingData.viewsCount || 0,
      ordersCount: newListingData.ordersCount || 0,
      updatedAt: newListingData.updatedAt || new Date().toISOString(),
    };
    setListings((prev) => [newListing, ...prev.filter((item) => item.id !== id)]);
    return id;
  };

  const updateListing = async (id: string, updates: Partial<ProduceItem>) => {
    setListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
    try {
      await updateFarmerListing(id, updates);
      await refreshListings();
    } catch (e) {
      console.warn('Update listing sync note:', e);
    }
  };

  const deleteListing = async (id: string) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteFarmerListing(id);
      await refreshListings();
    } catch (e) {
      console.warn('Delete listing sync note:', e);
    }
  };

  const pauseListing = async (id: string) => {
    const current = listings.find((l) => l.id === id);
    const newStatus = current?.status === 'PAUSED' || current?.status === 'INACTIVE' ? 'ACTIVE' : 'PAUSED';
    setListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
    try {
      await pauseFarmerListing(id, current?.status || 'ACTIVE');
      await refreshListings();
    } catch (e) {
      console.warn('Pause listing sync note:', e);
    }
  };

  const acceptOrder = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const isDelivery = ord.deliveryMode === 'DELIVERY_PARTNER';
          return {
            ...ord,
            status: isDelivery ? 'IN_TRANSIT' : 'ACCEPTED',
          };
        }
        return ord;
      })
    );

    try {
      await acceptFarmerOrder(orderId);
      const res = await fetchFarmerOrders();
      if (res.success && res.data) setOrders(res.data);
    } catch (e) {
      console.warn('Accept order API sync note:', e);
    }
  };

  const rejectOrder = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: 'CANCELLED' } : ord))
    );

    try {
      await rejectFarmerOrder(orderId);
      const res = await fetchFarmerOrders();
      if (res.success && res.data) setOrders(res.data);
    } catch (e) {
      console.warn('Reject order API sync note:', e);
    }
  };

  const addFPOMember = (member: Omit<FPOMemberItem, 'id' | 'joinedDate'>) => {
    const newMember: FPOMemberItem = {
      ...member,
      id: `mem_${Date.now()}`,
      joinedDate: 'आज',
    };
    setFpoMembers((prev) => [newMember, ...prev]);
  };

  const aggregateFPOLot = (memberIds: string[], crop: string) => {
    const selected = fpoMembers.filter((m) => memberIds.includes(m.id));
    const totalKg = selected.reduce((sum, m) => sum + m.totalHarvestKg, 0);

    addListing({
      cropNameHindi: crop,
      cropNameEnglish: crop,
      category: 'Aggregated Lot',
      quantityKg: totalKg,
      availableQtyKg: totalKg,
      minOrderQtyKg: 100,
      unit: 'kg',
      grade: 'A',
      askingPricePerKg: 25,
      marketPriceRange: '₹24–₹27/kg',
      freshnessWindowHours: 48,
      harvestDate: new Date().toISOString(),
      locationVillage: user.village,
      locationDistrict: user.district,
      locationState: user.state,
      availability: 'TODAY',
      status: 'ACTIVE',
      imageUrl: getAccurateCropImage(crop),
    });
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const merged = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem('krishi_user_profile', JSON.stringify(merged));
      }
      return merged;
    });
  };

  const getListingById = (id: string) => listings.find((l) => l.id === id);
  const getOrderById = (id: string) => orders.find((o) => o.id === id);

  return (
    <FarmerStoreContext.Provider
      value={{
        user,
        listings,
        orders,
        marketPrices,
        fpoMembers,
        notificationsCount,
        isOffline,
        toggleEntityKind,
        addListing,
        updateListing,
        deleteListing,
        pauseListing,
        acceptOrder,
        rejectOrder,
        addFPOMember,
        aggregateFPOLot,
        updateUserProfile,
        loadProfileFromSupabase,
        refreshListings,
        logout,
        getListingById,
        getOrderById,
      }}
    >
      {children}
    </FarmerStoreContext.Provider>
  );
};

export const useFarmerStore = () => {
  const context = useContext(FarmerStoreContext);
  if (!context) {
    throw new Error('useFarmerStore must be used within a FarmerStoreProvider');
  }
  return context;
};
