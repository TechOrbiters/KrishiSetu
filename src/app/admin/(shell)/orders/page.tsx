'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Search,
  Filter,
  Eye,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import KpiCard from '@/components/admin/KpiCard';
import StatusBadge from '@/components/admin/StatusBadge';
import DataTable, { Column } from '@/components/admin/DataTable';
import DetailDrawer, { DrawerSection, DrawerField } from '@/components/admin/DetailDrawer';
import { ErrorState } from '@/components/admin/EmptyState';
import { fetchAdminOrders } from '@/lib/api/client';
import { logisticsSync } from '@/lib/realtime/logisticsSync';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminOrders();
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        throw new Error(res.error || 'Failed to fetch platform orders.');
      }
    } catch (err: any) {
      console.error('[AdminOrders] Fetch error:', err);
      setError(err.message || 'Failed to fetch platform orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const unsubscribe = logisticsSync.subscribe(() => {
      fetchOrders();
    });

    return () => unsubscribe();
  }, []);

  const openOrderDetail = (ord: any) => {
    setSelectedOrder(ord);
    setDrawerOpen(true);
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const cropName = o.produce_listings?.crop_name || o.crop_name || '';
    const orderNum = o.order_number || o.id || '';
    const matchesSearch =
      !search ||
      cropName.toLowerCase().includes(search.toLowerCase()) ||
      orderNum.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalOrders = orders.length;
  const inTransitCount = orders.filter(
    (o) => o.status === 'IN_TRANSIT' || o.status === 'DISPATCHED'
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter(
    (o) => o.status === 'CANCELLED' || o.status === 'REJECTED'
  ).length;

  const columns: Column<any>[] = [
    {
      key: 'order',
      header: 'Order Number',
      render: (row) => (
        <div>
          <div className="font-mono font-semibold text-slate-900 dark:text-white">
            {row.order_number || `ORD-${row.id.slice(0, 8).toUpperCase()}`}
          </div>
          <div className="text-[11px] text-slate-400">
            {row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : 'Recent'}
          </div>
        </div>
      ),
    },
    {
      key: 'produce',
      header: 'Produce & Lot',
      render: (row) => {
        const crop = row.produce_listings?.crop_name || row.crop_name || 'Produce Lot';
        return (
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">{crop}</div>
            <div className="text-[11px] text-slate-400">
              {row.quantity ? `${row.quantity} kg` : 'Standard quantity'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'value',
      header: 'Gross Value',
      render: (row) => (
        <span className="font-semibold text-slate-900 dark:text-white">
          {formatINR(row.total_amount || row.product_amount || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Lifecycle State',
      render: (row) => <StatusBadge status={row.status || 'PLACED'} />,
    },
    {
      key: 'logistics',
      header: 'Logistics Mode',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <Truck className="w-3.5 h-3.5 text-slate-400" />
          {row.delivery_mode === 'SELF_PICKUP' ? 'Self Pickup' : 'FreshRoute Delivery'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          onClick={() => openOrderDetail(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Audit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders & Escrow Registry"
        subtitle="End-to-end audit surveillance of farmgate transactions and escrow settlements."
        badge="Zero-Fee Escrow"
        badgeVariant="green"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Orders & Escrow' },
        ]}
        actions={
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Orders"
          value={totalOrders}
          subtitle="All-time recorded trades"
          icon={Package}
          variant="emerald"
        />
        <KpiCard
          title="In-Transit Active"
          value={inTransitCount}
          subtitle="Consignments in transit"
          icon={Truck}
          variant="amber"
        />
        <KpiCard
          title="Successfully Delivered"
          value={deliveredCount}
          subtitle="Settled to farmer accounts"
          icon={CheckCircle2}
          variant="teal"
        />
        <KpiCard
          title="Cancelled / Expired"
          value={cancelledCount}
          subtitle="Disputed or rejected lots"
          icon={XCircle}
          variant="rose"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order # or produce..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PLACED', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* DataTable */}
      {error ? (
        <ErrorState
          title="Failed to Load Orders"
          description={error}
          onRetry={fetchOrders}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredOrders}
          loading={loading}
          emptyTitle="No Orders Found"
          emptyDescription="No orders match the current status filter or search query."
        />
      )}

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          selectedOrder?.order_number ||
          `Order #${selectedOrder?.id?.slice(0, 8).toUpperCase() || ''}`
        }
        subtitle="DoCA Trade Audit & Financial Settlement"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <DrawerSection title="Financial Breakdown">
              <DrawerField
                label="Produce Amount"
                value={formatINR(selectedOrder.product_amount || 0)}
              />
              <DrawerField
                label="Delivery Fee"
                value={formatINR(selectedOrder.delivery_fee || 0)}
              />
              <DrawerField
                label="Total Consignment Value"
                value={formatINR(selectedOrder.total_amount || selectedOrder.product_amount || 0)}
              />
              <DrawerField label="Platform Commission" value="₹0 (0% Zero Commission Policy)" />
            </DrawerSection>

            <DrawerSection title="Consignment Details">
              <DrawerField
                label="Produce Lot"
                value={
                  selectedOrder.produce_listings?.crop_name ||
                  selectedOrder.crop_name ||
                  'Agricultural Produce'
                }
              />
              <DrawerField label="Quantity" value={`${selectedOrder.quantity || 0} kg`} />
              <DrawerField
                label="Unit Price"
                value={`₹${selectedOrder.unit_price || selectedOrder.produce_listings?.price_per_kg || 0}/kg`}
              />
              <DrawerField
                label="Logistics Mode"
                value={selectedOrder.delivery_mode || 'DELIVERY_PARTNER'}
              />
            </DrawerSection>

            <DrawerSection title="Lifecycle State & Escrow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Audit Status:</span>
                  <StatusBadge status={selectedOrder.status || 'PLACED'} />
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                  <p className="font-semibold mb-1">Escrow Guarantee</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Buyer funds are held in secure escrow and released directly to the farmer upon delivery receipt.
                  </p>
                </div>
              </div>
            </DrawerSection>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
