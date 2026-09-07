import React, { useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  WifiOff,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react';
import { MandiErrorDetails } from '../../hooks/useLiveMandiPrices';

interface MandiErrorBannerProps {
  errorDetails: MandiErrorDetails | null;
  isRetrying: boolean;
  nextRetryCountdown: number | null;
  onRetry: () => Promise<void> | void;
  onCancelRetry?: () => void;
  isFallback: boolean;
  className?: string;
}

export const MandiErrorBanner: React.FC<MandiErrorBannerProps> = ({
  errorDetails,
  isRetrying,
  nextRetryCountdown,
  onRetry,
  onCancelRetry,
  isFallback,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!errorDetails && !isFallback) return null;

  const isNetwork = errorDetails?.code === 'NETWORK_ERROR';
  const isTimeout = errorDetails?.code === 'TIMEOUT';
  const isRateLimit = errorDetails?.code === 'RATE_LIMIT';

  return (
    <div
      id="mandi-error-banner"
      className={`rounded-2xl border p-4 transition-all shadow-2xs ${
        isNetwork
          ? 'bg-amber-50/90 border-amber-200 text-amber-900'
          : isTimeout
          ? 'bg-orange-50/90 border-orange-200 text-orange-900'
          : isRateLimit
          ? 'bg-amber-50/90 border-amber-200 text-amber-900'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left icon & text */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              isNetwork
                ? 'bg-amber-100 text-amber-700'
                : isTimeout
                ? 'bg-orange-100 text-orange-700'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {isNetwork ? (
              <WifiOff className="w-5 h-5" />
            ) : isTimeout ? (
              <Clock className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold">
                {errorDetails?.messageHindi ||
                  'सरकारी APMC मंडी सर्वर अस्थायी रूप से व्यस्त है।'}
              </h4>
              {isFallback && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  सुरक्षित बैकअप डेटा सक्रिय
                </span>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-slate-600 mt-1">
              {isRetrying && nextRetryCountdown !== null
                ? `अगला ऑटो-प्रयास: ${nextRetryCountdown} सेकंड में (प्रयास ${errorDetails?.retryCount || 1}/${errorDetails?.maxRetries || 3})`
                : 'एप्लिकेशन में कोई रुकावट नहीं है — प्रमाणित ऑफ़लाइन न्यूनतम समर्थन मूल्य (MSP) और थोक मंडी दरें प्रदर्शित की जा रही हैं।'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {isRetrying && onCancelRetry && (
            <button
              id="btn-cancel-retry"
              onClick={onCancelRetry}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>रद्द करें</span>
            </button>
          )}

          <button
            id="btn-manual-mandi-retry"
            onClick={() => onRetry()}
            disabled={isRetrying && nextRetryCountdown !== null}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRetrying ? 'animate-spin' : ''
              }`}
            />
            <span>
              {isRetrying ? 'प्रयास हो रहा...' : 'पुनः प्रयास करें (Retry)'}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Technical Debug Details */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 hover:text-slate-800 font-medium transition-colors"
        >
          <span>तकनीकी विवरण (Diagnostics)</span>
          {showDetails ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        <span>
          कोड: <strong className="font-mono">{errorDetails?.code || 'FALLBACK_CACHED'}</strong>
        </span>
      </div>

      {showDetails && (
        <div className="mt-2 p-3 bg-white/80 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 space-y-1">
          <div><strong>Upstream Source:</strong> Data.gov.in (Resource: 9ef84268-d588-465a-a308-a864a43d0070)</div>
          <div><strong>Error Message:</strong> {errorDetails?.message || 'Upstream service unreachable'}</div>
          <div><strong>Status Code:</strong> {errorDetails?.statusCode || 'Network/Client Timeout'}</div>
          <div><strong>Timestamp:</strong> {errorDetails?.timestamp || new Date().toISOString()}</div>
          <div><strong>Retry Policy:</strong> Exponential backoff (Max {errorDetails?.maxRetries || 3} attempts)</div>
          <div><strong>Resilience Status:</strong> Zero-crash fallback protection active</div>
        </div>
      )}
    </div>
  );
};
