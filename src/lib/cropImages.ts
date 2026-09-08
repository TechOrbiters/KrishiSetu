/**
 * KrishiSetu Crop Image Catalog & Contextual Resolver
 * 
 * Maps Indian agricultural crops (English & Hindi) to high-quality, authentic
 * produce images so that no crop accidentally defaults to an unrelated photo (e.g. tomato).
 */

export const CROP_IMAGE_CATALOG: Record<string, string> = {
  // Vegetables
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  okra: 'https://images.unsplash.com/photo-1425543103986-22bad73d384a?auto=format&fit=crop&w=600&q=80',
  bhindi: 'https://images.unsplash.com/photo-1425543103986-22bad73d384a?auto=format&fit=crop&w=600&q=80',
  chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
  mirch: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
  garlic: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
  lahsun: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
  ginger: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  adrak: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  brinjal: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=600&q=80',
  baingan: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=600&q=80',
  eggplant: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=600&q=80',
  cabbage: 'https://images.unsplash.com/photo-1598030343246-e55543c55208?auto=format&fit=crop&w=600&q=80',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80',
  gobhi: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
  gajar: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
  radish: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=600&q=80',
  mooli: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=600&q=80',
  peas: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=600&q=80',
  matar: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=600&q=80',
  pumpkin: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=600&q=80',
  kaddu: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=600&q=80',
  cucumber: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=600&q=80',
  kheera: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=600&q=80',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
  palak: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
  coriander: 'https://images.unsplash.com/photo-1598030343246-e55543c55208?auto=format&fit=crop&w=600&q=80',
  dhaniya: 'https://images.unsplash.com/photo-1598030343246-e55543c55208?auto=format&fit=crop&w=600&q=80',
  mint: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=600&q=80',
  pudina: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=600&q=80',
  methi: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
  fenugreek: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
  bottle_gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=600&q=80',
  lauki: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=600&q=80',
  bitter_gourd: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=600&q=80',
  karela: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=600&q=80',
  lemon: 'https://images.unsplash.com/photo-1534947098675-926ff9d9f584?auto=format&fit=crop&w=600&q=80',
  nimbu: 'https://images.unsplash.com/photo-1534947098675-926ff9d9f584?auto=format&fit=crop&w=600&q=80',
  mushroom: 'https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?auto=format&fit=crop&w=600&q=80',

  // Grains & Cereals
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
  gehu: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
  paddy: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  dhan: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  chawal: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
  makka: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
  bajra: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
  jowar: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
  barley: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
  jau: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',

  // Pulses & Legumes
  gram: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&w=600&q=80',
  chana: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&w=600&q=80',
  chickpeas: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&w=600&q=80',
  arhar: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80',
  tur: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80',
  moong: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80',
  green_gram: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80',
  urad: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80',
  black_gram: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80',
  masoor: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80',
  lentil: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80',
  dal: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80',
  soyabean: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&w=600&q=80',

  // Oilseeds
  mustard: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80',
  sarson: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80',
  groundnut: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=600&q=80',
  peanuts: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=600&q=80',
  mungfali: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=600&q=80',
  sesame: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80',
  til: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80',

  // Fruits
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
  kela: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
  seb: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
  aam: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
  papaya: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80',
  papita: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80',
  guava: 'https://images.unsplash.com/photo-1536511135898-752b95b8cb46?auto=format&fit=crop&w=600&q=80',
  amrood: 'https://images.unsplash.com/photo-1536511135898-752b95b8cb46?auto=format&fit=crop&w=600&q=80',
  pomegranate: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  anar: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  watermelon: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
  tarbooj: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',

  // Commercial & Others
  sugarcane: 'https://images.unsplash.com/photo-1589135233689-d49495e865f1?auto=format&fit=crop&w=600&q=80',
  ganna: 'https://images.unsplash.com/photo-1589135233689-d49495e865f1?auto=format&fit=crop&w=600&q=80',
  gur: 'https://images.unsplash.com/photo-1589135233689-d49495e865f1?auto=format&fit=crop&w=600&q=80',
  jaggery: 'https://images.unsplash.com/photo-1589135233689-d49495e865f1?auto=format&fit=crop&w=600&q=80',
  cotton: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80',
  kapas: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80',
  firewood: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
  wood: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
};

// Neutral Agricultural Harvest Crate (used when crop is unclassified, NEVER a tomato!)
export const NEUTRAL_PRODUCE_FALLBACK =
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80';

// Known legacy placeholder tomato photo ID that was erroneously hardcoded across the codebase
const LEGACY_TOMATO_PHOTO_KEY = '1592924357228-91a4daadcfea';

