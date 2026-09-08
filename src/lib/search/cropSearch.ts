/**
 * KrishiSetu Multilingual & Phonetic Produce Search Engine
 * 
 * Supports:
 * - English names ("tomato", "potato", "wheat")
 * - Hindi Devanagari ("टमाटर", "आलू", "गेहूं")
 * - Phonetic Hinglish / Transliteration ("tamatar", "aloo", "pyaz", "gehu", "sarson", "mirch")
 * - Farmer, FPO, Mandi district, variety, and quality matching
 */

import { ProduceListing } from '@/types';
import { getAccurateCropImage } from '@/lib/cropImages';

export interface TrendingSearchItem {
  id: string;
  emoji: string;
  nameHi: string;
  nameEn: string;
  query: string;
  category: string;
}

export const TRENDING_SEARCHES: TrendingSearchItem[] = [
  { id: 't-1', emoji: '🍅', nameHi: 'टमाटर', nameEn: 'Tomato', query: 'टमाटर', category: 'VEGETABLES' },
  { id: 't-2', emoji: '🥔', nameHi: 'आलू', nameEn: 'Potato', query: 'आलू', category: 'VEGETABLES' },
  { id: 't-3', emoji: '🧅', nameHi: 'प्याज', nameEn: 'Onion', query: 'प्याज', category: 'VEGETABLES' },
  { id: 't-4', emoji: '🌾', nameHi: 'गेहूं', nameEn: 'Wheat', query: 'गेहूं', category: 'GRAINS' },
  { id: 't-5', emoji: '🌱', nameHi: 'सरसों', nameEn: 'Mustard', query: 'सरसों', category: 'OILSEEDS' },
  { id: 't-6', emoji: '🌶️', nameHi: 'हरी मिर्च', nameEn: 'Chilli', query: 'मिर्च', category: 'VEGETABLES' },
  { id: 't-7', emoji: '🧄', nameHi: 'लहसुन', nameEn: 'Garlic', query: 'लहसुन', category: 'VEGETABLES' },
  { id: 't-8', emoji: '🍌', nameHi: 'केला', nameEn: 'Banana', query: 'केला', category: 'FRUITS' },
];

/**
 * Phonetic & Multilingual Crop Synonyms Dictionary
 */
const CROP_SYNONYMS: Record<string, string[]> = {
  tomato: ['tomato', 'tamatar', 'tamaatar', 'टमाटर', 'टमाटर देसी', 'टमाटर हाइब्रिड'],
  potato: ['potato', 'aalu', 'aloo', 'alu', 'आलू', 'चिप्सोना', 'पुखराज'],
  onion: ['onion', 'pyaz', 'pyaaz', 'piyaz', 'प्याज', 'कांदा', 'लाल प्याज'],
  wheat: ['wheat', 'gehu', 'gehun', 'gehoon', 'गेहूं', 'शरबती', 'सीहोर', 'कनक'],
  mustard: ['mustard', 'sarson', 'sarso', 'सरसों', 'राई', 'पीली सरसों', 'काली सरसों'],
  chilli: ['chilli', 'chili', 'mirch', 'mirchi', 'तीखी मिर्च', 'हरी मिर्च', 'लाल मिर्च', 'मिर्च'],
  garlic: ['garlic', 'lahsun', 'lasan', 'lehsun', 'लहसुन', 'देसी लहसुन'],
  ginger: ['ginger', 'adrak', 'adrakh', 'अदरक'],
  okra: ['okra', 'bhindi', 'bhendi', 'भिंडी', 'लेडी फिंगर'],
  cauliflower: ['cauliflower', 'gobhi', 'phool gobhi', 'phoolgobhi', 'गोभी', 'फूलगोभी'],
  cabbage: ['cabbage', 'band gobhi', 'patta gobhi', 'pattagobhi', 'पत्तागोभी', 'बंदगोभी'],
  brinjal: ['brinjal', 'eggplant', 'baingan', 'baigan', 'बैंगन', 'भंटा'],
  carrot: ['carrot', 'gajar', 'gaajar', 'गाजर'],
  radish: ['radish', 'mooli', 'muli', 'मूली'],
  peas: ['peas', 'matar', 'mattar', 'green peas', 'मटर', 'हरी मटर'],
  gram: ['gram', 'chana', 'channa', 'चना', 'चना दाल', 'काबुली चना', 'देसी चना'],
  paddy: ['paddy', 'rice', 'dhan', 'dhaan', 'chawal', 'धान', 'चावल', 'बासमती'],
  maize: ['maize', 'corn', 'makka', 'bhutta', 'मक्का', 'भुट्टा'],
  sugarcane: ['sugarcane', 'ganna', 'ईख', 'गन्ना'],
  banana: ['banana', 'kela', 'केला', 'जी-9', 'हरिछाल'],
  apple: ['apple', 'seb', 'सेब', 'कश्मीरी सेब', 'शिमला सेब'],
  mango: ['mango', 'aam', 'आम', 'दशहरी', 'लंगड़ा', 'चौसा'],
  papaya: ['papaya', 'papita', 'पपीता'],
  lemon: ['lemon', 'nimbu', 'neebu', 'नींबू'],
  cucumber: ['cucumber', 'kheera', 'khira', 'खीरा', 'ककड़ी'],
  spinach: ['spinach', 'palak', 'पालक'],
  coriander: ['coriander', 'dhaniya', 'धनिया', 'हरा धनिया'],
  mint: ['mint', 'pudina', 'पुदीना'],
  fenugreek: ['fenugreek', 'methi', 'मेथी'],
  bottle_gourd: ['bottle gourd', 'lauki', 'ghiya', 'लौकी', 'घिया'],
  bitter_gourd: ['bitter gourd', 'karela', 'करेला'],
  pumpkin: ['pumpkin', 'kaddu', 'sitaphal', 'कद्दू', 'सीताफल'],
};

