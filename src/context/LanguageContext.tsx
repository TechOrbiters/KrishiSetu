'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Language } from '../types';
import {
  SUPPORTED_LANGUAGES,
  LanguageOption,
  getTranslation,
  DOM_TRANSLATIONS,
} from '../lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  currentLanguageObj: LanguageOption;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEYS = ['krishisetu_language', 'kisansetu_app_language'];

/**
 * Universal client-side DOM Translation Engine
 * Translates UI text nodes across all portals in real-time.
 */
function applyDOMTranslation(targetLang: Language) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Build lookup mapping: any source phrase in any language -> target language text
  const phraseMap = new Map<string, string>();
  for (const entry of DOM_TRANSLATIONS) {
    const targetText = (entry as any)[targetLang] || entry.hi || entry.en;
    if (!targetText) continue;

    const sources = [entry.hi, entry.en, entry.mr, entry.te, entry.ta, entry.bn].filter(Boolean) as string[];
    for (const src of sources) {
      if (src && src !== targetText) {
        phraseMap.set(src.trim(), targetText.trim());
      }
    }
  }

  // Helper to translate single string
  const translateString = (str: string): string => {
    const trimmed = str.trim();
    if (!trimmed) return str;
    // Exact match check first
    if (phraseMap.has(trimmed)) {
      const match = phraseMap.get(trimmed)!;
      return str.replace(trimmed, match);
    }
    // Partial matches for phrases with arrows or icons (e.g. "प्रवेश करें →", "शेतमाल नोंदवा ⊕")
    phraseMap.forEach((target, src) => {
      if (str.includes(src)) {
        str = str.split(src).join(target);
      }
    });
    return str;
  };

  try {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (
            tag === 'script' ||
            tag === 'style' ||
            tag === 'noscript' ||
            tag === 'code' ||
            tag === 'pre' ||
            parent.closest('[data-no-translate]') ||
            parent.closest('.language-dropdown-menu')
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let currentNode: Node | null = walker.nextNode();
    while (currentNode) {
      const val = currentNode.nodeValue;
      if (val && val.trim().length > 0) {
        const translated = translateString(val);
        if (translated !== val) {
          currentNode.nodeValue = translated;
        }
      }
      currentNode = walker.nextNode();
    }

    // Also translate input/textarea placeholders
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]');
    inputs.forEach((el) => {
      const ph = el.getAttribute('placeholder');
      if (ph) {
        const translated = translateString(ph);
        if (translated !== ph) {
          el.setAttribute('placeholder', translated);
        }
      }
    });
  } catch (err) {
    // Non-fatal DOM traversal error
  }
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        for (const key of STORAGE_KEYS) {
          const saved = localStorage.getItem(key) as Language;
          if (saved && ['hi', 'en', 'mr', 'te', 'ta', 'bn'].includes(saved)) {
            return saved;
          }
        }
      } catch (_) {}
    }
    return 'hi';
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      try {
        for (const key of STORAGE_KEYS) {
          localStorage.setItem(key, newLang);
        }
        document.documentElement.lang = newLang;
        window.dispatchEvent(new CustomEvent('krishisetu:languagechange', { detail: newLang }));
      } catch (e) {
        console.warn('Could not persist language to localStorage:', e);
      }
    }
    // Instantly apply DOM auto-translation
    requestAnimationFrame(() => applyDOMTranslation(newLang));
  }, []);

  // Sync with localStorage & other tabs/instances
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && STORAGE_KEYS.includes(e.key) && e.newValue) {
        const lang = e.newValue as Language;
        if (['hi', 'en', 'mr', 'te', 'ta', 'bn'].includes(lang)) {
          setLanguageState(lang);
          requestAnimationFrame(() => applyDOMTranslation(lang));
        }
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail && customEvent.detail !== language) {
        setLanguageState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('krishisetu:languagechange', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('krishisetu:languagechange', handleCustomChange);
    };
  }, [language]);

  // Apply DOM translation on mount and language change
  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (_) {}
    
    applyDOMTranslation(language);

    // Watch for dynamic DOM changes (tab switching, modals, new data)
    let timer: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        applyDOMTranslation(language);
      }, 80);
    });

    if (typeof document !== 'undefined' && document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [language]);

  const currentLanguageObj = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const t = useCallback(
    (key: string): string => {
      return getTranslation(language, key);
    },
    [language]
  );

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
    const fallbackLang: Language = 'hi';
    return {
      language: fallbackLang,
      setLanguage: () => {},
      t: (key: string) => getTranslation(fallbackLang, key),
      currentLanguageObj: SUPPORTED_LANGUAGES[0],
      languages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
};

// Also export alias for backward compatibility
export const languages = SUPPORTED_LANGUAGES;
