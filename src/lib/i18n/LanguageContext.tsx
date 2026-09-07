'use client';

// Canonical re-export from @/context/LanguageContext to guarantee a single unified system
export {
  LanguageProvider,
  useLanguage,
  languages,
} from '../../context/LanguageContext';

export type { LanguageOption } from '../i18n';
export type { Language as LanguageCode } from '../../types';
