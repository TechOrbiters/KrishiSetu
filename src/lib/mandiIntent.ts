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
  'जौ': { name: 'जौ', category: 'अनाज' },
  'jau': { name: 'जौ', category: 'अनाज' },
  'barley': { name: 'जौ', category: 'अनाज' },
  'ज्वार': { name: 'ज्वार', category: 'अनाज' },
  'jowar': { name: 'ज्वार', category: 'अनाज' },
  'sorghum': { name: 'ज्वार', category: 'अनाज' },

  // Pulses / दालें
  'चना': { name: 'चना', category: 'दालें' },
  'chana': { name: 'चना', category: 'दालें' },
  'gram': { name: 'चना', category: 'दालें' },
  'chickpea': { name: 'चना', category: 'दालें' },
  'chickpeas': { name: 'चना', category: 'दालें' },
  'मूंग': { name: 'मूंग दाल', category: 'दालें' },
  'moong': { name: 'मूंग दाल', category: 'दालें' },
  'mung': { name: 'मूंग दाल', category: 'दालें' },
  'उड़द': { name: 'उड़द दाल', category: 'दालें' },
  'urad': { name: 'उड़द दाल', category: 'दालें' },
  'अरहर': { name: 'अरहर दाल', category: 'दालें' },
  'arhar': { name: 'अरहर दाल', category: 'दालें' },
  'तूर': { name: 'तूर दाल', category: 'दालें' },
  'toor': { name: 'तूर दाल', category: 'दालें' },
  'tur': { name: 'तूर दाल', category: 'दालें' },
  'मसूर': { name: 'मसूर दाल', category: 'दालें' },
  'masoor': { name: 'मसूर दाल', category: 'दालें' },
  'lentil': { name: 'मसूर दाल', category: 'दालें' },
  'lentils': { name: 'मसूर दाल', category: 'दालें' },
  'दाल': { name: 'दाल', category: 'दालें' },
  'dal': { name: 'दाल', category: 'दालें' },
  'daal': { name: 'दाल', category: 'दालें' },
  'pulse': { name: 'दाल', category: 'दालें' },
  'pulses': { name: 'दाल', category: 'दालें' },
  'राजमा': { name: 'राजमा', category: 'दालें' },
  'rajma': { name: 'राजमा', category: 'दालें' },
  'kidney bean': { name: 'राजमा', category: 'दालें' },

  // Fruits / फल
  'सेब': { name: 'सेब', category: 'फल' },
  'seb': { name: 'सेब', category: 'फल' },
  'apple': { name: 'सेब', category: 'फल' },
  'apples': { name: 'सेब', category: 'फल' },
  'केला': { name: 'केला', category: 'फल' },
  'kela': { name: 'केला', category: 'फल' },
  'banana': { name: 'केला', category: 'फल' },
  'bananas': { name: 'केला', category: 'फल' },
  'आम': { name: 'आम', category: 'फल' },
  'aam': { name: 'आम', category: 'फल' },
  'mango': { name: 'आम', category: 'फल' },
  'mangoes': { name: 'आम', category: 'फल' },
  'संतरा': { name: 'संतरा', category: 'फल' },
  'santara': { name: 'संतरा', category: 'फल' },
  'orange': { name: 'संतरा', category: 'फल' },
  'oranges': { name: 'संतरा', category: 'फल' },
  'अंगूर': { name: 'अंगूर', category: 'फल' },
  'angoor': { name: 'अंगूर', category: 'फल' },
  'grape': { name: 'अंगूर', category: 'फल' },
  'grapes': { name: 'अंगूर', category: 'फल' },
  'पपीता': { name: 'पपीता', category: 'फल' },
  'papeeta': { name: 'पपीता', category: 'फल' },
  'papaya': { name: 'पपीता', category: 'फल' },
  'अमरूद': { name: 'अमरूद', category: 'फल' },
  'amrood': { name: 'अमरूद', category: 'फल' },
  'guava': { name: 'अमरूद', category: 'फल' },
  'अनार': { name: 'अनार', category: 'फल' },
  'anaar': { name: 'अनार', category: 'फल' },
  'pomegranate': { name: 'अनार', category: 'फल' },
  'तरबूज': { name: 'तरबूज', category: 'फल' },
  'tarbooz': { name: 'तरबूज', category: 'फल' },
  'watermelon': { name: 'तरबूज', category: 'फल' },
  'खरबूजा': { name: 'खरबूजा', category: 'फल' },
  'kharbooja': { name: 'खरबूजा', category: 'फल' },
  'muskmelon': { name: 'खरबूजा', category: 'फल' },
};

