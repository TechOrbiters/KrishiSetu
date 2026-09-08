export interface ExtractedIntent {
  intent: string;
  crop?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  pricePerKg?: number;
  minOrder?: number;
  quality?: 'सामान्य' | 'अच्छी' | 'प्रीमियम';
  location?: string;
  rawText?: string;
}

const CROP_MAP: Record<string, { name: string; category: string }> = {
  // Vegetables / सब्जी
  'टमाटर': { name: 'टमाटर', category: 'सब्जी' },
  'tamatar': { name: 'टमाटर', category: 'सब्जी' },
  'tomato': { name: 'टमाटर', category: 'सब्जी' },
  'tomatoes': { name: 'टमाटर', category: 'सब्जी' },
  'आलू': { name: 'आलू', category: 'सब्जी' },
  'aloo': { name: 'आलू', category: 'सब्जी' },
  'aalu': { name: 'आलू', category: 'सब्जी' },
  'potato': { name: 'आलू', category: 'सब्जी' },
  'potatoes': { name: 'आलू', category: 'सब्जी' },
  'प्याज': { name: 'प्याज', category: 'सब्जी' },
  'प्याज़': { name: 'प्याज', category: 'सब्जी' },
  'pyaz': { name: 'प्याज', category: 'सब्जी' },
  'pyaaz': { name: 'प्याज', category: 'सब्जी' },
  'onion': { name: 'प्याज', category: 'सब्जी' },
  'onions': { name: 'प्याज', category: 'सब्जी' },
  'गोभी': { name: 'गोभी', category: 'सब्जी' },
  'फूलगोभी': { name: 'फूलगोभी', category: 'सब्जी' },
  'gobhi': { name: 'गोभी', category: 'सब्जी' },
  'phoolgobhi': { name: 'फूलगोभी', category: 'सब्जी' },
  'cauliflower': { name: 'फूलगोभी', category: 'सब्जी' },
  'पत्तागोभी': { name: 'पत्तागोभी', category: 'सब्जी' },
  'bandhagobhi': { name: 'पत्तागोभी', category: 'सब्जी' },
  'cabbage': { name: 'पत्तागोभी', category: 'सब्जी' },
  'मिर्च': { name: 'हरी मिर्च', category: 'सब्जी' },
  'हरी मिर्च': { name: 'हरी मिर्च', category: 'सब्जी' },
  'mirch': { name: 'हरी मिर्च', category: 'सब्जी' },
  'mirchi': { name: 'हरी मिर्च', category: 'सब्जी' },
  'chili': { name: 'हरी मिर्च', category: 'सब्जी' },
  'chilli': { name: 'हरी मिर्च', category: 'सब्जी' },
  'लहसुन': { name: 'लहसुन', category: 'सब्जी' },
  'lehsun': { name: 'लहसुन', category: 'सब्जी' },
  'lahsun': { name: 'लहसुन', category: 'सब्जी' },
  'garlic': { name: 'लहसुन', category: 'सब्जी' },
  'अदरक': { name: 'अदरक', category: 'सब्जी' },
  'adrak': { name: 'अदरक', category: 'सब्जी' },
  'ginger': { name: 'अदरक', category: 'सब्जी' },
  'बैंगन': { name: 'बैंगन', category: 'सब्जी' },
  'baingan': { name: 'बैंगन', category: 'सब्जी' },
  'brinjal': { name: 'बैंगन', category: 'सब्जी' },
  'eggplant': { name: 'बैंगन', category: 'सब्जी' },
  'भिंडी': { name: 'भिंडी', category: 'सब्जी' },
  'bhindi': { name: 'भिंडी', category: 'सब्जी' },
  'okra': { name: 'भिंडी', category: 'सब्जी' },
  'ladyfinger': { name: 'भिंडी', category: 'सब्जी' },
  'गाजर': { name: 'गाजर', category: 'सब्जी' },
  'gajar': { name: 'गाजर', category: 'सब्जी' },
  'carrot': { name: 'गाजर', category: 'सब्जी' },
  'मूली': { name: 'मूली', category: 'सब्जी' },
  'mooli': { name: 'मूली', category: 'सब्जी' },
  'radish': { name: 'मूली', category: 'सब्जी' },
  'मटर': { name: 'मटर', category: 'सब्जी' },
  'matar': { name: 'मटर', category: 'सब्जी' },
  'peas': { name: 'मटर', category: 'सब्जी' },
  'pea': { name: 'मटर', category: 'सब्जी' },
  'खीरा': { name: 'खीरा', category: 'सब्जी' },
  'kheera': { name: 'खीरा', category: 'सब्जी' },
  'cucumber': { name: 'खीरा', category: 'सब्जी' },
  'लौकी': { name: 'लौकी', category: 'सब्जी' },
  'lauki': { name: 'लौकी', category: 'सब्जी' },
  'कद्दू': { name: 'कद्दू', category: 'सब्जी' },
  'kaddu': { name: 'कद्दू', category: 'सब्जी' },
  'pumpkin': { name: 'कद्दू', category: 'सब्जी' },
  'पालक': { name: 'पालक', category: 'सब्जी' },
  'palak': { name: 'पालक', category: 'सब्जी' },
  'spinach': { name: 'पालक', category: 'सब्जी' },
  'धनिया': { name: 'धनिया', category: 'सब्जी' },
  'dhaniya': { name: 'धनिया', category: 'सब्जी' },
  'coriander': { name: 'धनिया', category: 'सब्जी' },
  'शिमला मिर्च': { name: 'शिमला मिर्च', category: 'सब्जी' },
  'shimla mirch': { name: 'शिमला मिर्च', category: 'सब्जी' },
  'capsicum': { name: 'शिमला मिर्च', category: 'सब्जी' },

  // Grains / अनाज
  'गेहूँ': { name: 'गेहूँ', category: 'अनाज' },
  'गेहूं': { name: 'गेहूँ', category: 'अनाज' },
  'gehu': { name: 'गेहूँ', category: 'अनाज' },
  'gehoon': { name: 'गेहूँ', category: 'अनाज' },
  'wheat': { name: 'गेहूँ', category: 'अनाज' },
  'चावल': { name: 'चावल', category: 'अनाज' },
  'chawal': { name: 'चावल', category: 'अनाज' },
  'rice': { name: 'चावल', category: 'अनाज' },
  'धान': { name: 'धान', category: 'अनाज' },
  'dhan': { name: 'धान', category: 'अनाज' },
  'paddy': { name: 'धान', category: 'अनाज' },
  'मक्का': { name: 'मक्का', category: 'अनाज' },
  'makka': { name: 'मक्का', category: 'अनाज' },
  'maize': { name: 'मक्का', category: 'अनाज' },
  'corn': { name: 'मक्का', category: 'अनाज' },
  'बाजरा': { name: 'बाजरा', category: 'अनाज' },
  'bajra': { name: 'बाजरा', category: 'अनाज' },
  'millet': { name: 'बाजरा', category: 'अनाज' },
  'ज्वार': { name: 'ज्वार', category: 'अनाज' },
  'jowar': { name: 'ज्वार', category: 'अनाज' },
  'सरसों': { name: 'सरसों', category: 'अनाज' },
  'sarso': { name: 'सरसों', category: 'अनाज' },
  'mustard': { name: 'सरसों', category: 'अनाज' },
  'सोयाबीन': { name: 'सोयाबीन', category: 'अनाज' },
  'soyabean': { name: 'सोयाबीन', category: 'अनाज' },
  'soybean': { name: 'सोयाबीन', category: 'अनाज' },
  'कपास': { name: 'कपास', category: 'अनाज' },
  'kapas': { name: 'कपास', category: 'अनाज' },
  'cotton': { name: 'कपास', category: 'अनाज' },

  // Pulses / दालें
  'चना': { name: 'चना', category: 'दालें' },
  'chana': { name: 'चना', category: 'दालें' },
  'gram': { name: 'चना', category: 'दालें' },
  'chickpea': { name: 'चना', category: 'दालें' },
  'अरहर': { name: 'अरहर दाल', category: 'दालें' },
  'arhar': { name: 'अरहर दाल', category: 'दालें' },
  'मूंग': { name: 'मूंग दाल', category: 'दालें' },
  'moong': { name: 'मूंग दाल', category: 'दालें' },
  'उड़द': { name: 'उड़द दाल', category: 'दालें' },
  'urad': { name: 'उड़द दाल', category: 'दालें' },

  // Fruits / फल
  'सेब': { name: 'सेब', category: 'फल' },
  'seb': { name: 'सेब', category: 'फल' },
  'apple': { name: 'सेब', category: 'फल' },
  'आम': { name: 'आम', category: 'फल' },
  'aam': { name: 'आम', category: 'फल' },
  'mango': { name: 'आम', category: 'फल' },
  'केला': { name: 'केला', category: 'फल' },
  'kela': { name: 'केला', category: 'फल' },
  'banana': { name: 'केला', category: 'फल' },
  'संतरा': { name: 'संतरा', category: 'फल' },
  'santra': { name: 'संतरा', category: 'फल' },
  'orange': { name: 'संतरा', category: 'फल' },
  'अनार': { name: 'अनार', category: 'फल' },
  'anar': { name: 'अनार', category: 'फल' },
  'pomegranate': { name: 'अनार', category: 'फल' },
  'पपीता': { name: 'पपीता', category: 'फल' },
  'papita': { name: 'पपीता', category: 'फल' },
  'papaya': { name: 'पपीता', category: 'फल' },
  'तरबूज': { name: 'तरबूज', category: 'फल' },
  'tarbooj': { name: 'तरबूज', category: 'फल' },
  'watermelon': { name: 'तरबूज', category: 'फल' },
};

