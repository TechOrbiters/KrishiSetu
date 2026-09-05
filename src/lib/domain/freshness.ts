/**
 * KRISHISETU — FreshRoute & Freshness Domain Engine
 * Consolidated 3-State Freshness Model (SAFE | AT_RISK | EXPIRED)
 * Enforces R-005 Invariant: transit_hours <= shelf_life_hours - 2h safety buffer
 */

export type FreshnessStatus = 'SAFE' | 'AT_RISK' | 'EXPIRED';

export interface FreshnessEvaluation {
  status: FreshnessStatus;
  eligible: boolean;
  freshnessWindowHours: number;
  etaHours: number;
  remainingFreshnessHours: number;
  explanation: string;
}

export function evaluateFreshness(
  harvestTime: Date | string,
  freshnessWindowHours: number,
  etaHours: number,
  safetyBufferHours: number = 2
): FreshnessEvaluation {
  const harvestDate = typeof harvestTime === 'string' ? new Date(harvestTime) : harvestTime;
  const now = new Date();
  
  // Hours elapsed since harvest
  const elapsedHours = (now.getTime() - harvestDate.getTime()) / (1000 * 60 * 60);
  const remainingHoursAtCurrentTime = Math.max(0, freshnessWindowHours - elapsedHours);
  const remainingHoursAtArrival = remainingHoursAtCurrentTime - etaHours;

  if (remainingHoursAtArrival >= safetyBufferHours + 4) {
    return {
      status: 'SAFE',
      eligible: true,
      freshnessWindowHours,
      etaHours,
      remainingFreshnessHours: Math.round(remainingHoursAtArrival * 10) / 10,
      explanation: `✅ ताज़गी सुरक्षित: डिलीवरी के समय ${Math.round(remainingHoursAtArrival * 10) / 10} घंटे की ताज़गी शेष रहेगी।`
    };
  } else if (remainingHoursAtArrival >= safetyBufferHours) {
    return {
      status: 'AT_RISK',
      eligible: true,
      freshnessWindowHours,
      etaHours,
      remainingFreshnessHours: Math.round(remainingHoursAtArrival * 10) / 10,
      explanation: `⚠️ ताज़गी जोखिम में: डिलीवरी के समय केवल ${Math.round(remainingHoursAtArrival * 10) / 10} घंटे शेष रहेंगे (सुरक्षा बफर सीमा के निकट)।`
    };
  } else {
    return {
      status: 'EXPIRED',
      eligible: false,
      freshnessWindowHours,
      etaHours,
      remainingFreshnessHours: Math.max(0, Math.round(remainingHoursAtArrival * 10) / 10),
      explanation: `❌ ताज़गी समाप्त / अमान्य: डिलीवरी का समय ताज़गी सुरक्षा बफर (${safetyBufferHours} घंटे) को पार कर जाएगा।`
    };
  }
}

export function isFreshnessSafe(freshnessWindowHours: number, etaHours: number, safetyBufferHours: number = 2): boolean {
  return etaHours <= (freshnessWindowHours - safetyBufferHours);
}
