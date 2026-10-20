
import React from 'react';
import { useT } from '../../i18n/I18nContext';

const CoachDashboard: React.FC = () => {
  const { t } = useT();
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black font-display tracking-tight text-black uppercase">{t('coach.dashboard.welcome')}</h2>
          <p className="text-neutral-400 font-medium">{t('coach.dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white border border-neutral-200 text-black font-bold text-sm rounded-xl hover:shadow-lg transition shadow-sm">{t('coach.dashboard.review_logs')}</button>
          <button className="px-6 py-3 bg-black text-white font-bold text-sm rounded-xl hover:bg-neutral-800 shadow-xl transition flex items-center gap-2 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[20px]">add</span>
            {t('coach.dashboard.build_program')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm hover:shadow-lg transition">
           <div className="flex items-center justify-between mb-4">
              <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">{t('coach.dashboard.active_athletes')}</p>
              <span className="material-symbols-outlined text-accent">person</span>
           </div>
           <p className="text-4xl font-black text-black">0</p>
           <p className="text-neutral-400 text-xs font-bold mt-2">{t('coach.dashboard.this_week')}</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm hover:shadow-lg transition">
           <div className="flex items-center justify-between mb-4">
              <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">{t('coach.dashboard.completed_sessions')}</p>
              <span className="material-symbols-outlined text-purple-600">done_all</span>
           </div>
           <p className="text-4xl font-black text-black">0</p>
           <p className="text-neutral-400 text-xs font-bold mt-2">{t('coach.dashboard.past_30_days')}</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm hover:shadow-lg transition">
           <div className="flex items-center justify-between mb-4">
              <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">{t('coach.dashboard.course_rating')}</p>
              <span className="material-symbols-outlined text-yellow-500 filled">star</span>
           </div>
           <p className="text-4xl font-black text-black">--</p>
           <p className="text-neutral-400 text-xs font-bold mt-2">{t('coach.dashboard.no_reviews')}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm">
         <h3 className="text-xl font-bold font-display uppercase tracking-tight mb-8">{t('coach.dashboard.recent_logs')}</h3>
         <div className="space-y-6">
            <p className="text-center text-xs text-neutral-400 py-10 font-bold uppercase tracking-widest">{t('coach.dashboard.no_logs')}</p>
         </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
