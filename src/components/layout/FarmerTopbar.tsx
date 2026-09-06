'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Sun, Cloud, CloudRain, CloudLightning, CloudFog, ChevronDown } from 'lucide-react';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { fetchWeatherData, WeatherData } from '@/lib/api/client';

function getWeatherIcon(condition?: string) {
  const cond = condition?.toLowerCase() || '';
  if (cond.includes('rain') || cond.includes('drizzle')) {
    return <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 fill-blue-100 flex-shrink-0" />;
  }
  if (cond.includes('thunder')) {
    return <CloudLightning className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 fill-amber-100 flex-shrink-0" />;
  }
  if (cond.includes('cloud')) {
    return <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 fill-slate-100 flex-shrink-0" />;
  }
  if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) {
    return <CloudFog className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />;
  }
  return <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-100 flex-shrink-0" />;
}

export const FarmerTopbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, notificationsCount } = useFarmerStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchWeatherData().then((res) => {
      if (isMounted && res.success && res.data) {
        setWeather(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const getPageTitle = () => {
    if (pathname.includes('/profile'))       return 'मेरा प्रोफाइल';
    if (pathname.includes('/market-prices')) return 'बाजार भाव';
    if (pathname.includes('/orders'))        return 'मेरे ऑर्डर';
    if (pathname.includes('/delivery'))      return 'डिलीवरी ट्रैक करें';
    if (pathname.includes('/listings/new'))  return 'नई उपज लिस्ट करें';
    if (pathname.includes('/listings'))      return 'मेरी उपज';
    if (pathname.includes('/payments'))      return 'भुगतान';
    if (pathname.includes('/help'))          return 'सहायता केंद्र';
    if (pathname.includes('/ai-assistant'))  return 'कृषि AI सहायक';
    if (pathname.includes('/ai-recommendations')) return 'AI सुझाव';
    if (pathname.includes('/fpo'))           return 'FPO प्रबंधन';
    return 'डैशबोर्ड';
  };

  const isHome = pathname === '/farmer/dashboard';

  return (
    <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-4 sticky top-0 z-30 shadow-2xs flex items-center justify-between gap-2">
      {/* Left Title & Greeting */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {!isHome && (
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        )}
        <div className="min-w-0">
          {isHome ? (
            <>
              <h1 className="font-extrabold text-base sm:text-2xl text-slate-900 leading-tight flex items-center gap-1 truncate">
                <span className="truncate">नमस्ते {user.fullName.split(' ')[0]} जी</span>
                <span className="flex-shrink-0 text-sm sm:text-base">👋</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                स्वागत है आपके किसान डैशबोर्ड पर
              </p>
            </>
          ) : (
            <>
              <h1 className="font-extrabold text-sm sm:text-xl text-slate-900 leading-tight truncate">
                {getPageTitle()}
              </h1>
              {pathname.includes('/delivery') && (
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">ऑर्डर लाइव ट्रैकिंग</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Header Widgets: Location, Weather, Notification Bell */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Location Selector Pill */}
        <button className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1 hover:bg-slate-50 transition-colors shadow-2xs">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
          <div className="text-left leading-tight">
            <span className="font-bold text-slate-900 text-[11px] sm:text-xs">बैजनापुर</span>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Weather Widget Pill */}
        <div 
          className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1.5 shadow-2xs transition-all hover:bg-slate-50 cursor-default"
          title={weather ? `${weather.city}: ${weather.conditionHindi} (${weather.condition}) | आर्द्रता: ${weather.humidity}% | हवा: ${weather.windSpeed} km/h` : 'मौसम लोड हो रहा है...'}
        >
          {getWeatherIcon(weather?.condition)}
          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
            {weather ? `${weather.temp}°C` : '32°C'}
          </span>
        </div>

        {/* Notification Bell Badge */}
        <button className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex-shrink-0" aria-label={`${notificationsCount} notifications`}>
          <span className="text-xs sm:text-base">🔔</span>
          {notificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white">
              {notificationsCount > 9 ? '9+' : notificationsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

