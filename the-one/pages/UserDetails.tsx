
import React from 'react';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

const UserDetails: React.FC = () => {
  const { t } = useT();
  const stats: Array<{ labelKey: TranslationKey; val: string; unitKey?: TranslationKey; unitRaw?: string }> = [
    { labelKey: 'vitals.current_weight', val: '185', unitKey: 'vitals.lbs' },
    { labelKey: 'vitals.height', val: '6\'0"', unitRaw: '' },
    { labelKey: 'vitals.age', val: '29', unitKey: 'vitals.years' },
    { labelKey: 'vitals.body_fat', val: '14.5', unitRaw: '%' },
  ];
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="space-y-12">
        <div>
          <h1 className="text-4xl font-black font-display uppercase tracking-tight text-black mb-4">{t('vitals.heading')}</h1>
          <p className="text-neutral-500 font-medium">{t('vitals.sub')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stats.map(stat => (
            <div key={stat.labelKey} className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 space-y-4">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t(stat.labelKey)}</label>
              <div className="flex items-baseline gap-2">
                <input type="text" defaultValue={stat.val} className="bg-transparent text-3xl font-black text-black border-b border-neutral-200 focus:border-black outline-none w-24" />
                <span className="text-neutral-400 font-bold uppercase text-xs">{stat.unitKey ? t(stat.unitKey) : stat.unitRaw}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-black text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl font-bold font-display uppercase">{t('vitals.personal_records')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">{t('vitals.back_squat')}</p>
                <p className="text-2xl font-black">315 {t('vitals.lbs')}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">{t('vitals.clean_jerk')}</p>
                <p className="text-2xl font-black">245 {t('vitals.lbs')}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">{t('vitals.fran_time')}</p>
                <p className="text-2xl font-black">3:42</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <span className="material-symbols-outlined text-[160px]">fitness_center</span>
          </div>
        </div>

        <button className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-neutral-800 transition-all">
          {t('vitals.save')}
        </button>
      </div>
    </div>
  );
};

export default UserDetails;
