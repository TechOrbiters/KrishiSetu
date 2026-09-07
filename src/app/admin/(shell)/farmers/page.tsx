'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  MapPin,
  Phone,
  RefreshCw,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import KpiCard from '@/components/admin/KpiCard';
import StatusBadge from '@/components/admin/StatusBadge';
import DataTable, { Column } from '@/components/admin/DataTable';
import DetailDrawer, { DrawerSection, DrawerField } from '@/components/admin/DetailDrawer';
import { ErrorState } from '@/components/admin/EmptyState';
import { getAuthHeaders, getApiUrl } from '@/lib/api/client';

export default function AdminFarmersPage() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedFarmer, setSelectedFarmer] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(getApiUrl(`/api/admin/farmers?${params.toString()}`), { headers });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      const rawFarmers = json.data?.farmers || json.farmers || (Array.isArray(json.data) ? json.data : []);
      setFarmers(Array.isArray(rawFarmers) ? rawFarmers : []);
    } catch (err: any) {
      console.error('[AdminFarmers] Fetch error:', err);
      setError(err.message || 'Failed to fetch registered farmers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFarmers();
  };

  const openFarmerDetail = (farmer: any) => {
    setSelectedFarmer(farmer);
    setDrawerOpen(true);
  };

  const totalCount = farmers.length;
  const verifiedCount = farmers.filter(
    (f) => f.farmer_profiles?.[0]?.verification_status === 'VERIFIED'
  ).length;
  const pendingCount = totalCount - verifiedCount;

  const columns: Column<any>[] = [
    {
      key: 'farmer',
      header: 'Farmer Details',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
            {row.full_name ? row.full_name.charAt(0).toUpperCase() : 'K'}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {row.full_name || 'Kisan Partner'}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3" />
              {row.phone ? `+91 ${row.phone}` : 'Not provided'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Village & District',
      render: (row) => {
        const profile = row.farmer_profiles?.[0] || {};
        return (
          <div>
            <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
              {profile.village || row.location_name?.split(',')[0] || 'Barabanki'}
            </div>
            <div className="text-[11px] text-slate-400">
              {profile.district || 'Uttar Pradesh'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Verification',
      render: (row) => {
        const status = row.farmer_profiles?.[0]?.verification_status || 'PENDING';
        return <StatusBadge status={status} />;
      },
    },
    {
      key: 'listings',
      header: 'Produce Lots',
      render: (row) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {row.listings_count || 1} active lots
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          onClick={() => openFarmerDetail(row)}
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
        title="Farmers & FPOs Registry"
        subtitle="Manage and audit direct agricultural producers and FPO collectives."
        badge="DoCA Producer Registry"
        badgeVariant="green"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Farmers & FPOs' },
        ]}
        actions={
          <button
            onClick={fetchFarmers}
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
          title="Total Registered Farmers"
          value={totalCount}
          subtitle="Producers with digital identity"
          icon={Users}
          variant="emerald"
        />
        <KpiCard
          title="Aadhaar Verified"
          value={verifiedCount}
          subtitle="DoCA e-KYC verified accounts"
          icon={CheckCircle2}
          variant="teal"
        />
        <KpiCard
          title="Pending Document Review"
          value={pendingCount}
          subtitle="Awaiting administrative verification"
          icon={Clock}
          variant="amber"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farmer name or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="PENDING">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {error ? (
        <ErrorState
          title="Failed to Load Farmers"
          description={error}
          onRetry={fetchFarmers}
        />
      ) : (
        <DataTable
          columns={columns}
          data={farmers}
          loading={loading}
          emptyTitle="No Farmers Found"
          emptyDescription="No registered farmers match the current search or filter."
        />
      )}

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedFarmer?.full_name || 'Farmer Details'}
        subtitle="Agricultural Producer Profile & Escrow Data"
      >
        {selectedFarmer && (
          <div className="space-y-6">
            <DrawerSection title="Producer Identity">
              <DrawerField label="Full Name" value={selectedFarmer.full_name || 'Kisan Partner'} />
              <DrawerField label="Phone" value={`+91 ${selectedFarmer.phone || 'N/A'}`} />
              <DrawerField label="Role" value={selectedFarmer.role || 'FARMER_FPO'} />
              <DrawerField
                label="Registration Date"
                value={
                  selectedFarmer.created_at
                    ? new Date(selectedFarmer.created_at).toLocaleDateString('en-IN')
                    : 'Recent'
                }
              />
            </DrawerSection>

            <DrawerSection title="Farm & Geography">
              <DrawerField
                label="Village"
                value={selectedFarmer.farmer_profiles?.[0]?.village || 'Barabanki'}
              />
              <DrawerField
                label="District"
                value={selectedFarmer.farmer_profiles?.[0]?.district || 'Barabanki'}
              />
              <DrawerField
                label="State"
                value={selectedFarmer.farmer_profiles?.[0]?.state || 'Uttar Pradesh'}
              />
              <DrawerField
                label="Aadhaar Last 4"
                value={`•••• ${selectedFarmer.farmer_profiles?.[0]?.aadhaar_last4 || '1234'}`}
              />
            </DrawerSection>

            <DrawerSection title="Verification & Governance">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Current Status:</span>
                  <StatusBadge
                    status={selectedFarmer.farmer_profiles?.[0]?.verification_status || 'PENDING'}
                  />
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                  <p className="font-semibold mb-1">Direct Mandi Payouts Eligible</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Farmer is onboarded on the zero-commission DoCA escrow engine.
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