/**
 * Parses full Hindi or Hinglish natural speech for Mandi produce listing fields:
 * - Crop Name & Category
 * - Total Quantity (in kg)
 * - Price per kg (in ₹)
 * - Minimum Order
 * - Quality / Grade
 */
export function parseMandiIntent(text: string): ExtractedIntent {
  const lower = text.toLowerCase().trim();
  let crop: string | undefined;
  let category = 'सब्जी';
  let quantity: number | undefined;
  let unit = 'kg';
  let pricePerKg: number | undefined;
  let minOrder: number | undefined;
  let quality: ExtractedIntent['quality'] = 'अच्छी';
  let location: string | undefined;

  // 1. Crop Detection (matches longest match first)
  const sortedCropKeys = Object.keys(CROP_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedCropKeys) {
    const regex = new RegExp(`(^|[^a-zA-Z\\u0900-\\u097F])${key}([^a-zA-Z\\u0900-\\u097F]|$)`, 'i');
    if (regex.test(lower) || lower.includes(key.toLowerCase())) {
      const match = CROP_MAP[key];
      crop = match.name;
      category = match.category;
      break;
    }
  }

  // 2. Quantity Extraction
  // Examples: 500 kilo, 500 किलो, 500 kg, 10 quintal, 10 क्विंटल, 2 ton, 2 टन
  const qtyRegex = /(\d+)\s*(kilo|kg|kgs|quintal|qtl|ton|tonne|tonnes|किलो|किग्रा|किलोग्राम|क्विंटल|कुंतल|टन)/i;
  const qtyMatch = lower.match(qtyRegex);

  let rawUnit = '';
  if (qtyMatch && qtyMatch[1]) {
    const rawVal = parseInt(qtyMatch[1], 10);
    rawUnit = (qtyMatch[2] || '').toLowerCase();

    if (rawUnit.includes('quintal') || rawUnit.includes('qtl') || rawUnit.includes('क्विंटल') || rawUnit.includes('कुंतल')) {
      quantity = rawVal * 100; // 1 quintal = 100 kg
      unit = 'kg';
    } else if (rawUnit.includes('ton') || rawUnit.includes('टन')) {
      quantity = rawVal * 1000; // 1 ton = 1000 kg
      unit = 'kg';
    } else {
      quantity = rawVal;
      unit = 'kg';
    }
  }

  // 3. Price Extraction
  // Suffix patterns: "24 rupaye", "24 rupay", "24 rupey", "24 rupees", "24 rs", "24 रुपये", "24 रुपए", "24 भाव", "24 भाव से", "24 rate", "24 daam", "24 per kg", "24 प्रति किलो"
  const priceSuffixRegex = /(\d+)\s*(?:रुपये|रुपए|रु|rupaye|rupay|rupey|rupees|rs|rs\.|\/kg|per kg|प्रति किलो|प्रति किग्रा|प्रति kg|भाव|दर|दाम|bhav|bhaav|rate|daam)(?:\s+(?:किलो|kg|प्रति किलो|bhav|भाव|se|से))?/i;
  const priceSuffixMatch = lower.match(priceSuffixRegex);

  // Prefix patterns: "bhav 24", "rate 24", "bhaav 24", "price 24", "daam 24", "भाव 24", "दाम 24", "दर 24", "कीमत 24", "₹24", "rs 24"
  const pricePrefixRegex = /(?:₹|rs\.?|rupees|rupaye|rupay|rate|bhav|bhaav|price|daam|भाव|दाम|दर|कीमत|मूल्य)\s*(?:है|h|hai)?\s*(\d+)/i;
  const pricePrefixMatch = lower.match(pricePrefixRegex);

  if (priceSuffixMatch && priceSuffixMatch[1]) {
    const p = parseInt(priceSuffixMatch[1], 10);
    if (p > 0 && p < 50000) {
      pricePerKg = p;
    }
  } else if (pricePrefixMatch && pricePrefixMatch[1]) {
    const p = parseInt(pricePrefixMatch[1], 10);
    if (p > 0 && p < 50000) {
      pricePerKg = p;
    }
  }

  // If price was expressed per quintal (e.g. 2200 rupaye for 10 quintal gehu)
  if (pricePerKg && pricePerKg > 500 && rawUnit.includes('quintal')) {
    pricePerKg = Math.round(pricePerKg / 100);
  }

  // Fallback: If 2 numbers exist in speech and one was matched as quantity, the other is likely the price
  const allNumbers = Array.from(lower.matchAll(/\b(\d+)\b/g)).map((m) => parseInt(m[1], 10));
  if (!quantity && allNumbers.length >= 1) {
    quantity = allNumbers[0];
  }
  if (!pricePerKg && allNumbers.length >= 2) {
    const candidatePrice = allNumbers.find((n) => n !== quantity && n > 0 && n <= 5000);
    if (candidatePrice) {
      pricePerKg = candidatePrice;
    }
  }

  // Minimum Order (if mentioned e.g. "kam se kam 50 kilo" or "minimum 50")
  const minOrderMatch = lower.match(/(?:कम से कम|न्यूनतम|kam se kam|minimum|min)\s*(\d+)/i);
  if (minOrderMatch && minOrderMatch[1]) {
    minOrder = parseInt(minOrderMatch[1], 10);
  } else if (quantity && quantity >= 100) {
    minOrder = Math.min(50, Math.round(quantity / 5));
  } else if (quantity) {
    minOrder = Math.min(10, quantity);
  }

  // Quality / Grade
  if (lower.includes('प्रीमियम') || lower.includes('premium') || lower.includes('top') || lower.includes('एक नंबर')) {
    quality = 'प्रीमियम';
  } else if (lower.includes('सामान्य') || lower.includes('normal') || lower.includes('chota') || lower.includes('छोटा')) {
    quality = 'सामान्य';
  } else {
    quality = 'अच्छी';
  }

  // Location
  const cityMatch = lower.match(/(?:in|mein|में|at|se|से)\s+([a-zA-Z\u0900-\u097F]+)/i);
  if (cityMatch && cityMatch[1]) {
    const loc = cityMatch[1].trim();
    if (!['kilo', 'rupaye', 'bhav', 'mandi', 'किलो', 'रुपये', 'भाव'].includes(loc.toLowerCase())) {
      location = loc.charAt(0).toUpperCase() + loc.slice(1);
    }
  }

  return {
    intent: 'CREATE_LISTING',
    crop,
    category,
    quantity,
    unit,
    pricePerKg,
    minOrder,
    quality,
    location,
    rawText: text,
  };
}
