import { z } from 'zod';

export const VisionAnalysisInputSchema = z.object({
  imageUrl: z.string().optional(),
  imageBase64: z.string().optional(),
});

export const VisionAnalysisOutputSchema = z.object({
  detectedCrop: z.string(),
  confidence: z.number().min(0).max(1),
  visualCondition: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR', 'UNKNOWN']),
  damageIndicators: z.array(z.string()),
  suggestions: z.array(z.string()),
  modelTimestamp: z.string(),
  fallbackUsed: z.boolean(),
  notes: z.string().optional(),
});

export const DemandSenseInputSchema = z.object({
  crop: z.string().min(1, 'Crop name is required'),
  location: z.string().optional().default('Barabanki'),
});

export const DemandSenseOutputSchema = z.object({
  forecast: z.object({
    crop: z.string(),
    location: z.string(),
    expectedDemandTonnes: z.number(),
    nearbySupplyTonnes: z.number(),
    supplyGapKg: z.number(),
    trendPct: z.number(),
    trendDirection: z.enum(['UP', 'DOWN', 'STABLE']),
    priceRange: z.object({
      min: z.number(),
      max: z.number(),
      avg: z.number(),
    }),
    explanation: z.string(),
  }),
  confidence: z.number().min(0).max(100),
  sourceTimestamp: z.string(),
  fallbackUsed: z.boolean(),
});

export const SellSmartInputSchema = z.object({
  crop: z.string().min(1, 'Crop is required'),
  quantityKg: z.number().positive('Quantity must be greater than 0'),
  farmerAskingPrice: z.number().positive('Price per kg must be positive'),
  location: z.string().optional().default('Barabanki'),
});

export const SellingOptionSchema = z.object({
  id: z.string(),
  buyerName: z.string(),
  buyerType: z.enum(['LOCAL_MANDI', 'RETAILER', 'HOTEL', 'PROCESSOR']),
  offeredPricePerKg: z.number(),
  quantityNeededKg: z.number(),
  distanceKm: z.number(),
  farmerRevenue: z.number(),
  deliveryFeePaidByBuyer: z.number(),
  whyThisOption: z.array(z.string()),
  isRecommended: z.boolean(),
});

export const SellSmartOutputSchema = z.object({
  sellingOptions: z.array(SellingOptionSchema),
  recommendedOptionId: z.string(),
  revenueComparison: z.object({
    highestRevenue: z.number(),
    baselineMandiRevenue: z.number(),
    gainAmount: z.number(),
  }),
  dataTimestamp: z.string(),
});

export const MarketPilotInputSchema = z.object({
  crop: z.string().min(1, 'Crop is required'),
  freshnessRemainingHours: z.number().nonnegative(),
  quantityKg: z.number().positive(),
  askingPrice: z.number().positive().optional(),
  location: z.string().optional().default('Barabanki'),
});

export const MarketPilotOutputSchema = z.object({
  opportunityScore: z.number().min(0).max(100),
  action: z.enum(['SELL_NOW', 'HOLD', 'SELL_PARTIALLY']),
  sellPercentage: z.number().min(0).max(100),
  holdPercentage: z.number().min(0).max(100),
  reason: z.string(),
  bulletPoints: z.array(z.string()),
  dataTimestamp: z.string(),
});
