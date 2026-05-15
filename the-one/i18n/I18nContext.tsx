import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, TranslationKey } from './translations';

export type Lang = 'en' | 'ar';

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
}

const STORAGE_KEY = 'theone_lang';

const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved === 'en' || saved === 'ar') return saved;
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('ar')) return 'ar';
  return 'en';
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  };

  const toggleLang = () => setLang(lang === 'en' ? 'ar' : 'en');

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = useMemo(() => {
    return (key: TranslationKey, vars?: Record<string, string | number>) => {
      const entry = translations[key];
      let value = entry ? entry[lang] || entry.en || key : key;
      if (vars) {
        for (const k of Object.keys(vars)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
        }
      }
      return value;
    };
  }, [lang]);

  const value: I18nContextValue = {
    lang,
    setLang,
    toggleLang,
    t,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    isRtl: lang === 'ar',
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useT = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside <I18nProvider>');
  return ctx;
};
