import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';
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
        return 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold';
      case 'light':
      default:
        return 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium shadow-2xs';
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 transition-colors cursor-pointer ${getButtonStyles()}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="भाषा बदलें / Change Language"
      >
        <Globe className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>
          {showLabel ? `${t('languageLabel')}: ` : ''}
          <strong className="font-bold">{currentLanguageObj.nativeName}</strong>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            {t('languageLabel')} / Language
          </div>
          {languages.map((l: any) => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{l.nativeName}</span>
                  <span className="text-[10px] text-slate-400">({l.name})</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
