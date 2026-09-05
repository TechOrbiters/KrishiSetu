/**
 * KRISHISETU — FreshRoute Service (Backend Domain Logic)
 * Evaluates transport route ETA against crop freshness deadlines.
 * Strict Rule Engine:
 * - SAFE: estimatedArrival <= freshnessDeadline - safetyBuffer
 * - AT_RISK: estimatedArrival <= freshnessDeadline AND estimatedArrival > freshnessDeadline - safetyBuffer
 * - INELIGIBLE: estimatedArrival > freshnessDeadline (Option disabled / blocked)
 */

export type FreshRouteStatus = 'SAFE' | 'AT_RISK' | 'INELIGIBLE';

export interface FreshRouteInput {
  harvestTimeIso: string;
  freshnessDurationHours: number;
  routeDurationMinutes: number | null; // From OSRM route API (null if routing unavailable)
  safetyBufferMinutes?: number; // Default 60 mins buffer
  serverTimeIso?: string;
}

export interface FreshRouteResult {
  status: FreshRouteStatus;
  freshnessDeadlineIso: string;
  estimatedArrivalIso: string | null;
  remainingFreshnessMinutes: number;
  isEligible: boolean;
  requiresConfirmation: boolean;
  reason: string;
}

export function evaluateFreshRoute(input: FreshRouteInput): FreshRouteResult {
  const now = input.serverTimeIso ? new Date(input.serverTimeIso).getTime() : Date.now();
  const harvestTime = new Date(input.harvestTimeIso).getTime();
  const freshnessDurationMs = input.freshnessDurationHours * 3600 * 1000;
  const freshnessDeadlineMs = harvestTime + freshnessDurationMs;
  const safetyBufferMs = (input.safetyBufferMinutes ?? 60) * 60 * 1000;

  const freshnessDeadlineIso = new Date(freshnessDeadlineMs).toISOString();

  // If road route duration is unavailable (OSRM failed), we cannot guarantee freshness
  if (input.routeDurationMinutes === null) {
    const remainingMs = freshnessDeadlineMs - now;
    return {
      status: 'AT_RISK',
      freshnessDeadlineIso,
      estimatedArrivalIso: null,
      remainingFreshnessMinutes: Math.max(0, Math.floor(remainingMs / 60000)),
      isEligible: true,
      requiresConfirmation: true,
      reason: 'रूट समय का सटीक अनुमान अनुपलब्ध है। किसान/खरीदार पुष्टि आवश्यक है।',
    };
  }

  const routeDurationMs = input.routeDurationMinutes * 60 * 1000;
  const estimatedArrivalMs = now + routeDurationMs;
  const estimatedArrivalIso = new Date(estimatedArrivalMs).toISOString();
  const remainingFreshnessMinutes = Math.max(0, Math.floor((freshnessDeadlineMs - estimatedArrivalMs) / 60000));

  // Hard Policy Rule 1: ETA > Freshness Deadline -> INELIGIBLE
  if (estimatedArrivalMs > freshnessDeadlineMs) {
    return {
      status: 'INELIGIBLE',
      freshnessDeadlineIso,
      estimatedArrivalIso,
      remainingFreshnessMinutes: 0,
      isEligible: false,
      requiresConfirmation: false,
      reason: 'फसल की ताज़गी डिलीवरी से पहले समाप्त हो जाएगी (INELIGIBLE)।',
    };
  }

  // Hard Policy Rule 2: ETA > Freshness Deadline - Safety Buffer -> AT_RISK
  if (estimatedArrivalMs > freshnessDeadlineMs - safetyBufferMs) {
    return {
      status: 'AT_RISK',
      freshnessDeadlineIso,
      estimatedArrivalIso,
      remainingFreshnessMinutes,
      isEligible: true,
      requiresConfirmation: true,
      reason: 'फसल की ताज़गी सीमा के निकट है (AT_RISK)। explicit confirmation आवश्यक है।',
    };
  }

  // Otherwise: SAFE
  return {
    status: 'SAFE',
    freshnessDeadlineIso,
    estimatedArrivalIso,
    remainingFreshnessMinutes,
    isEligible: true,
    requiresConfirmation: false,
    reason: 'डिलीवरी फसल की ताज़गी अवधि के भीतर सुरक्षित है (SAFE)।',
  };
}
