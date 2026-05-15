import React from 'react';
import { useT } from '../i18n/I18nContext';

interface Props {
  variant?: 'default' | 'compact' | 'pill';
  className?: string;
}

const LanguageToggle: React.FC<Props> = ({ variant = 'default', className = '' }) => {
  const { lang, toggleLang } = useT();

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleLang}
        aria-label="Toggle language"
        className={`w-9 h-9 rounded-lg border border-neutral-200 bg-white flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-neutral-700 hover:bg-black hover:text-white hover:border-black transition-all ${className}`}
      >
        {lang === 'en' ? 'ع' : 'EN'}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={toggleLang}
        aria-label="Toggle language"
        className={`px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-[10px] font-black uppercase tracking-widest text-neutral-700 hover:bg-black hover:text-white hover:border-black transition-all flex items-center gap-1 ${className}`}
      >
        <span className="material-symbols-outlined text-[14px]">language</span>
        {lang === 'en' ? 'عربي' : 'EN'}
      </button>
    );
  }

  return (
    <button
      onClick={toggleLang}
      aria-label="Toggle language"
      className={`px-3 py-2 rounded-lg border border-neutral-200 bg-white text-[10px] font-black uppercase tracking-widest text-neutral-700 hover:bg-black hover:text-white hover:border-black transition-all flex items-center gap-1.5 ${className}`}
    >
      <span className="material-symbols-outlined text-[14px]">language</span>
      <span>{lang === 'en' ? 'عربي' : 'English'}</span>
    </button>
  );
};

export default LanguageToggle;