/**
 * Normalizes an input string by converting to lowercase, trimming,
 * and standardizing whitespace.
 */
export function normalizeQuery(q: string): string {
  if (!q) return '';
  return q
    .toLowerCase()
    .trim()
    .replace(/[,\.?!।]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Checks if a ProduceListing matches a user search query across
 * English names, Hindi names, Hinglish transliterations, varieties,
 * farmers, FPOs, and cultivation locations.
 */
export function matchesProduceSearch(item: ProduceListing, query: string): boolean {
  if (!item) return false;
  const q = normalizeQuery(query);
  if (!q) return true;

  // 1. Direct name matches (English & Hindi)
  const cropEn = (item.crop || '').toLowerCase();
  const cropHi = (item.cropHindi || '').toLowerCase();
  if (cropEn.includes(q) || cropHi.includes(q)) return true;

  // 2. Direct tokens check
  const qTokens = q.split(' ').filter(Boolean);
  const textCorpus = [
    item.crop,
    item.cropHindi,
    item.variety,
    item.cultivationLocation,
    item.farmerName,
    item.fpoName,
    item.quality,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // If all tokens match any part of the corpus
  if (qTokens.every((token) => textCorpus.includes(token))) {
    return true;
  }

  // 3. Synonym and Phonetic transliteration match
  for (const [canonicalKey, synonyms] of Object.entries(CROP_SYNONYMS)) {
    // Does the search query match this canonical crop or any of its synonyms?
    const queryMatchesSynonym = synonyms.some(
      (syn) => syn.toLowerCase().includes(q) || q.includes(syn.toLowerCase())
    );

    if (queryMatchesSynonym) {
      // If yes, check if the current produce item is of this crop type
      const isItemThisCrop =
        cropEn.includes(canonicalKey) ||
        synonyms.some(
          (syn) =>
            cropEn.includes(syn.toLowerCase()) ||
            cropHi.includes(syn.toLowerCase())
        );

      if (isItemThisCrop) return true;
    }
  }

  return false;
}

/**
 * Cleans conversational filler words from voice transcripts
 * (e.g. "मुझे 50 किलो टमाटर चाहिए" -> "टमाटर")
 */
export function cleanVoiceSearchQuery(rawText: string): string {
  if (!rawText) return '';
  let cleaned = rawText
    .trim()
    .replace(/^(search for|search|find|show me|look for|i want|mujhe|chahiye|dikhayein|dikhaye|kripya|kripya karke)\s+/i, '')
    .replace(/\s+(chahiye|chahiye tha|dikhayein|dikhaye|search karo|khojo|khoj|batao|rate batao)$/i, '')
    .trim();

  // If user said something like "50 kg tamatar", preserve the key crop
  for (const [key, synonyms] of Object.entries(CROP_SYNONYMS)) {
    for (const syn of synonyms) {
      if (cleaned.toLowerCase().includes(syn.toLowerCase())) {
        return syn;
      }
    }
  }

  return cleaned;
}

/**
 * Derives unique crop suggestions from live listings and catalog
 * matching the user query.
 */
export interface CropSuggestion {
  cropName: string;
  cropHindi: string;
  emoji: string;
  imageUrl: string;
  minPrice: number;
  totalQuantityKg: number;
  listingCount: number;
}

export function getInstantCropSuggestions(
  query: string,
  listings: ProduceListing[]
): CropSuggestion[] {
  const q = normalizeQuery(query);
  if (!q) return [];

  const matchedListings = listings.filter((item) => matchesProduceSearch(item, q));
  const groups: Record<string, CropSuggestion> = {};

  matchedListings.forEach((item) => {
    const key = (item.crop || '').toLowerCase().trim();
    if (!groups[key]) {
      groups[key] = {
        cropName: item.crop,
        cropHindi: item.cropHindi || item.crop,
        emoji: '🌿',
        imageUrl: getAccurateCropImage(item.crop, item.image, item.cropHindi),
        minPrice: item.pricePerKg,
        totalQuantityKg: item.quantityKg || 0,
        listingCount: 1,
      };
    } else {
      groups[key].listingCount += 1;
      groups[key].totalQuantityKg += item.quantityKg || 0;
      if (item.pricePerKg < groups[key].minPrice) {
        groups[key].minPrice = item.pricePerKg;
      }
    }
  });

  return Object.values(groups).slice(0, 5);
}
