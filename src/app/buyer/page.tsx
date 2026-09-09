'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BuyerPortal } from '@/components/buyer/BuyerPortal';
import { LanguageProvider } from '@/context/LanguageContext';
import { KrishiAIAssistantModal } from '@/components/common/KrishiAIAssistantModal';
import {
  MARKET_PRICES,
} from '@/data/mockData';
import {
  fetchFarmerListings,
  fetchFarmerOrders,
  createBuyerOrder,
  getApiUrl,
  getAuthHeaders,
} from '@/lib/api/client';
import { globalOrderManager } from '@/lib/globalOrderManager';
import {
  updateOrder,
  updateTransporterTrip,
  subscribeOrders,
  subscribeProduceListings,
  subscribeTransporterTrips,
} from '@/lib/firebase';
import { logisticsSync } from '@/lib/realtime/logisticsSync';
import {
  ProduceListing,
  Order,
  TransporterTrip,
  MarketPrice,
  FPOProfile,
  OrderStatus,
} from '@/types';
import { getAccurateCropImage } from '@/lib/cropImages';

function BuyerPortalPageInner() {
  const router = useRouter();

  // Active Role Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishi_active_role', 'BUYER');
    }
  }, []);

  // State
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trips, setTrips] = useState<TransporterTrip[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>(MARKET_PRICES);
  const [fpos, setFpos] = useState<FPOProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);

  // Reusable loader for listings & orders
  const loadData = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();

      // 1. Fetch live produce listings
      try {
        const listRes = await fetchFarmerListings();
        if (listRes?.success && Array.isArray(listRes.data) && listRes.data.length > 0) {
          const backendListings: ProduceListing[] = listRes.data.map((item: any) => ({
            id: item.id || `live-${Math.random()}`,
            crop: item.crop || item.cropNameEnglish || item.crop_name || 'Produce',
            cropHindi: item.cropHindi || item.cropNameHindi || item.crop_hindi || item.crop || 'ताज़ा उपज',
            category: item.category || 'Vegetables',
            variety: item.variety || 'Desi',
            quantityKg: Number(item.quantityKg ?? item.availableQtyKg ?? item.totalQuantityKg ?? item.quantity_kg ?? item.quantity ?? 100),
            availableQtyKg: Number(item.availableQtyKg ?? item.quantityKg ?? item.quantity ?? 100),
            minOrderKg: Number(item.minOrderKg ?? item.minOrderQtyKg ?? item.min_order_quantity ?? item.min_order_kg ?? 10),
            pricePerKg: Number(item.pricePerKg ?? item.askingPricePerKg ?? item.price_per_kg ?? 25),
            marketPricePerKg: Number(item.marketPricePerKg ?? item.mandiBenchmarkPrice ?? item.market_price ?? (Number(item.pricePerKg || item.askingPricePerKg || 25) + 4)),
            quality: (item.quality || item.qualityGrade || item.grade || 'A') as 'A' | 'B' | 'C',
            harvestDate: item.harvestDate || new Date().toISOString().split('T')[0],
            cultivationLocation: item.cultivationLocation || (item.locationVillage ? `${item.locationVillage}, ${item.locationDistrict || 'बाराबंकी'}` : item.locationDistrict) || 'बाराबंकी, उत्तर प्रदेश',
            freshnessWindowHours: Number(item.freshnessWindowHours ?? item.freshnessDurationHours ?? 48),
            perishable: true,
            status: item.status || 'ACTIVE',
            viewsCount: Number(item.viewsCount || 1),
            image: getAccurateCropImage(
              item.crop || item.cropNameEnglish || item.crop_name,
              item.imageUrl || item.image || item.photoUrl || (item.images && item.images[0]),
              item.cropHindi || item.cropNameHindi || item.crop_hindi
            ),
            farmerName: item.farmerName || 'सत्यापित किसान संघ',
            fpoName: item.fpoName || item.farmerName || 'Kisan FPO',
            distanceKm: Number(item.distanceKm || 14),
            rating: Number(item.rating || 4.8),
          }));
          setListings(backendListings);
        }
      } catch (e) {}

      // 2. Fetch live buyer orders
      try {
        const ordersRes = await fetchFarmerOrders();
        if (ordersRes?.success && Array.isArray(ordersRes.data) && ordersRes.data.length > 0) {
          const backendOrders: Order[] = ordersRes.data.map((o: any) => ({
            id: o.id || `ord-${Math.random()}`,
            orderCode: o.orderNumber || o.order_code || '#ORD1245',
            buyerName: o.buyerName || 'क्रेता साथी',
            buyerPhone: o.buyerPhone || '+91 98765 12345',
            sellerName: o.farmerName || 'Sharma FPO',
            sellerPhone: '98765 43210',
            items: [
              {
                id: `item-${o.id}`,
                listingId: o.listingId || 'prod-1',
                crop: o.cropNameEnglish || o.crop || 'Produce',
                cropHindi: o.cropNameHindi || o.cropHindi || 'उपज',
                quantityKg: Number(o.quantityKg || 50),
                pricePerKg: Number(o.unitPrice || 25),
                lineAmount: Number(o.productAmount || 1250),
                image: getAccurateCropImage(
                  o.cropNameEnglish || o.crop || 'Produce',
                  o.imageUrl || o.image,
                  o.cropNameHindi || o.cropHindi
                ),
              },
            ],
            productAmount: Number(o.productAmount || 1250),
            deliveryFee: Number(o.deliveryFee || 250),
            platformFee: 0,
            totalAmount: Number(o.totalAmount || 1500),
            status: (o.status || 'PLACED') as any,
            deliveryMethod: o.deliveryMode === 'SELF_PICKUP' ? 'SELF_PICKUP' : 'DELIVERY_PARTNER',
            placedAt: o.createdAt || 'आज',
            acceptDeadline: '12 घंटे शेष',
            pickupLocation: o.pickupAddress || 'बैजनाथपुर, बाराबंकी',
            dropLocation: o.destinationAddress || 'आलमबाग, लखनऊ',
            distanceKm: 28,
            paymentMethod: 'UPI',
          }));
          setOrders((prev) => {
            // Merge with local recent orders
            const merged = [...backendOrders];
            prev.forEach((p) => {
              if (!merged.some((m) => m.id === p.id || m.orderCode === p.orderCode)) {
                merged.push(p);
              }
            });
            return merged;
          });
        }
      } catch (e) {}

      // 3. Fetch live market prices
      try {
        if (process.env.NEXT_PUBLIC_ENABLE_API_SERVER === 'true') {
          const pricesRes = await fetch(getApiUrl('/api/market-prices'), { headers })
            .then((r) => r.json())
            .catch(() => null);
          if (pricesRes?.success && Array.isArray(pricesRes.prices) && pricesRes.prices.length > 0) {
            setMarketPrices(pricesRes.prices);
          }
        }
      } catch (e) {}
    } catch (err) {}
  }, []);

  // Sync with live backend APIs on mount + Real-time event subscription
  useEffect(() => {
    let isMounted = true;
    loadData();

    // 1. Zero-latency Cross-Portal Event Listener via logisticsSync
    const unsubscribeLogistics = logisticsSync.subscribe((event) => {
      if (!isMounted) return;

      if (event.type === 'JOB_ACCEPTED') {
        const { tripId, orderId, transporter } = event.payload;
        if (transporter) {
          setTrips((prev) =>
            prev.map((t) => {
              const matches =
                t.id === tripId ||
                t.orderCode === orderId ||
                (orderId && t.orderCode.replace('#', '') === orderId.replace('#', ''));
              if (matches) {
                return {
                  ...t,
                  status: 'ACCEPTED',
                  driverName: transporter.name || t.driverName || 'राज ट्रांसपोर्ट (राजेश कुमार)',
                  vehicleNumber: transporter.vehicleNumber || t.vehicleNumber || 'UP 32 AB 1234',
                };
              }
              return t;
            })
          );

          if (orderId) {
            setOrders((prev) =>
              prev.map((o) =>
                o.orderCode === orderId ||
                o.id === orderId ||
                o.orderCode.replace('#', '') === orderId.replace('#', '')
                  ? { ...o, status: 'ACCEPTED' as OrderStatus }
                  : o
              )
            );
          }
        }
      } else if (event.type === 'TRIP_STATUS_UPDATED') {
        const { tripId, orderId, status, podOtp } = event.payload;
        if (status) {
          const mappedStatus =
            status === 'PICKED_UP' || status === 'IN_TRANSIT'
              ? 'IN_TRANSIT'
              : status === 'DELIVERED'
              ? 'DELIVERED'
              : status === 'LOADED' || status === 'ARRIVED_PICKUP'
              ? 'ACCEPTED'
              : (status as any);

          setTrips((prev) =>
            prev.map((t) => {
              const matches =
                t.id === tripId ||
                t.orderCode === orderId ||
                (orderId && t.orderCode.replace('#', '') === orderId.replace('#', ''));
              if (matches) {
                return {
                  ...t,
                  status: status as any,
                  podOtp: podOtp || t.podOtp,
                };
              }
              return t;
            })
          );

          if (orderId) {
            setOrders((prev) =>
              prev.map((o) =>
                o.orderCode === orderId ||
                o.id === orderId ||
                o.orderCode.replace('#', '') === orderId.replace('#', '')
                  ? { ...o, status: mappedStatus }
                  : o
              )
            );
          }
        }
      } else if (event.type === 'LOCATION_TELEMETRY') {
        const { tripId, orderId, location } = event.payload;
        if (location) {
          setTrips((prev) =>
            prev.map((t) => {
              const matches =
                t.id === tripId ||
                t.orderCode === orderId ||
                (orderId && t.orderCode.replace('#', '') === orderId.replace('#', ''));
              if (matches) {
                return {
                  ...t,
                  currentLocation: {
                    lat: location.lat,
                    lng: location.lng,
                    speedKmh: location.speedKmh || 45,
                    address: location.address || 'हाईवे रूट',
                    lastUpdated: 'अभी-अभी',
                  },
                };
              }
              return t;
            })
          );
        }
      } else if (event.type === 'ORDER_ACCEPTED') {
        const { orderId } = event.payload;
        if (orderId) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ||
              o.orderCode === orderId ||
              o.orderCode.replace('#', '') === orderId.replace('#', '')
                ? { ...o, status: 'ACCEPTED' as OrderStatus }
                : o
            )
          );
        }
      } else if (event.type === 'ORDER_REJECTED') {
        const { orderId, order } = event.payload;
        const ordCode = order?.orderCode || orderId;
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ||
            o.orderCode === orderId ||
            (ordCode && o.orderCode === ordCode) ||
            (ordCode && o.orderCode.replace('#', '') === ordCode.replace('#', ''))
              ? {
                  ...o,
                  status: 'REJECTED' as OrderStatus,
                  statusLabel: 'Rejected',
                  rejectionReason: order?.rejectionReason || 'किसान द्वारा अस्वीकृत (Rejected by Farmer)',
                }
              : o
          )
        );
        loadData();
      } else if (event.type === 'ORDER_PACKED') {
        const { orderId } = event.payload;
        if (orderId) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ||
              o.orderCode === orderId ||
              o.orderCode.replace('#', '') === orderId.replace('#', '')
                ? { ...o, status: 'PACKED' as OrderStatus }
                : o
            )
          );
        }
      } else if (event.type === 'LISTING_CREATED' || event.type === 'ORDER_PLACED') {
        if (event.type === 'LISTING_CREATED' && event.payload?.listing) {
          const rawItem = event.payload.listing;
          const mapped: ProduceListing = {
            id: rawItem.id || `live-${Date.now()}`,
            crop: rawItem.crop || rawItem.cropNameEnglish || rawItem.crop_name || 'Produce',
            cropHindi: rawItem.cropHindi || rawItem.cropNameHindi || rawItem.crop_hindi || rawItem.crop || 'ताज़ा उपज',
            category: rawItem.category || 'Vegetables',
            variety: rawItem.variety || 'Desi',
            quantityKg: Number(rawItem.quantityKg ?? rawItem.availableQtyKg ?? rawItem.totalQuantityKg ?? rawItem.quantity ?? 100),
            availableQtyKg: Number(rawItem.availableQtyKg ?? rawItem.quantityKg ?? 100),
            minOrderKg: Number(rawItem.minOrderKg ?? rawItem.minOrderQtyKg ?? rawItem.min_order_quantity ?? 10),
            pricePerKg: Number(rawItem.pricePerKg ?? rawItem.askingPricePerKg ?? rawItem.price_per_kg ?? 25),
            marketPricePerKg: Number(rawItem.marketPricePerKg ?? (Number(rawItem.pricePerKg || 25) + 4)),
            quality: (rawItem.quality || rawItem.grade || 'A') as 'A' | 'B' | 'C',
            harvestDate: rawItem.harvestDate || new Date().toISOString().split('T')[0],
            cultivationLocation: rawItem.cultivationLocation || (rawItem.locationVillage ? `${rawItem.locationVillage}, ${rawItem.locationDistrict || 'बाराबंकी'}` : rawItem.locationDistrict) || 'बाराबंकी, उत्तर प्रदेश',
            freshnessWindowHours: Number(rawItem.freshnessWindowHours || 48),
            perishable: true,
            status: rawItem.status || 'ACTIVE',
            viewsCount: 1,
            image: rawItem.image || rawItem.imageUrl || getAccurateCropImage(rawItem.crop || rawItem.cropNameHindi || 'Produce'),
            farmerName: rawItem.farmerName || 'सत्यापित किसान संघ',
            fpoName: rawItem.fpoName || 'Kisan FPO',
            distanceKm: 14,
            rating: 4.8,
          };
          setListings((prev) => [mapped, ...prev.filter((x) => x.id !== mapped.id)]);
        }
        loadData();
      }
    });

    // 2. Real-time Firestore Subscriptions
    let unsubFirestoreOrders: (() => void) | null = null;
    let unsubFirestoreListings: (() => void) | null = null;
    let unsubFirestoreTrips: (() => void) | null = null;

    try {
      unsubFirestoreOrders = subscribeOrders((fsOrders) => {
        if (isMounted && Array.isArray(fsOrders) && fsOrders.length > 0) {
          setOrders((prev) => {
            const merged = [...prev];
            fsOrders.forEach((fo) => {
              const idx = merged.findIndex(
                (m) => m.id === fo.id || m.orderCode === fo.orderCode
              );
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...fo };
              } else {
                merged.unshift(fo);
              }
            });
            return merged;
          });
        }
      });

      unsubFirestoreListings = subscribeProduceListings((fsListings) => {
        if (isMounted && Array.isArray(fsListings)) {
          const normalized: ProduceListing[] = fsListings.map((item: any) => ({
            id: item.id || `live-${Math.random()}`,
            crop: item.crop || item.cropNameEnglish || item.crop_name || 'Produce',
            cropHindi: item.cropHindi || item.cropNameHindi || item.crop_hindi || item.crop || 'ताज़ा उपज',
            category: item.category || 'Vegetables',
            variety: item.variety || 'Desi',
            quantityKg: Number(item.quantityKg ?? item.availableQtyKg ?? item.totalQuantityKg ?? item.quantity_kg ?? item.quantity ?? 100),
            availableQtyKg: Number(item.availableQtyKg ?? item.quantityKg ?? item.quantity ?? 100),
            minOrderKg: Number(item.minOrderKg ?? item.minOrderQtyKg ?? item.min_order_quantity ?? item.min_order_kg ?? 10),
            pricePerKg: Number(item.pricePerKg ?? item.askingPricePerKg ?? item.price_per_kg ?? 25),
            marketPricePerKg: Number(item.marketPricePerKg ?? item.mandiBenchmarkPrice ?? item.market_price ?? (Number(item.pricePerKg || item.askingPricePerKg || 25) + 4)),
            quality: (item.quality || item.qualityGrade || item.grade || 'A') as 'A' | 'B' | 'C',
            harvestDate: item.harvestDate || new Date().toISOString().split('T')[0],
            cultivationLocation: item.cultivationLocation || (item.locationVillage ? `${item.locationVillage}, ${item.locationDistrict || 'बाराबंकी'}` : item.locationDistrict) || 'बाराबंकी, उत्तर प्रदेश',
            freshnessWindowHours: Number(item.freshnessWindowHours ?? item.freshnessDurationHours ?? 48),
            perishable: true,
            status: item.status || 'ACTIVE',
            viewsCount: Number(item.viewsCount || 1),
            image: getAccurateCropImage(
              item.crop || item.cropNameEnglish || item.crop_name,
              item.imageUrl || item.image || item.photoUrl || (item.images && item.images[0]),
              item.cropHindi || item.cropNameHindi || item.crop_hindi
            ),
            farmerName: item.farmerName || 'सत्यापित किसान संघ',
            fpoName: item.fpoName || item.farmerName || 'Kisan FPO',
            distanceKm: Number(item.distanceKm || 14),
            rating: Number(item.rating || 4.8),
          }));
          setListings(normalized);
        }
      });

      unsubFirestoreTrips = subscribeTransporterTrips((fsTrips) => {
        if (isMounted && Array.isArray(fsTrips) && fsTrips.length > 0) {
          setTrips((prev) => {
            const merged = [...prev];
            fsTrips.forEach((ft) => {
              const idx = merged.findIndex(
                (m) => m.id === ft.id || m.orderCode === ft.orderCode
              );
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...ft };
              } else {
                merged.unshift(ft);
              }
            });
            return merged;
          });
        }
      });
    } catch (e) {}

    // 3. Periodic Synchronization Polling (every 5 seconds)
    const pollInterval = setInterval(() => {
      if (isMounted) loadData();
    }, 5000);

    return () => {
      isMounted = false;
      unsubscribeLogistics();
      if (unsubFirestoreOrders) unsubFirestoreOrders();
      if (unsubFirestoreListings) unsubFirestoreListings();
      if (unsubFirestoreTrips) unsubFirestoreTrips();
      clearInterval(pollInterval);
    };
  }, [loadData]);

  // Handle Order Placement
  const handlePlaceOrder = useCallback(
    async (newOrder: Order) => {
      try {
        // 1. Place order via GlobalOrderManager (notifies listeners + Firestore)
        const orderId = await globalOrderManager.placeOrder(newOrder);
        const updatedOrder: Order = {
          ...newOrder,
          id: orderId,
          orderCode: newOrder.orderCode || `ORD${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'PLACED' as OrderStatus,
        };

        // 2. Optimistic local update
        setOrders((prev) => [updatedOrder, ...prev.filter((o) => o.id !== orderId)]);

        // 3. Persist to Postgres / Supabase database API (with 1.5s timeout)
        const firstItem = newOrder.items?.[0];
        try {
          await Promise.race([
            createBuyerOrder({
              listing_id: firstItem?.listingId || 'prod-1',
              quantity: firstItem?.quantityKg || 50,
              unit_price: firstItem?.pricePerKg || 25,
              delivery_fee: newOrder.deliveryFee || 250,
              buyer_location: newOrder.dropLocation || 'नवीन गल्ला मंडी, लखनऊ',
              delivery_mode: newOrder.deliveryMethod || 'DELIVERY_PARTNER',
            }),
            new Promise((resolve) => setTimeout(resolve, 1500)),
          ]);
        } catch (dbErr) {
          console.warn('Backend DB order sync fallback note:', dbErr);
        }

        // 4. Zero-latency broadcast to Farmer Portal & Admin Console (Awaiting Farmer Acceptance)
        logisticsSync.broadcast('ORDER_PLACED', {
          orderId: updatedOrder.orderCode,
          order: updatedOrder,
          buyerName: updatedOrder.buyerName || 'क्रेता साथी',
          totalAmount: updatedOrder.totalAmount,
          produceName: updatedOrder.items?.[0]?.cropHindi || 'उपज',
          quantityKg: updatedOrder.items?.reduce((a, b) => a + (b.quantityKg || 0), 0) || 50,
          status: 'PLACED',
        });
      } catch (err) {
        console.error('Failed to place order:', err);
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      }
    },
    []
  );

  // Handle Order Cancellation
  const handleCancelOrder = useCallback(async (orderId: string) => {
    try {
      await updateOrder(orderId, { status: 'CANCELLED', cancelledReason: 'क्रेता द्वारा रद्द' });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'CANCELLED' as OrderStatus, cancelledReason: 'क्रेता द्वारा रद्द' }
            : o
        )
      );
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'CANCELLED' as OrderStatus, cancelledReason: 'क्रेता द्वारा रद्द' }
            : o
        )
      );
    }
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-[#F7F8FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <BuyerPortal
        onBackToLanding={() => router.push('/')}
        listings={listings}
        orders={orders}
        trips={trips}
        setOrders={setOrders}
        marketPrices={marketPrices}
        fpos={fpos}
        onOpenKrishiAI={() => setIsAIOpen(true)}
        onPlaceOrder={handlePlaceOrder}
        onCancelOrder={handleCancelOrder}
        isLoading={isLoading}
      />

      <KrishiAIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        userRole="BUYER"
        onApplyAction={(action, data) => {
          console.log('Krishi AI Action applied:', action, data);
        }}
      />
    </div>
  );
}

export default function BuyerPage() {
  return (
    <LanguageProvider>
      <BuyerPortalPageInner />
    </LanguageProvider>
  );
}
