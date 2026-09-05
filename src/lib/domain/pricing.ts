/**
 * KRISHISETU — Pricing & Revenue Domain Engine
 * Strict Business Rule: Product price and transportation fee are ALWAYS separate.
 * Farmer receives full product_price * quantity with ZERO transport deduction.
 * Buyer pays (product_price * quantity) + delivery_fee.
 * Transporter receives delivery_fee.
 */

export interface RevenueBreakdown {
  quantityKg: number;
  productPricePerKg: number;
  productAmount: number;     // farmer_revenue = product_price * quantity
  farmerRevenue: number;     // Alias for productAmount
  deliveryFee: number;       // buyer-paid delivery charge
  platformFee: number;       // MVP ₹0
  buyerTotal: number;        // (product_price * quantity) + delivery_fee
  farmerPayout: number;      // Equals productAmount (Zero deduction!)
  transporterPayout: number; // Equals deliveryFee
}

export function calculateFarmerRevenue(
  productPricePerKg: number,
  quantityKg: number,
  deliveryFee: number = 0
): RevenueBreakdown {
  const productAmount = Math.round(productPricePerKg * quantityKg * 100) / 100;
  const platformFee = 0; // ₹0 for MVP
  const farmerPayout = productAmount; // Full product price, NO transport deduction!
  const transporterPayout = deliveryFee;
  const buyerTotal = Math.round((productAmount + deliveryFee + platformFee) * 100) / 100;

  return {
    quantityKg,
    productPricePerKg,
    productAmount,
    farmerRevenue: productAmount,
    deliveryFee,
    platformFee,
    buyerTotal,
    farmerPayout,
    transporterPayout,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('hi-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
