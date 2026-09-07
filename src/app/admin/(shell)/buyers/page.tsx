'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Search,
  Eye,
  Phone,
  RefreshCw,
  Building,
  CheckCircle2,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import KpiCard from '@/components/admin/KpiCard';
import StatusBadge from '@/components/admin/StatusBadge';
import DataTable, { Column } from '@/components/admin/DataTable';
import DetailDrawer, { DrawerSection, DrawerField } from '@/components/admin/DetailDrawer';
import { ErrorState } from '@/components/admin/EmptyState';
import { getAuthHeaders, getApiUrl } from '@/lib/api/client';

export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await fetch(getApiUrl(`/api/admin/buyers?${params.toString()}`), { headers });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      const rawBuyers = json.data?.buyers || json.buyers || (Array.isArray(json.data) ? json.data : []);
      setBuyers(Array.isArray(rawBuyers) ? rawBuyers : []);
    } catch (err: any) {
      console.error('[AdminBuyers] Fetch error:', err);
      setError(err.message || 'Failed to fetch registered buyers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBuyers();
  };

  const openBuyerDetail = (buyer: any) => {
    setSelectedBuyer(buyer);
    setDrawerOpen(true);
  };

  const totalBuyers = buyers.length;
  const totalVolume = buyers.reduce((sum, b) => sum + (b.total_spent || 0), 0);
  const totalOrders = buyers.reduce((sum, b) => sum + (b.orders_count || 0), 0);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const columns: Column<any>[] = [
    {
      key: 'buyer',
      header: 'Buyer Details',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
            {row.full_name ? row.full_name.charAt(0).toUpperCase() : 'B'}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {row.full_name || 'Agri Trader / Retailer'}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3" />
              {row.phone ? `+91 ${row.phone}` : 'Verified Buyer'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Delivery Destination',
      render: (row) => (
        <div>
          <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
            {row.location_name || 'Lucknow Mandi'}
          </div>
          <div className="text-[11px] text-slate-400">Uttar Pradesh</div>
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'Completed Orders',
      render: (row) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {row.orders_count || 0} trades
        </span>
      ),
    },
    {
      key: 'spent',
      header: 'Total Volume',
      render: (row) => (
        <span className="font-semibold text-emerald-600">
          {formatINR(row.total_spent || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Buyer Status',
      render: () => <StatusBadge status="ACTIVE" />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          onClick={() => openBuyerDetail(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Inspect
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buyers & Traders Directory"
        subtitle="Manage bulk purchasers, mandi traders, and consumer cooperatives."
        badge="Direct Mandi Access"
        badgeVariant="blue"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Buyers Directory' },
        ]}
        actions={
          <button
            onClick={fetchBuyers}
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
          title="Total Registered Buyers"
          value={totalBuyers}
          subtitle="Retailers, institutions & traders"
          icon={ShoppingBag}
          variant="teal"
        />
        <KpiCard
          title="Procurement Volume"
          value={formatINR(totalVolume)}
          subtitle="Total transacted buyer spend"
          icon={TrendingUp}
          variant="emerald"
        />
        <KpiCard
          title="Trades Fulfilled"
          value={totalOrders}
          subtitle="Direct farmgate purchase orders"
          icon={CheckCircle2}
          variant="blue"
        />
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buyer name or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </form>
      </div>

      {/* Table */}
      {error ? (
        <ErrorState
          title="Failed to Load Buyers"
          description={error}
          onRetry={fetchBuyers}
        />
      ) : (
        <DataTable
          columns={columns}
          data={buyers}
          loading={loading}
          emptyTitle="No Buyers Found"
          emptyDescription="No registered buyers match the current search criteria."
        />
      )}

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedBuyer?.full_name || 'Buyer Details'}
        subtitle="Buyer Profile & Procurement Metrics"
      >
        {selectedBuyer && (
          <div className="space-y-6">
            <DrawerSection title="Buyer Profile">
              <DrawerField label="Trade Name" value={selectedBuyer.full_name || 'Mandi Buyer'} />
              <DrawerField label="Phone" value={`+91 ${selectedBuyer.phone || 'N/A'}`} />
              <DrawerField label="Destination" value={selectedBuyer.location_name || 'Lucknow, UP'} />
              <DrawerField
                label="Registered Date"
                value={
                  selectedBuyer.created_at
                    ? new Date(selectedBuyer.created_at).toLocaleDateString('en-IN')
                    : 'Recent'
                }
              />
            </DrawerSection>

            <DrawerSection title="Commercial Activity">
              <DrawerField label="Orders Placed" value={`${selectedBuyer.orders_count || 0} trades`} />
              <DrawerField label="Cumulative Spend" value={formatINR(selectedBuyer.total_spent || 0)} />
              <DrawerField label="Payment Status" value="Cleared / Escrow Settled" />
            </DrawerSection>

            <DrawerSection title="Compliance">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-800 dark:text-teal-300">
                <p className="font-semibold mb-1">Direct Mandi Disintermediation</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Buyer procures directly from verified farmers at zero broker commission.
                </p>
              </div>
            </DrawerSection>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
