
import React from 'react';
import { useT } from '../i18n/I18nContext';

const BillingHistory: React.FC = () => {
  const { t } = useT();
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black font-display uppercase tracking-tight text-black mb-12">{t('billing.title')}</h1>
      <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('billing.date')}</th>
              <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('billing.course')}</th>
              <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('billing.amount')}</th>
              <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('billing.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {[1, 2, 3].map(i => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                <td className="px-8 py-6 text-sm font-medium">May {i + 10}, 2024</td>
                <td className="px-8 py-6 text-sm font-bold text-black uppercase tracking-tight">Engine Builder 101</td>
                <td className="px-8 py-6 text-sm font-black">$149.00</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">{t('billing.paid')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingHistory;