// Number word mappings for Hindi, Hinglish, and English
const NUMBER_WORDS: Record<string, number> = {
  'एक': 1, 'ek': 1, 'one': 1,
  'दो': 2, 'do': 2, 'two': 2,
  'तीन': 3, 'teen': 3, 'three': 3,
  'चार': 4, 'char': 4, 'four': 4,
  'पांच': 5, 'पाँच': 5, 'panch': 5, 'paanch': 5, 'five': 5,
  'छह': 6, 'छः': 6, 'che': 6, 'chhe': 6, 'six': 6,
  'सात': 7, 'saat': 7, 'seven': 7,
  'आठ': 8, 'aath': 8, 'eight': 8,
  'नौ': 9, 'nau': 9, 'nine': 9,
  'दस': 10, 'das': 10, 'ten': 10,
  'ग्यारह': 11, 'gyarah': 11, 'eleven': 11,
  'बारह': 12, 'barah': 12, 'twelve': 12,
  'तेरह': 13, 'terah': 13, 'thirteen': 13,
  'चौदह': 14, 'chaudah': 14, 'fourteen': 14,
  'पंद्रह': 15, 'pandrah': 15, 'fifteen': 15,
  'सोलह': 16, 'solah': 16, 'sixteen': 16,
  'सत्रह': 17, 'satrah': 17, 'seventeen': 17,
  'अठारह': 18, 'atharah': 18, 'eighteen': 18,
  'उन्नीस': 19, 'unnees': 19, 'unnis': 19, 'nineteen': 19,
  'बीस': 20, 'bees': 20, 'bis': 20, 'twenty': 20,
  'इक्कीस': 21, 'ikkees': 21,
  'बाईस': 22, 'baees': 22,
  'तेईस': 23, 'teees': 23,
  'चौबीस': 24, 'chaubees': 24,
  'पच्चीस': 25, 'pachees': 25, 'pachis': 25,
  'छब्बीस': 26, 'chhabees': 26,
  'सत्ताईस': 27, 'sattaees': 27,
  'अट्ठाईस': 28, 'atthaees': 28,
  'उनतीस': 29, 'untees': 29,
  'तीस': 30, 'tees': 30, 'thirty': 30,
  'पैंतीस': 35, 'paintees': 35,
  'चालीस': 40, 'chalis': 40, 'chaalees': 40, 'forty': 40,
  'पैंतालीस': 45, 'paintalis': 45,
  'पचास': 50, 'pachas': 50, 'pachaas': 50, 'fifty': 50,
  'पचपन': 55, 'pachpan': 55,
  'साठ': 60, 'saath': 60, 'sath': 60, 'sixty': 60,
  'पैंसठ': 65, 'painsath': 65,
  'सत्तर': 70, 'sattar': 70, 'seventy': 70,
  'पचहत्तर': 75, 'pachhattar': 75,
  'अस्सी': 80, 'assi': 80, 'eighty': 80,
  'पचासी': 85, 'pachasi': 85,
  'नब्बे': 90, 'nabbe': 90, 'ninety': 90,
  'सौ': 100, 'sau': 100, 'hundred': 100,
  'डेढ़ सौ': 150, 'dedh sau': 150,
  'ढाई सौ': 250, 'dhai sau': 250,
  'हजार': 1000, 'हज़ार': 1000, 'hazar': 1000, 'hajar': 1000, 'thousand': 1000,
};

/**
 * Converts Devanagari numerals (०-९) to standard ASCII digits (0-9)
 */
export function normalizeDevanagariDigits(str: string): string {
  const devDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return str.replace(/[०-९]/g, (d) => devDigits.indexOf(d).toString());
}

/**
 * Parses spoken numbers in Hindi, Hinglish, Devanagari digits, or English.
 * Returns numeric value, or undefined if no number is found.
 */
export function parseSpokenNumber(text: string): number | undefined {
  if (!text) return undefined;
  const s = normalizeDevanagariDigits(text.toLowerCase().trim());

  // 1. Direct digit match
  const directDigits = s.match(/\b(\d+(?:\.\d+)?)\b/);
  if (directDigits) {
    const val = parseFloat(directDigits[1]);
    if (!isNaN(val) && val > 0) return Math.round(val);
  }

  // 2. Multi-word phrases like "डेढ़ सौ", "ढाई सौ"
  if (s.includes('डेढ़ सौ') || s.includes('dedh sau')) return 150;
  if (s.includes('ढाई सौ') || s.includes('dhai sau')) return 250;

  // 3. Multiplier combinations like "दो सौ", "पांच सौ", "दो हजार"
  const multiplierRegex = /(एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|ek|do|teen|char|panch|paanch|che|saat|aath|nau|das)\s*(सौ|sau|hundred|हजार|हज़ार|hazar|thousand)/i;
  const multMatch = s.match(multiplierRegex);
  if (multMatch) {
    const base = NUMBER_WORDS[multMatch[1]] || 1;
    const multWord = multMatch[2];
    const mult = (multWord === 'सौ' || multWord === 'sau' || multWord === 'hundred') ? 100 : 1000;

    let remainder = 0;
    const remainderText = s.substring(s.indexOf(multMatch[0]) + multMatch[0].length).trim();
    for (const [word, val] of Object.entries(NUMBER_WORDS)) {
      if (remainderText.includes(word) && val < 100) {
        remainder = val;
        break;
      }
    }
    return base * mult + remainder;
  }

  // 4. Standalone number words (sorted descending so compound words match first)
  const sortedWords = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length);
  for (const word of sortedWords) {
    const regex = new RegExp(`(^|[^a-zA-Z\\u0900-\\u097F])${word}([^a-zA-Z\\u0900-\\u097F]|$)`, 'i');
    if (regex.test(s) || s.includes(word)) {
      return NUMBER_WORDS[word];
    }
  }

  return undefined;
}

