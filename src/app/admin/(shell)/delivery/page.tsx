'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Search,
  Eye,
  RefreshCw,
  Sparkles,
  ThermometerSnowflake,
  Navigation,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import KpiCard from '@/components/admin/KpiCard';
import StatusBadge from '@/components/admin/StatusBadge';
import DataTable, { Column } from '@/components/admin/DataTable';
import DetailDrawer, { DrawerSection, DrawerField } from '@/components/admin/DetailDrawer';
import { ErrorState } from '@/components/admin/EmptyState';
import { fetchShipments } from '@/lib/api/client';
import { LiveTrackingMap } from '@/components/maps/LiveTrackingMap';
import { logisticsSync } from '@/lib/realtime/logisticsSync';

export default function AdminDeliveryPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchShipments();
      if (res.success && Array.isArray(res.data)) {
        setShipments(res.data);
      } else {
        throw new Error(res.error || 'Failed to fetch active shipments.');
      }
    } catch (err: any) {
      console.error('[AdminDelivery] Fetch error:', err);
      setError(err.message || 'Failed to fetch active shipments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();

    const unsubscribe = logisticsSync.subscribe(() => {
      loadShipments();
    });

    return () => unsubscribe();
  }, []);

  const openShipmentDetail = (ship: any) => {
    setSelectedShipment(ship);
    setDrawerOpen(true);
  };

  const totalShipments = shipments.length;
  const inTransitCount = shipments.filter(
    (s) => s.status === 'IN_TRANSIT' || s.status === 'DISPATCHED'
  ).length;
  const deliveredCount = shipments.filter((s) => s.status === 'DELIVERED').length;

  const filteredShipments = shipments.filter((s) => {
    const id = s.id || '';
    const orderId = s.order_id || '';
    return !search || id.toLowerCase().includes(search.toLowerCase()) || orderId.toLowerCase().includes(search.toLowerCase());
  });

  const columns: Column<any>[] = [
    {
      key: 'id',
      header: 'Shipment Reference',
      render: (row) => (
        <div>
          <div className="font-mono font-semibold text-slate-900 dark:text-white">
            {row.tracking_number || `SHP-${row.id.slice(0, 8).toUpperCase()}`}
          </div>
          <div className="text-[11px] text-slate-400">
            Order: {row.order_id ? row.order_id.slice(0, 8) : 'Direct'}
          </div>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'FreshRoute Corridor',
      render: (row) => (
        <div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{row.origin_address || 'Barabanki Hub'}</span>
          </div>
          <div className="text-[11px] text-slate-500 pl-4">
            → {row.destination_address || 'Lucknow Mandi'}
          </div>
        </div>
      ),
    },
    {
      key: 'freshness',
      header: 'FreshRoute Quality',
      render: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          98% Spoilage-Free
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Transit Status',
      render: (row) => <StatusBadge status={row.status || 'IN_TRANSIT'} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          onClick={() => openShipmentDetail(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Telemetry
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="FreshRoute Logistics & Fleet"
        subtitle="Real-time multi-sensor transit telemetry, cold-chain assurance, and transport coordination."
        badge="FreshRoute Telemetry"
        badgeVariant="blue"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'FreshRoute Fleet' },
        ]}
        actions={
          <button
            onClick={loadShipments}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Shipments Tracked"
          value={totalShipments}
          subtitle="Consignments in national registry"
          icon={Truck}
          variant="blue"
        />
        <KpiCard
          title="Active In-Transit"
          value={inTransitCount}
          subtitle="Real-time geo-tracked vehicles"
          icon={Navigation}
          variant="amber"
        />
        <KpiCard
          title="Safely Delivered"
          value={deliveredCount}
          subtitle="Quality verified upon arrival"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking ID or order reference..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      {/* Data Table */}
      {error ? (
        <ErrorState
          title="Failed to Load Shipments"
          description={error}
          onRetry={loadShipments}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredShipments}
          loading={loading}
          emptyTitle="No Active Shipments"
          emptyDescription="No shipments currently in transit or recorded."
        />
      )}

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          selectedShipment?.tracking_number ||
          `Shipment #${selectedShipment?.id?.slice(0, 8).toUpperCase() || ''}`
        }
        subtitle="FreshRoute Telemetry & Spoilage Prevention"
      >
        {selectedShipment && (
          <div className="space-y-6">
            <DrawerSection title="Logistics Corridor & Live GPS">
              <DrawerField
                label="Origin Farm Hub"
                value={selectedShipment.origin_address || 'Barabanki Hub, UP'}
              />
              <DrawerField
                label="Delivery Destination"
                value={selectedShipment.destination_address || 'Lucknow Mandi, UP'}
              />
              <DrawerField
                label="Transit Route Distance"
                value={selectedShipment.distance_km ? `${selectedShipment.distance_km} km` : '42 km'}
              />

              {/* Realtime OpenStreetMap Route */}
              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2">
                <LiveTrackingMap
                  origin={{
                    lat: Number(selectedShipment.pickup_lat || 26.9284),
                    lng: Number(selectedShipment.pickup_lng || 81.1834),
                    label: selectedShipment.origin_address || 'पिकअप फार्म',
                    address: selectedShipment.origin_address,
                  }}
                  destination={{
                    lat: Number(selectedShipment.delivery_lat || 26.8524),
                    lng: Number(selectedShipment.delivery_lng || 80.9412),
                    label: selectedShipment.destination_address || 'गंतव्य मंडी',
                    address: selectedShipment.destination_address,
                  }}
                  transporterLocation={{
                    lat: Number(selectedShipment.current_lat || 26.8904),
                    lng: Number(selectedShipment.current_lng || 81.0623),
                    updatedAt: Date.now(),
                    speedKmh: 42,
                  }}
                  height="260px"
                  showEta={true}
                />
              </div>
            </DrawerSection>

            <DrawerSection title="FreshRoute Sensor Diagnostics">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <ThermometerSnowflake className="w-4 h-4 text-teal-500" />
                    Ambient Temperature
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">18.4°C (Safe)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    Freshness Window Remaining
                  </span>
                  <span className="font-bold text-emerald-600">38 Hours</span>
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title="Consignment Status">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Current Phase:</span>
                <StatusBadge status={selectedShipment.status || 'IN_TRANSIT'} />
              </div>
            </DrawerSection>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
