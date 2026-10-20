
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { CustomCourseRequest, User } from '../../types';
import { useT } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';

const STATUS_LABELS: Record<string, TranslationKey> = {
  PENDING_PAYMENT: 'status.pending_payment',
  DIAGNOSTIC: 'status.diagnostic',
  BUILDING: 'status.building',
  COMPLETED: 'status.completed',
};

interface Athlete {
  id: string;
  name: string;
  email: string;
  phone: string;
  progress: number;
  level: string;
  status: string;
  lastSeen: string;
  createdAt?: string;
  isCustomClient?: boolean;
  vitals: { weight: string; height: string; age: number | string };
  recentPrs: { lift: string; weight: string; date: string }[];
}

interface CoachAthletesProps {
  currentUser: User;
}

const CoachAthletes: React.FC<CoachAthletesProps> = ({ currentUser }) => {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch Custom Course Requests assigned to this coach
    const q = query(
      collection(db, 'custom_requests'),
      where('assignedCoachIds', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAthletes: Athlete[] = snapshot.docs.map(doc => {
        const data = doc.data() as CustomCourseRequest;
        return {
          id: data.athleteId || doc.id, // Use athleteId if available, else doc id
          name: data.athleteName,
          email: 'Locked', // Privacy
          phone: data.phone,
          progress: data.status === 'COMPLETED' ? 100 : data.status === 'BUILDING' ? 10 : 0,
          level: data.sport ? data.sport.toUpperCase() : 'General',
          status: data.status,
          lastSeen: new Date(data.createdAt).toLocaleDateString(),
          createdAt: data.createdAt,
          isCustomClient: true,
          vitals: { 
            weight: `${data.biometrics.weight}kg`, 
            height: `${data.biometrics.height}cm`, 
            age: data.biometrics.age 
          },
          recentPrs: [] // Would need to fetch separately
        };
      });
      
      setAthletes(fetchedAthletes);
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to fetch athletes (likely permission denied due to impersonation rules):", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  const statusLabel = (s: string) => (STATUS_LABELS[s] ? t(STATUS_LABELS[s]) : s);
  const levelLabel = (l: string) => (l === 'General' ? t('coach.athletes.general') : l);
  const formatSince = (a: Athlete) => (a.createdAt ? new Date(a.createdAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB') : a.lastSeen);

  const handleMessageAthlete = (e: React.MouseEvent, athleteId: string) => {
    e.stopPropagation();
    navigate(`/coach/messages?athleteId=${athleteId}`);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 text-start">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">{t('coach.athletes.title')}</h1>
          <p className="text-neutral-400 font-medium">{t('coach.athletes.subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input type="text" placeholder={t('coach.athletes.search_placeholder')} className="bg-white border border-neutral-100 rounded-2xl ps-12 pe-6 py-4 text-sm focus:border-black outline-none w-64 shadow-sm transition" />
          </div>
          <button className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-neutral-800 transition shadow-xl">
            {t('coach.athletes.assign_program')}
          </button>
        </div>
      </div>

      {isLoading ? (
         <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-400 font-black uppercase tracking-widest text-xs">{t('coach.athletes.loading')}</p>
         </div>
      ) : athletes.length === 0 ? (
         <div className="py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-neutral-100">groups</span>
            <p className="text-neutral-300 font-black uppercase tracking-[0.2em]">{t('coach.athletes.empty')}</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {athletes.map((athlete, i) => (
            <div 
              key={athlete.id} 
              onClick={() => setSelectedAthlete(athlete)}
              className={`bg-white rounded-[2.5rem] p-8 border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition cursor-pointer group relative overflow-hidden ${athlete.isCustomClient ? 'border-accent/30 ring-1 ring-accent/5' : 'border-neutral-100'}`}
            >
              {athlete.isCustomClient && (
                <div className="absolute top-0 end-0 p-4">
                  <span className="px-3 py-1 bg-accent text-white text-[8px] font-black uppercase tracking-widest rounded-es-xl rounded-se-xl">{t('coach.athletes.bespoke_client')}</span>
                </div>
              )}
              
              <div className="flex items-center gap-6 mb-8">
                <div className={`w-16 h-16 rounded-full overflow-hidden border-4 shadow-md ${athlete.isCustomClient ? 'border-accent/20' : 'border-neutral-50'}`}>
                  <img src={`https://picsum.photos/100/100?random=${i+50}`} alt={t('coach.athletes.avatar_alt')} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-black uppercase tracking-tight group-hover:text-accent transition-colors">{athlete.name}</h3>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('coach.athletes.specialty', { level: levelLabel(athlete.level) })}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-neutral-300">{t('coach.athletes.phase_progress')}</span>
                    <span className="text-black" dir="ltr">{athlete.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-50 rounded-full overflow-hidden border border-neutral-100">
                    <div className={`h-full rounded-full transition-[width] duration-1000 ${athlete.isCustomClient ? 'bg-accent' : 'bg-black'}`} style={{ width: `${athlete.progress}%` }}></div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-neutral-50">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">{t('coach.courses.status')}</p>
                      <p className={`text-xs font-bold uppercase ${athlete.status === 'At Risk' ? 'text-red-500' : 'text-green-600'}`}>{statusLabel(athlete.status)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">{t('coach.athletes.since')}</p>
                      <p className="text-xs font-bold text-black uppercase tracking-tight">{formatSince(athlete)}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleMessageAthlete(e, athlete.id)}
                    aria-label={t('coach.athletes.message')}
                    title={t('coach.athletes.message')}
                    className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-400 hover:bg-black hover:text-white transition flex items-center justify-center group/msg shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px] filled">chat</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Athlete Detail Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedAthlete(null)}
              aria-label={t('common.close')}
              className="absolute top-8 end-8 w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-black hover:text-white transition z-20 shadow-sm"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="p-12 overflow-y-auto no-scrollbar">
              <div className="flex items-center gap-8 mb-12">
                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-neutral-50 shadow-xl">
                  <img src={`https://picsum.photos/150/150?u=${selectedAthlete.id}`} alt={t('coach.athletes.avatar_alt')} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <span className={`px-3 py-1 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg ${selectedAthlete.isCustomClient ? 'bg-accent' : 'bg-black'}`}>
                    {selectedAthlete.isCustomClient ? t('coach.athletes.custom_athlete') : levelLabel(selectedAthlete.level)}
                  </span>
                  <h2 className="text-4xl font-black font-display uppercase tracking-tight text-black">{selectedAthlete.name}</h2>
                  <div className="flex gap-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    <span dir="ltr">{selectedAthlete.phone}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-12">
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">{t('coach.athletes.weight')}</p>
                  <p className="text-xl font-black text-black uppercase" dir="ltr">{selectedAthlete.vitals.weight}</p>
                </div>
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">{t('coach.athletes.height')}</p>
                  <p className="text-xl font-black text-black uppercase" dir="ltr">{selectedAthlete.vitals.height}</p>
                </div>
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">{t('coach.athletes.age')}</p>
                  <p className="text-xl font-black text-black uppercase">{selectedAthlete.vitals.age}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className={`text-lg font-black uppercase tracking-tight mb-6 border-s-4 ps-4 ${selectedAthlete.isCustomClient ? 'border-accent' : 'border-black'}`}>
                    {selectedAthlete.isCustomClient ? t('coach.athletes.bespoke_intent') : t('coach.athletes.recent_records')}
                  </h3>
                  {selectedAthlete.isCustomClient ? (
                    <div className="p-8 bg-neutral-50 rounded-[2.5rem] italic text-neutral-500 text-sm leading-relaxed border border-neutral-100">
                      {t('coach.athletes.personalized_note', { level: levelLabel(selectedAthlete.level) })}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {selectedAthlete.recentPrs.map((pr, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white border border-neutral-100 rounded-2xl shadow-sm">
                          <div>
                            <p className="text-sm font-black text-black uppercase tracking-tight">{pr.lift}</p>
                            <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest mt-1">{t('coach.athletes.logged_on', { date: pr.date })}</p>
                          </div>
                          <p className="text-xl font-black text-accent" dir="ltr">{pr.weight}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-neutral-100 flex gap-4">
                  <button 
                    onClick={(e) => {
                      handleMessageAthlete(e, selectedAthlete.id);
                      setSelectedAthlete(null);
                    }}
                    className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition shadow-xl flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined filled">chat</span>
                    {t('coach.athletes.open_chat')}
                  </button>
                  <button className="flex-1 py-5 border border-neutral-100 text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-50 transition flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined">assignment_ind</span>
                    {t('coach.athletes.audit_history')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachAthletes;
