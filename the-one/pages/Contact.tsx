
import React from 'react';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

const Contact: React.FC = () => {
  const { t } = useT();
  const features: Array<{ icon: string; labelKey: TranslationKey; textKey: TranslationKey }> = [
    { icon: 'laptop_mac', labelKey: 'contact.remote_coaching', textKey: 'contact.remote_coaching_desc' },
    { icon: 'groups', labelKey: 'contact.national_impact', textKey: 'contact.national_impact_desc' },
    { icon: 'fitness_center', labelKey: 'contact.sport_specific', textKey: 'contact.sport_specific_desc' },
  ];
  return (
    <div className="w-full bg-white">
      <section className="relative pt-24 pb-16 border-b border-neutral-100 max-w-7xl mx-auto px-6">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-6xl md:text-8xl font-black font-display tracking-tighter text-black uppercase leading-none">
            {t('contact.about_us')}
          </h1>
          <p className="text-xl md:text-2xl text-neutral-500 max-w-2xl leading-relaxed font-medium">
            {t('contact.hero_desc')}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-7 space-y-12">
          <h2 className="text-3xl font-black font-display uppercase tracking-tight text-black">{t('contact.our_mission')}</h2>
          <div className="space-y-6 text-lg text-neutral-600 font-medium leading-relaxed">
            <p>
              {t('contact.mission_p1')}
            </p>
            <p>
              {t('contact.mission_p2')}
            </p>
            <p>
              {t('contact.mission_p3_part1')} <span className="font-black text-black">{t('contact.iraqi_teams')}</span>{t('contact.mission_p3_part2')}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-10">
            {features.map(item => (
              <div key={item.labelKey} className="flex gap-6 items-start">
                <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-neutral-100">
                  <span className="material-symbols-outlined text-black">{item.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-black text-lg font-display uppercase tracking-tight">{t(item.labelKey)}</h3>
                  <p className="mt-1 text-neutral-500 font-medium leading-relaxed">{t(item.textKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <span className="material-symbols-outlined text-6xl text-neutral-300">verified</span>
          <h2 className="text-4xl font-black font-display uppercase tracking-tight max-w-2xl mx-auto">
            {t('contact.quote')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
             <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-neutral-100">
                <p className="text-4xl font-black text-black mb-2">100%</p>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{t('contact.online_focus')}</p>
             </div>
             <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-neutral-100">
                <p className="text-4xl font-black text-black mb-2">500+</p>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{t('contact.athletes_guided')}</p>
             </div>
             <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-neutral-100">
                <p className="text-4xl font-black text-black mb-2">{t('contact.elite_label')}</p>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{t('contact.elite_methods')}</p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
