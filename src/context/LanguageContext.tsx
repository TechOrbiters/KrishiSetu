import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language } from '../types';
import { TRANSLATIONS, TranslationKey, SUPPORTED_LANGUAGES, LanguageOption, getTranslation } from '../lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  currentLanguageObj: LanguageOption;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'kisansetu_app_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (saved && ['hi', 'en', 'bn', 'mr', 'ta', 'te'].includes(saved)) {
        return saved;
      }
    } catch {
      // localStorage may not be available in strict sandboxes
    }
    return 'hi';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // ignore
    }
  }, [language]);

  const currentLanguageObj = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const t = (key: TranslationKey): string => {
    return getTranslation(language, key);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentLanguageObj,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if used outside provider
    const fallbackLang: Language = 'hi';
    return {
      language: fallbackLang,
      setLanguage: () => {},
      t: (key: TranslationKey) => getTranslation(fallbackLang, key),
      currentLanguageObj: SUPPORTED_LANGUAGES[0],
      languages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
};
