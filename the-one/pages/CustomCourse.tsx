
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User, CustomDiscipline } from '../types';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import { sportLabel } from './Courses';

interface CustomCourseProps {
  currentUser: User | null;
}

const CustomCourse: React.FC<CustomCourseProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const { t, lang } = useT();
  const [sports, setSports] = useState<CustomDiscipline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchSports = async () => {
          try {
              const snap = await getDocs(collection(db, 'custom_disciplines'));
              const data = snap.docs.map(d => d.data() as CustomDiscipline);
              setSports(data);
          } catch (e) {
              console.error("Error fetching sports", e);
          } finally {
              setLoading(false);
          }
      };
      fetchSports();
  }, []);

  const handleSelect = (id: string) => {
    navigate(`/checkout?courseId=custom-${id}`);
  };

  const handleContactSupport = () => {
    if (currentUser) {
        navigate('/profile/messages?coachId=support');
    } else {
        navigate('/login?redirect=/profile/messages?coachId=support');
    }
  };

  const getDesc = (id: string) => {
      const map: Record<string, TranslationKey> = {
          'crossfit': 'custom.desc_crossfit',
          'muaythai': 'custom.desc_muaythai',
          'bodybuilding': 'custom.desc_bodybuilding',
          'strength': 'custom.desc_strength',
          'powerlifting': 'custom.desc_powerlifting',
          'general': 'custom.desc_general',
          'weightlifting': 'custom.desc_weightlifting',
          'hyrox': 'custom.desc_hyrox',
          'running': 'custom.desc_running',
      };
      const key = map[id] || 'custom.desc_default';
      return t(key);
  };

  // Arabic name for known disciplines (by id); otherwise the admin-entered name.
  const sportName = (sport: CustomDiscipline) => {
      const label = sportLabel(t, lang, sport.id);
      return label !== sport.id ? label : sport.name;
  };

  return (
    <div className="flex-grow bg-white flex flex-col items-center justify-center p-6 text-start animate-in fade-in duration-700">
      <div className="w-full max-w-6xl space-y-12 py-12">
        <div className="space-y-6 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black font-display uppercase tracking-tight text-black leading-none">{t('custom.heading')}</h1>
          <p className="text-neutral-500 font-medium text-lg leading-relaxed">
            {t('custom.desc')}
          </p>
        </div>

        {loading ? (
             <div className="flex justify-center py-20">
                 <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : sports.length === 0 ? (
             <div className="text-center py-20 bg-neutral-50 rounded-[3rem]">
                 <p className="text-neutral-400 font-black uppercase tracking-widest rtl:tracking-normal text-xs">{t('custom.none_available')}</p>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sports.map((sport) => (
                <button
                key={sport.id}
                onClick={() => handleSelect(sport.id)}
                className="group p-8 rounded-[2.5rem] border border-neutral-100 bg-neutral-50 hover:bg-black hover:border-black transition text-start flex flex-col justify-between h-full shadow-sm hover:shadow-2xl hover:-translate-y-1"
                >
                <div className="space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:bg-neutral-800 transition-colors">
                    <span className="material-symbols-outlined text-3xl text-black group-hover:text-white transition-colors">{sport.icon || 'fitness_center'}</span>
                    </div>
                    <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black font-display uppercase tracking-tight text-black group-hover:text-white transition-colors">{sportName(sport)}</h3>
                        <span dir="ltr" className="text-xs font-black text-accent bg-accent/10 px-2 py-1 rounded group-hover:bg-accent group-hover:text-white transition-colors">${sport.price}</span>
                    </div>
                    <p className="text-sm font-medium text-neutral-500 group-hover:text-neutral-400 transition-colors leading-relaxed">
                        {getDesc(sport.id)}
                    </p>
                    </div>
                </div>
                
                <div className="pt-8 mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest rtl:tracking-normal text-accent group-hover:text-white transition-colors">
                    <span>{t('custom.select_program')}</span>
                    <span className="material-symbols-outlined text-sm rtl:-scale-x-100 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">arrow_forward</span>
                </div>
                </button>
            ))}
            </div>
        )}

        <div className="bg-neutral-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden text-center shadow-2xl">
           <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tight">{t('custom.how_it_works')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-start">
                 <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-black text-white mb-2">1</div>
                    <p className="font-bold uppercase text-sm">{t('custom.step1_title')}</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">{t('custom.step1_desc')}</p>
                 </div>
                 <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-black text-white mb-2">2</div>
                    <p className="font-bold uppercase text-sm">{t('custom.step2_title')}</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">{t('custom.step2_desc')}</p>
                 </div>
                 <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-black text-white mb-2">3</div>
                    <p className="font-bold uppercase text-sm">{t('custom.step3_title')}</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">{t('custom.step3_desc')}</p>
                 </div>
              </div>
              <button 
                onClick={handleContactSupport}
                className="mt-8 px-8 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest rtl:tracking-normal text-xs hover:bg-neutral-200 transition"
              >
                {t('custom.contact_support')}
              </button>
           </div>
           <span className="material-symbols-outlined text-[300px] absolute -bottom-32 -end-20 text-white/5 rotate-12 select-none">architecture</span>
        </div>
      </div>
    </div>
  );
};

export default CustomCourse;
