'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  UserProfile,
  ProduceItem,
  OrderItem,
  MarketPriceItem,
  FPOMemberItem,
  INITIAL_USER,
  INITIAL_PRODUCE,
  INITIAL_ORDERS,
  INITIAL_MARKET_PRICES,
  INITIAL_FPO_MEMBERS,
} from '../seedData';

interface FarmerStoreContextType {
  user: UserProfile;
  listings: ProduceItem[];
  orders: OrderItem[];
  marketPrices: MarketPriceItem[];
  fpoMembers: FPOMemberItem[];
  notificationsCount: number;
  isOffline: boolean;
  toggleEntityKind: () => void;
  addListing: (listing: Omit<ProduceItem, 'id' | 'farmerId' | 'viewsCount' | 'ordersCount' | 'updatedAt'>) => string;
  updateListing: (id: string, updates: Partial<ProduceItem>) => void;
  deleteListing: (id: string) => void;
  pauseListing: (id: string) => void;
  acceptOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  addFPOMember: (member: Omit<FPOMemberItem, 'id' | 'joinedDate'>) => void;
  aggregateFPOLot: (memberIds: string[], crop: string) => void;
  getListingById: (id: string) => ProduceItem | undefined;
  getOrderById: (id: string) => OrderItem | undefined;
}

const FarmerStoreContext = createContext<FarmerStoreContextType | undefined>(undefined);

export const FarmerStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [listings, setListings] = useState<ProduceItem[]>(INITIAL_PRODUCE);
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [marketPrices] = useState<MarketPriceItem[]>(INITIAL_MARKET_PRICES);
  const [fpoMembers, setFpoMembers] = useState<FPOMemberItem[]>(INITIAL_FPO_MEMBERS);
  const [notificationsCount] = useState<number>(3);
  const [isOffline] = useState<boolean>(false);

  const toggleEntityKind = () => {
    setUser((prev) => ({
      ...prev,
      entityKind: prev.entityKind === 'farmer' ? 'fpo' : 'farmer',
    }));
  };

  const addListing = (
    newListingData: Omit<ProduceItem, 'id' | 'farmerId' | 'viewsCount' | 'ordersCount' | 'updatedAt'>
  ): string => {
    const id = `prod_${Date.now()}`;
    const newListing: ProduceItem = {
      ...newListingData,
      id,
      farmerId: user.id,
      viewsCount: 1,
      ordersCount: 0,
      updatedAt: 'अभी अभी',
    };
    setListings((prev) => [newListing, ...prev]);
    return id;
  };

  const updateListing = (id: string, updates: Partial<ProduceItem>) => {
    setListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: 'अभी अपडेट' } : item))
    );
  };

  const deleteListing = (id: string) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
  };

  const pauseListing = (id: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === 'EXPIRED' ? 'ACTIVE' : 'EXPIRED' } : item
      )
    );
  };

  const acceptOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const isDelivery = ord.deliveryMode === 'DELIVERY_PARTNER';
          return {
            ...ord,
            status: isDelivery ? 'IN_TRANSIT' : 'ACCEPTED',
            transporterName: isDelivery ? 'संदीप कुमार' : undefined,
            transporterPhone: isDelivery ? '98123 45678' : undefined,
            vehicleDetails: isDelivery ? 'UP32 AB 1234 (छोटा ट्रक)' : undefined,
            trackingEta: isDelivery ? '03:30 PM (2घं 10मि)' : undefined,
            distanceKm: isDelivery ? 24 : 0,
            freshnessRemainingHours: 20,
          };
        }
        return ord;
      })
    );
  };

  const rejectOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: 'CANCELLED' } : ord))
    );
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
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=300',
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