/**
 * Parses full Hindi or Hinglish natural speech for Mandi produce listing fields:
 * - Crop Name & Category
 * - Total Quantity (in kg)
 * - Price per kg (in ₹)
 * - Minimum Order (strictly extracted if spoken, ZERO hallucinated default)
 * - Quality / Grade
 */
export function parseMandiIntent(text: string): ExtractedIntent {
  const normalized = normalizeDevanagariDigits(text);
  const lower = normalized.toLowerCase().trim();
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
  // Examples: 500 kilo, 500 किलो, 500 kg, 10 quintal, 10 क्विंटल, 2 ton, 2 टन, बीस किलो
  const qtyRegex = /([0-9]+|[a-zA-Z\u0900-\u097F]+)\s*(kilo|kg|kgs|quintal|qtl|ton|tonne|tonnes|किलो|किग्रा|किलोग्राम|क्विंटल|कुंतल|टन)/i;
  const qtyMatch = lower.match(qtyRegex);

  let rawUnit = '';
  if (qtyMatch && qtyMatch[1]) {
    const rawVal = parseSpokenNumber(qtyMatch[1]) || parseInt(qtyMatch[1], 10);
    if (rawVal && rawVal > 0) {
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
  }

  // 3. Price Extraction
  // Suffix patterns: "24 rupaye", "24 rupay", "24 rupey", "24 rupees", "24 rs", "24 रुपये", "24 रुपए", "24 भाव", "24 भाव से", "24 rate", "24 daam", "24 per kg", "24 प्रति किलो"
  const priceSuffixRegex = /([0-9]+|[a-zA-Z\u0900-\u097F]+)\s*(?:रुपये|रुपए|रु|rupaye|rupay|rupey|rupees|rs|rs\.|\/kg|per kg|प्रति किलो|प्रति किग्रा|प्रति kg|भाव|दर|दाम|bhav|bhaav|rate|daam)(?:\s+(?:किलो|kg|प्रति किलो|bhav|भाव|se|से))?/i;
  const priceSuffixMatch = lower.match(priceSuffixRegex);

  // Prefix patterns: "bhav 24", "rate 24", "bhaav 24", "price 24", "daam 24", "भाव 24", "दाम 24", "दर 24", "कीमत 24", "₹24", "rs 24"
  const pricePrefixRegex = /(?:₹|rs\.?|rupees|rupaye|rupay|rate|bhav|bhaav|price|daam|भाव|दाम|दर|कीमत|मूल्य)\s*(?:है|h|hai)?\s*([0-9]+|[a-zA-Z\u0900-\u097F]+)/i;
  const pricePrefixMatch = lower.match(pricePrefixRegex);

  if (priceSuffixMatch && priceSuffixMatch[1]) {
    const p = parseSpokenNumber(priceSuffixMatch[1]) || parseInt(priceSuffixMatch[1], 10);
    if (p && p > 0 && p < 50000) {
      pricePerKg = p;
    }
  } else if (pricePrefixMatch && pricePrefixMatch[1]) {
    const p = parseSpokenNumber(pricePrefixMatch[1]) || parseInt(pricePrefixMatch[1], 10);
    if (p && p > 0 && p < 50000) {
      pricePerKg = p;
    }
  }

  // If price was expressed per quintal (e.g. 2200 rupaye for 10 quintal gehu)
  if (pricePerKg && pricePerKg > 500 && rawUnit.includes('quintal')) {
    pricePerKg = Math.round(pricePerKg / 100);
  }

  // 4. Minimum Order Extraction — MUST run BEFORE the number fallback below
  // Robust pattern matching: supports conversational variations with filler words like "ऑर्डर", "आर्डर", "मात्रा", "का", "खरीद"
  // Prefix patterns: "न्यूनतम ऑर्डर मात्रा 20 किलो", "न्यूनतम ऑर्डर 20 किलो", "कम से कम आर्डर 25", "minimum order 50", "कम से कम बीस", "न्यूनतम बीस किलो"
  const minOrderPrefixRegex = /(?:कम से कम|न्यूनतम|kam se kam|minimum|min\s*order|min)\s*(?:का|की|के)?\s*(?:ऑर्डर|आर्डर|order)?\s*(?:की|का|के)?\s*(?:मात्रा|quantity|limit|खरीद)?\s*(?:है|हैं|h|hai)?\s*([0-9]+|[a-zA-Z\u0900-\u097F]+(?:\s+[a-zA-Z\u0900-\u097F]+)?)/i;
  const minOrderPrefixMatch = lower.match(minOrderPrefixRegex);

  // Suffix patterns: "20 किलो न्यूनतम", "बीस किलो कम से कम", "50 kg minimum order"
  const minOrderSuffixRegex = /([0-9]+|[a-zA-Z\u0900-\u097F]+)\s*(?:किलो|kg|किग्रा)?\s*(?:का)?\s*(?:ऑर्डर|आर्डर|order)?\s*(?:की|का|के)?\s*(?:मात्रा|quantity|limit)?\s*(?:न्यूनतम|कम से कम|minimum|min)/i;
  const minOrderSuffixMatch = lower.match(minOrderSuffixRegex);

  if (minOrderPrefixMatch && minOrderPrefixMatch[1]) {
    const parsed = parseSpokenNumber(minOrderPrefixMatch[1]);
    if (parsed && parsed > 0 && parsed < 50000) {
      minOrder = parsed;
    }
  } else if (minOrderSuffixMatch && minOrderSuffixMatch[1]) {
    const parsed = parseSpokenNumber(minOrderSuffixMatch[1]);
    if (parsed && parsed > 0 && parsed < 50000) {
      minOrder = parsed;
    }
  }

  // If minOrder context keyword is present in sentence but minOrder hasn't been set, find unassigned number
  if (!minOrder && /(?:कम से कम|न्यूनतम|kam se kam|minimum|min\b)/i.test(lower)) {
    const numbersInText = Array.from(lower.matchAll(/\b(\d+)\b/g)).map((m) => parseInt(m[1], 10));
    const candidate = numbersInText.find((n) => n !== quantity && n !== pricePerKg && n > 0 && n < 50000);
    if (candidate) {
      minOrder = candidate;
    }
  }

  // NOTE: No automatic default for minOrder here. The form submission in page.tsx
  // uses `Number(minOrder) || 10` as a safe fallback. Auto-defaults here caused
  // the bug where speaking a number for the minOrder voice field would be overridden.

  // Fallback for multi-field speech: assign remaining numbers to quantity/price
  // CRITICAL: exclude numbers already consumed by minOrder to prevent cross-field contamination
  const allNumbers = Array.from(lower.matchAll(/\b(\d+)\b/g)).map((m) => parseInt(m[1], 10));
  // Numbers still available (not consumed by minOrder)
  const unusedNumbers = allNumbers.filter((n) => n !== minOrder);
  if (!quantity && unusedNumbers.length >= 1) {
    // Only assign if there is no minOrder context keyword in the full sentence
    const hasMinOrderContext = /(?:न्यूनतम|कम से कम|minimum|min\b)/.test(lower);
    if (!hasMinOrderContext) {
      quantity = unusedNumbers[0];
    }
  }
  if (!pricePerKg && unusedNumbers.length >= 2) {
    const candidatePrice = unusedNumbers.find((n) => n !== quantity && n > 0 && n <= 5000);
    if (candidatePrice) {
      pricePerKg = candidatePrice;
    }
  } else if (!pricePerKg && unusedNumbers.length === 1 && quantity !== undefined && unusedNumbers[0] !== quantity) {
    // Only one unused number — if quantity was already set by keyword, this could be price
    const hasMinOrderContext = /(?:न्यूनतम|कम से कम|minimum|min\b)/.test(lower);
    if (!hasMinOrderContext && unusedNumbers[0] > 0 && unusedNumbers[0] <= 5000) {
      pricePerKg = unusedNumbers[0];
    }
  }

  // 5. Quality / Grade
  if (lower.includes('प्रीमियम') || lower.includes('premium') || lower.includes('top') || lower.includes('एक नंबर')) {
    quality = 'प्रीमियम';
  } else if (lower.includes('सामान्य') || lower.includes('normal') || lower.includes('chota') || lower.includes('छोटा')) {
    quality = 'सामान्य';
  } else {
    quality = 'अच्छी';
  }

  // 6. Location
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

