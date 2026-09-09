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
 * Maps preserving the original base text of DOM text nodes & input placeholders.
 * Using WeakMap ensures zero memory leaks when React unmounts or replaces elements.
 */
const baseTextMap = new WeakMap<Node, string>();
const basePlaceholderMap = new WeakMap<Element, string>();

interface CompiledLanguageEngine {
  phraseMap: Map<string, string>;
  regex: RegExp | null;
}

// Cached compiled regex engines per target language for instantaneous single-pass translations
const engineCache = new Map<Language, CompiledLanguageEngine>();

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getEngineForLanguage(targetLang: Language): CompiledLanguageEngine {
  if (engineCache.has(targetLang)) {
    return engineCache.get(targetLang)!;
  }

  const phraseMap = new Map<string, string>();
  for (const entry of DOM_TRANSLATIONS) {
    const target = (entry as any)[targetLang] || entry.hi || entry.en;
    if (!target) continue;

    // Only translate from application base text (Hindi and English)
    const sources = [entry.hi, entry.en].filter(Boolean) as string[];
    for (const src of sources) {
      const trimmedSrc = src.trim();
      const trimmedTarget = target.trim();
      if (trimmedSrc && trimmedSrc !== trimmedTarget) {
        phraseMap.set(trimmedSrc, trimmedTarget);
      }
    }
  }

  // Sort keys by length DESCENDING so longer compound phrases match before subphrases
  const sortedKeys = Array.from(phraseMap.keys()).sort((a, b) => b.length - a.length);
  const regex = sortedKeys.length > 0 ? new RegExp(sortedKeys.map(escapeRegex).join('|'), 'g') : null;

  const engine: CompiledLanguageEngine = { phraseMap, regex };
  engineCache.set(targetLang, engine);
  return engine;
}

/**
 * Universal client-side DOM Translation Engine
 * Translates UI text nodes across all portals in real-time,
 * and cleanly restores original base text when switching back to Hindi ('hi').
 */
function applyDOMTranslation(targetLang: Language) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const isHindi = targetLang === 'hi';
  const engine = isHindi ? null : getEngineForLanguage(targetLang);

  // Helper to translate single string from its base form in a single regex pass
  const translateString = (str: string): string => {
    if (!engine || !engine.regex) return str;
    const trimmed = str.trim();
    if (!trimmed) return str;

    // 1. Exact match check first for instantaneous 1-to-1 lookup
    if (engine.phraseMap.has(trimmed)) {
      const match = engine.phraseMap.get(trimmed)!;
      return str === trimmed ? match : str.replace(trimmed, match);
    }

    // 2. Single-pass regex replacement:
    // Guarantees each matched token is replaced once and the regex pointer advances past it,
    // making cascading replacements, runaway character duplication, or broken Indic conjuncts impossible!
    return str.replace(engine.regex, (matched) => {
      return engine.phraseMap.get(matched) || matched;
    });
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
            parent.closest('.language-dropdown-menu') ||
            parent.closest('.language-selector') ||
            parent.closest('.notranslate')
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          const val = node.nodeValue;
          if (!val || val.trim().length === 0) {
            return NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let currentNode: Node | null = walker.nextNode();
    while (currentNode) {
      try {
        if (isHindi) {
          // Switching back to Hindi: restore original base text
          if (baseTextMap.has(currentNode)) {
            const original = baseTextMap.get(currentNode)!;
            if (currentNode.nodeValue !== original) {
              currentNode.nodeValue = original;
            }
          }
        } else {
          // Target language is non-Hindi: save original base text if not already saved
          if (!baseTextMap.has(currentNode)) {
            baseTextMap.set(currentNode, currentNode.nodeValue || '');
          }
          const original = baseTextMap.get(currentNode) || currentNode.nodeValue || '';
          if (original.trim().length > 0) {
            const translated = translateString(original);
            if (translated !== currentNode.nodeValue) {
              currentNode.nodeValue = translated;
            }
          }
        }
      } catch (_) {
        // Guard against any detached DOM node errors
      }
      currentNode = walker.nextNode();
    }

    // Also translate input and textarea placeholders
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]');
    inputs.forEach((el) => {
      try {
        if (isHindi) {
          const original = basePlaceholderMap.get(el) || el.dataset.origPlaceholder;
          if (original && el.getAttribute('placeholder') !== original) {
            el.setAttribute('placeholder', original);
          }
        } else {
          if (!basePlaceholderMap.has(el)) {
            const currentPh = el.getAttribute('placeholder') || '';
            basePlaceholderMap.set(el, currentPh);
            el.dataset.origPlaceholder = currentPh;
          }
          const original = basePlaceholderMap.get(el) || el.dataset.origPlaceholder || '';
          if (original) {
            const translated = translateString(original);
            if (el.getAttribute('placeholder') !== translated) {
              el.setAttribute('placeholder', translated);
            }
          }
        }
      } catch (_) {}
    });
  } catch (err) {
    // Non-fatal DOM traversal guard
  }
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always initialize to 'hi' (base language) so SSR static export and client initial render match 100%
  const [language, setLanguageState] = useState<Language>('hi');

  // Load language preference from localStorage only after initial client mount
  useEffect(() => {
    try {
      for (const key of STORAGE_KEYS) {
        const saved = localStorage.getItem(key) as Language;
        if (saved && ['hi', 'en', 'mr', 'te', 'ta', 'bn'].includes(saved)) {
          if (saved !== 'hi') {
            setLanguageState(saved);
          }
          break;
        }
      }
    } catch (_) {}
  }, []);

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
    // Safely trigger translation on next frame for instant responsiveness
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
        requestAnimationFrame(() => applyDOMTranslation(customEvent.detail));
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

    // Watch for dynamic DOM changes (e.g. modals opening, tab switches, dynamic orders)
    // NOTE: characterData MUST BE FALSE to prevent infinite loops when mutating text nodes!
    let timer: any = null;
    const observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        applyDOMTranslation(language);
      }, 200);
    });

    if (typeof document !== 'undefined' && document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false,
      });
    }

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
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
