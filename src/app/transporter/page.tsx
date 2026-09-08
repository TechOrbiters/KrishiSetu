'use client';

import dynamic from 'next/dynamic';

const TransporterClientView = dynamic(
  () =>
    import('@/components/transporter/TransporterClientView').then(
      (m) => m.TransporterClientView
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-300">ट्रांसपोर्टर पोर्टल लोड हो रहा है...</p>
      </div>
    ),
  }
);

export default function TransporterPage() {
  return <TransporterClientView />;
}
