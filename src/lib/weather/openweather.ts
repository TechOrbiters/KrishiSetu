/**
 * OpenWeatherMap Integration Module
 * SERVER ONLY — Fetches live weather conditions for Mandi & Farmer locations.
 */

export interface WeatherData {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  conditionHindi: string;
  description: string;
  icon: string;
  city: string;
  isLive: boolean;
  timestamp: string;
}

const CONDITION_HINDI_MAP: Record<string, string> = {
  Clear: "साफ मौसम",
  Clouds: "बादल",
  Rain: "बारिश",
  Drizzle: "बूंदाबांदी",
  Thunderstorm: "आंधी-तूफान",
  Snow: "बर्फबारी",
  Mist: "धुंध",
  Smoke: "धुआं",
  Haze: "धुंध",
  Dust: "धूल",
  Fog: "कोहरा",
  Sand: "रेत",
  Ash: "राख",
  Squall: "तेज हवा",
  Tornado: "बवंडर",
};

/**
 * Fetches current weather from OpenWeatherMap 2.5 API.
 * Defaults to Barabanki / Central UP coordinates (lat: 26.9038, lon: 81.1852).
 */
export async function fetchCurrentWeather(
  lat: number = 26.9038,
  lon: number = 81.1852,
  city: string = "Barabanki"
): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.warn("[OpenWeather] OPENWEATHER_API_KEY is not configured. Returning seasonal fallback.");
    return getSeasonalFallback(lat, lon, city);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const res = await fetch(url, {
      next: { revalidate: 900 }, // Cache for 15 minutes in Next.js
    } as any);

    const data = await res.json();

    if (!res.ok || data.cod !== 200) {
      console.warn(`[OpenWeather] API responded with ${data.cod}: ${data.message}. Using seasonal fallback.`);
      return getSeasonalFallback(lat, lon, data.name || city);
    }

    const mainCondition = data.weather?.[0]?.main || "Clear";
    const conditionHindi = CONDITION_HINDI_MAP[mainCondition] || mainCondition;

    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // Convert m/s to km/h
      condition: mainCondition,
      conditionHindi,
      description: data.weather?.[0]?.description || "",
      icon: data.weather?.[0]?.icon || "01d",
      city: data.name || city,
      isLive: true,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error("[OpenWeather] Failed to fetch live weather:", err);
    return getSeasonalFallback(lat, lon, city);
  }
}

/**
 * Provides a realistic seasonal weather fallback for Uttar Pradesh / Central Indo-Gangetic Plains
 * in the event of upstream API key propagation delay or temporary network unavailability.
 */
function getSeasonalFallback(lat: number, lon: number, city: string): WeatherData {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const hour = now.getHours();

  // Seasonal temperature estimation for UP
  let baseTemp = 30;
  let condition = "Clear";
  let conditionHindi = "साफ मौसम";

  if (month >= 2 && month <= 5) {
    // Summer (March - June): 32 - 40°C
    baseTemp = 34;
  } else if (month >= 6 && month <= 8) {
    // Monsoon (July - September): 28 - 33°C with clouds/rain
    baseTemp = 30;
    condition = "Clouds";
    conditionHindi = "आंशिक बादल";
  } else if (month >= 9 && month <= 10) {
    // Post-monsoon (October - November): 24 - 29°C
    baseTemp = 27;
  } else {
    // Winter (December - February): 14 - 22°C
    baseTemp = 18;
    condition = "Haze";
    conditionHindi = "सुबह धुंध";
  }

  // Slight diurnal variation
  const diurnal = hour >= 12 && hour <= 16 ? 2 : hour >= 0 && hour <= 6 ? -3 : 0;
  const temp = baseTemp + diurnal;

  return {
    temp,
    feelsLike: temp + 1,
    tempMin: temp - 3,
    tempMax: temp + 3,
    humidity: month >= 6 && month <= 8 ? 75 : 55,
    windSpeed: 12,
    condition,
    conditionHindi,
    description: "Seasonal estimate",
    icon: condition === "Clouds" ? "03d" : "01d",
    city: city || "Barabanki",
    isLive: false,
    timestamp: now.toISOString(),
  };
}
