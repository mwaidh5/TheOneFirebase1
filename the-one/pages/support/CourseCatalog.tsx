
import React from 'react';
import { COURSES, COACHES } from '../../constants';
import { useT } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';

const LEVEL_LABELS: Record<string, TranslationKey> = {
  Beginner: 'support.catalog.level_beginner',
  Intermediate: 'support.catalog.level_intermediate',
  Advanced: 'support.catalog.level_advanced',
  Elite: 'support.catalog.level_elite',
};

const SupportCourseCatalog: React.FC = () => {
  const { t } = useT();
  return (
    <div className="text-start space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="space-y-1">
        <h1 className="text-4xl font-black font-display uppercase text-black leading-none tracking-tight">{t('support.catalog.title')}</h1>
        <p className="text-neutral-400 font-medium">{t('support.catalog.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {COURSES.map(course => (
          <div key={course.id} className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col group">
            <div className="h-48 relative overflow-hidden shrink-0">
               <img src={course.image} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="" />
               <div className="absolute top-4 start-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[8px] font-black uppercase tracking-widest">{course.category}</div>
            </div>
            <div className="p-8 flex flex-col flex-grow space-y-6">
               <div className="space-y-2">
                  <h3 className="text-xl font-black text-black uppercase tracking-tight leading-tight">{course.title}</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t('support.catalog.lead_coach')}</span>
                     <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{course.instructor}</span>
                  </div>
               </div>

               <p className="text-xs text-neutral-500 font-medium leading-relaxed italic border-s-2 border-neutral-100 ps-4">"{course.description}"</p>

               <div className="grid grid-cols-2 gap-4 py-4 border-t border-neutral-50">
                  <div>
                    <p className="text-[8px] font-black text-neutral-300 uppercase mb-1">{t('support.catalog.duration')}</p>
                    <p className="text-sm font-black text-black">{course.duration}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-neutral-300 uppercase mb-1">{t('support.catalog.price')}</p>
                    <p dir="ltr" className="text-sm font-black text-accent text-start">${course.price}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-neutral-300 uppercase mb-1">{t('support.catalog.enrollment')}</p>
                    <p className="text-sm font-black text-black">{course.enrollmentCount}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-neutral-300 uppercase mb-1">{t('support.catalog.skill_level')}</p>
                    <p className="text-sm font-black text-black">{LEVEL_LABELS[course.level] ? t(LEVEL_LABELS[course.level]) : course.level}</p>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupportCourseCatalog;
