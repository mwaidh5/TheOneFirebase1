
import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n/I18nContext';

interface FooterProps {
  logo?: string;
}

const Footer: React.FC<FooterProps> = ({ logo }) => {
  const { t } = useT();
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row justify-between gap-12">
        <div className="flex flex-col gap-6 lg:max-w-md">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[16px]">fitness_center</span>
              </div>
            )}
            <span className="text-base font-bold tracking-tight text-black font-display">The One Training</span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            {t('footer.tagline')}
          </p>
          <p className="text-gray-400 text-xs mt-4">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
        <div className="flex flex-wrap gap-12 lg:gap-24">
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-black">{t('footer.company')}</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-500">
              <li><Link to="/about" className="hover:text-black transition-colors">{t('footer.about')}</Link></li>
              <li><Link to="/coaches" className="hover:text-black transition-colors">{t('nav.coaches')}</Link></li>
              <li><Link to="/contact" className="hover:text-black transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-black">{t('footer.explore')}</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-500">
              <li><Link to="/courses" className="hover:text-black transition-colors">{t('nav.courses')}</Link></li>
              <li><Link to="/profile/nutrition" className="hover:text-black transition-colors">{t('nav.nutrition')}</Link></li>
              <li><Link to="/contact" className="hover:text-black transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
