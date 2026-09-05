'use client';

import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { evaluateFreshness } from '@/lib/domain/freshness';

interface FreshnessTimerProps {
  harvestDate: string;
  freshnessWindowHours: number;
  etaHours?: number;
}

export const FreshnessTimer: React.FC<FreshnessTimerProps> = ({
  harvestDate,
  freshnessWindowHours,
  etaHours = 3,
}) => {
  const evalResult = evaluateFreshness(harvestDate, freshnessWindowHours, etaHours);

  return (
    <div
      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
        evalResult.status === 'SAFE'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : evalResult.status === 'AT_RISK'
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-red-50 border-red-200 text-red-900'
      }`}
    >
      <div className="flex items-center gap-2">
        {evalResult.status === 'SAFE' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        {evalResult.status === 'AT_RISK' && <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />}
        {evalResult.status === 'EXPIRED' && <XCircle className="w-4 h-4 text-red-600" />}
        <span>{evalResult.explanation}</span>
      </div>

      <div className="flex items-center gap-1 opacity-80 text-[11px]">
        <Clock className="w-3.5 h-3.5" />
        <span>विंडो: {freshnessWindowHours}h</span>
      </div>
    </div>
  );
};
