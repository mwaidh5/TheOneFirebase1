
import React from 'react';
import { useT } from '../i18n/I18nContext';

const BillingHistory: React.FC = () => {
  const { t } = useT();
  const rows = [1, 2, 3];
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-12">
      <h1 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tight text-black mb-6 md:mb-10">{t('billing.title')}</h1>

      <div className="space-y-3">
        {rows.map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-tight text-black truncate">Engine Builder 101</p>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">May {i + 10}, 2024</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-base font-black text-black">$149.00</p>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest rounded-full">{t('billing.paid')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillingHistory;