/**
 * Check if the crop name corresponds to Tomato / टमाटर
 */
function isTomatoCrop(name: string): boolean {
  const norm = (name || '').toLowerCase();
  return norm.includes('tomato') || norm.includes('tamatar') || norm.includes('टमाटर');
}

/**
 * Get an accurate, high-definition photo for any Indian crop.
 * 
 * Intercepts cases where an incoming URL is the errant tomato placeholder,
 * but the actual crop is Potato, Wheat, Onion, Mustard, etc., and corrects it.
 * 
 * @param cropName English crop name (e.g. "Potato", "Wheat", "Bhindi (Okra)")
 * @param existingUrl Current image URL, if any
 * @param cropHindi Optional Hindi crop name (e.g. "आलू", "गेहूँ", "ताज़ी भिंडी")
 */
export function getAccurateCropImage(
  cropName?: string,
  existingUrl?: string,
  cropHindi?: string
): string {
  const nameCombined = `${cropName || ''} ${cropHindi || ''}`.toLowerCase().trim();

  // If user uploaded a legitimate custom image (Base64 data URI or storage URL), preserve it
  if (
    existingUrl &&
    typeof existingUrl === 'string' &&
    existingUrl.trim() !== '' &&
    (existingUrl.startsWith('data:image') ||
      existingUrl.startsWith('blob:') ||
      existingUrl.includes('supabase.co/storage') ||
      existingUrl.includes('firebasestorage.googleapis.com'))
  ) {
    return existingUrl;
  }

  // If existingUrl is the legacy tomato placeholder BUT the crop is NOT tomato,
  // we MUST override it with the correct crop photo!
  const hasErroneousTomatoUrl =
    existingUrl &&
    typeof existingUrl === 'string' &&
    existingUrl.includes(LEGACY_TOMATO_PHOTO_KEY) &&
    !isTomatoCrop(nameCombined);

  // If existingUrl is valid, non-empty, not the erroneous tomato URL, and looks like an image URL, keep it
  if (
    existingUrl &&
    typeof existingUrl === 'string' &&
    existingUrl.trim() !== '' &&
    !hasErroneousTomatoUrl &&
    !existingUrl.includes('placeholder')
  ) {
    return existingUrl;
  }

  // Search our catalog by crop name tokens
  const norm = nameCombined.replace(/[^a-z0-9\u0900-\u097F\s]/gi, ' ').toLowerCase();

  // Match specific known crops
  if (norm.includes('potato') || norm.includes('आलू') || norm.includes('aaloo') || norm.includes('alu')) {
    return CROP_IMAGE_CATALOG.potato;
  }
  if (norm.includes('onion') || norm.includes('प्याज') || norm.includes('pyaj') || norm.includes('pyaz')) {
    return CROP_IMAGE_CATALOG.onion;
  }
  if (norm.includes('tomato') || norm.includes('टमाटर') || norm.includes('tamatar')) {
    return CROP_IMAGE_CATALOG.tomato;
  }
  if (norm.includes('wheat') || norm.includes('गेहूं') || norm.includes('गेहूँ') || norm.includes('gehu') || norm.includes('sharbati')) {
    return CROP_IMAGE_CATALOG.wheat;
  }
  if (norm.includes('paddy') || norm.includes('rice') || norm.includes('धान') || norm.includes('चावल') || norm.includes('dhan') || norm.includes('chawal')) {
    return CROP_IMAGE_CATALOG.paddy;
  }
  if (norm.includes('mustard') || norm.includes('सरसों') || norm.includes('sarson') || norm.includes('rai') || norm.includes('राई')) {
    return CROP_IMAGE_CATALOG.mustard;
  }
  if (norm.includes('bhindi') || norm.includes('okra') || norm.includes('भिंडी') || norm.includes('ladyfinger')) {
    return CROP_IMAGE_CATALOG.okra;
  }
  if (norm.includes('chilli') || norm.includes('chili') || norm.includes('mirch') || norm.includes('मिर्च')) {
    return CROP_IMAGE_CATALOG.chilli;
  }
  if (norm.includes('garlic') || norm.includes('lahsun') || norm.includes('लहसुन')) {
    return CROP_IMAGE_CATALOG.garlic;
  }
  if (norm.includes('ginger') || norm.includes('adrak') || norm.includes('अदरक')) {
    return CROP_IMAGE_CATALOG.ginger;
  }
  if (norm.includes('brinjal') || norm.includes('baingan') || norm.includes('बैंगन') || norm.includes('eggplant')) {
    return CROP_IMAGE_CATALOG.brinjal;
  }
  if (norm.includes('cauliflower') || norm.includes('gobhi') || norm.includes('गोभी') || norm.includes('फूलगोभी')) {
    return CROP_IMAGE_CATALOG.cauliflower;
  }
  if (norm.includes('cabbage') || norm.includes('patta') || norm.includes('पत्तागोभी')) {
    return CROP_IMAGE_CATALOG.cabbage;
  }
  if (norm.includes('arhar') || norm.includes('tur') || norm.includes('तूर') || norm.includes('अरहर') || norm.includes('dal') || norm.includes('दाल') || norm.includes('pigeon pea')) {
    return CROP_IMAGE_CATALOG.arhar;
  }
  if (norm.includes('gram') || norm.includes('chana') || norm.includes('चना') || norm.includes('chickpea')) {
    return CROP_IMAGE_CATALOG.gram;
  }
  if (norm.includes('moong') || norm.includes('मूंग') || norm.includes('green gram')) {
    return CROP_IMAGE_CATALOG.moong;
  }
  if (norm.includes('urad') || norm.includes('उड़द') || norm.includes('black gram')) {
    return CROP_IMAGE_CATALOG.urad;
  }
  if (norm.includes('banana') || norm.includes('kela') || norm.includes('केला')) {
    return CROP_IMAGE_CATALOG.banana;
  }
  if (norm.includes('apple') || norm.includes('seb') || norm.includes('सेब')) {
    return CROP_IMAGE_CATALOG.apple;
  }
  if (norm.includes('mango') || norm.includes('aam') || norm.includes('आम')) {
    return CROP_IMAGE_CATALOG.mango;
  }
  if (norm.includes('papaya') || norm.includes('papita') || norm.includes('पपीता')) {
    return CROP_IMAGE_CATALOG.papaya;
  }
  if (norm.includes('lemon') || norm.includes('nimbu') || norm.includes('नींबू')) {
    return CROP_IMAGE_CATALOG.lemon;
  }
  if (norm.includes('carrot') || norm.includes('gajar') || norm.includes('गाजर')) {
    return CROP_IMAGE_CATALOG.carrot;
  }
  if (norm.includes('radish') || norm.includes('mooli') || norm.includes('मूली')) {
    return CROP_IMAGE_CATALOG.radish;
  }
  if (norm.includes('peas') || norm.includes('matar') || norm.includes('मटर')) {
    return CROP_IMAGE_CATALOG.peas;
  }
  if (norm.includes('pumpkin') || norm.includes('kaddu') || norm.includes('कद्दू')) {
    return CROP_IMAGE_CATALOG.pumpkin;
  }
  if (norm.includes('cucumber') || norm.includes('kheera') || norm.includes('खीरा')) {
    return CROP_IMAGE_CATALOG.cucumber;
  }
  if (norm.includes('spinach') || norm.includes('palak') || norm.includes('पालक')) {
    return CROP_IMAGE_CATALOG.spinach;
  }
  if (norm.includes('coriander') || norm.includes('dhaniya') || norm.includes('धनिया')) {
    return CROP_IMAGE_CATALOG.coriander;
  }
  if (norm.includes('maize') || norm.includes('corn') || norm.includes('makka') || norm.includes('मक्का')) {
    return CROP_IMAGE_CATALOG.maize;
  }
  if (norm.includes('gur') || norm.includes('jaggery') || norm.includes('गुड़')) {
    return CROP_IMAGE_CATALOG.gur;
  }
  if (norm.includes('sugarcane') || norm.includes('ganna') || norm.includes('गन्ना')) {
    return CROP_IMAGE_CATALOG.sugarcane;
  }
  if (norm.includes('groundnut') || norm.includes('peanut') || norm.includes('mungfali') || norm.includes('मूंगफली')) {
    return CROP_IMAGE_CATALOG.groundnut;
  }
  if (norm.includes('soyabean') || norm.includes('सोयाबीन')) {
    return CROP_IMAGE_CATALOG.soyabean;
  }
  if (norm.includes('cotton') || norm.includes('kapas') || norm.includes('कपास')) {
    return CROP_IMAGE_CATALOG.cotton;
  }
  if (norm.includes('wood') || norm.includes('firewood') || norm.includes('लकड़ी')) {
    return CROP_IMAGE_CATALOG.firewood;
  }

  // Fallback: neutral fresh agricultural produce crate, NOT a tomato!
  return NEUTRAL_PRODUCE_FALLBACK;
}
