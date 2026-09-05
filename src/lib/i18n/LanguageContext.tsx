'use client';

import React, { createContext, useContext, useState } from 'react';

export type LanguageCode = 'hi' | 'en' | 'ta' | 'te' | 'mr';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  localName: string;
}

export const languages: LanguageOption[] = [
  { code: 'hi', label: 'Hindi', localName: 'हिंदी' },
  { code: 'en', label: 'English', localName: 'English' },
  { code: 'mr', label: 'Marathi', localName: 'मराठी' },
  { code: 'te', label: 'Telugu', localName: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', localName: 'தமிழ்' },
];

const translations: Record<string, Record<string, string>> = {
  hi: {
    'nav.dashboard': 'डैशबोर्ड',
    'nav.listings': 'मेरी उपज',
    'nav.orders': 'ऑर्डर',
    'nav.delivery': 'डिलीवरी स्थिति',
    'nav.payments': 'भुगतान',
    'nav.marketPrices': 'बाजार भाव',
    'nav.help': 'सहायता केंद्र',
    'nav.profile': 'मेरा प्रोफाइल',
    'nav.aiAssistant': 'कृषि AI सहायक',
    'nav.fpo': 'FPO प्रबंधन',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.listings': 'My Listings',
    'nav.orders': 'Orders',
    'nav.delivery': 'Delivery Status',
    'nav.payments': 'Payments',
    'nav.marketPrices': 'Market Prices',
    'nav.help': 'Help Center',
    'nav.profile': 'My Profile',
    'nav.aiAssistant': 'Krishi AI Assistant',
    'nav.fpo': 'FPO Management',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('hi');

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['hi']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'hi' as LanguageCode,
      setLanguage: () => {},
      t: (key: string) => translations['hi']?.[key] || key,
      languages,
    };
  }
  return context;
};
