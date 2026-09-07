'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import { Language } from '../../types';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'light' | 'dark' | 'pill';
  showLabel?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'light',
  showLabel = true,
}) => {
  const { language, setLanguage, languages, currentLanguageObj, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getButtonStyles = () => {
    switch (variant) {
      case 'pill':
        return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-full px-3 py-1 text-xs font-bold';
      case 'dark':
        return 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold';
      case 'light':
      default:
        return 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3.5 py-1.5 sm:py-2 text-sm font-semibold shadow-xs';
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef} data-no-translate="true">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 transition-all cursor-pointer select-none ${getButtonStyles()}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="भाषा बदलें / Change Language"
      >
        <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="truncate">
          {showLabel ? `${t('languageLabel')}: ` : ''}
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {currentLanguageObj.nativeName}
          </span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="language-dropdown-menu absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {languages.map((l) => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium">{l.nativeName}</span>
                <span className="text-xs text-slate-400">{l.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
