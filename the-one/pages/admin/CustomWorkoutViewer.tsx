
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MOCK_CUSTOM_REQUESTS, COACHES } from '../../constants';
import { useT } from '../../i18n/I18nContext';

const AdminCustomWorkoutViewer: React.FC = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { t } = useT();
  
  const request = MOCK_CUSTOM_REQUESTS.find(r => r.id === requestId) || MOCK_CUSTOM_REQUESTS[0];
  const coach = COACHES.find(c => c.id === request.assignedCoachIds[0]) || COACHES[0];

  // Simulated logic data asbuilt by coach
  const [activeWeek, setActiveWeek] = useState(1);

  const mockProgram = [
    { day: 1, title: 'Olympic Transition', exercises: [
      { name: 'Clean High Pull', sets: 5, reps: '3', rest: '2m', note: 'Drive hard through heels.' },
      { name: 'Power Snatch', sets: 4, reps: '2', rest: '3m', note: 'Full extension required.' }
    ]},
    { day: 2, title: 'Engine Priming', exercises: [
      { name: 'Rowing Intervals', sets: 5, reps: '500m', rest: '90s', note: 'Maintain sub 1:45 pace.' }
    ]}
  ];

  return (
    <div className="space-y-12 text-start animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link to="/admin/custom-requests" className="flex items-center gap-2 text-neutral-400 hover:text-black text-xs font-black uppercase tracking-widest mb-2 transition-colors">
            <span className="material-symbols-outlined text-lg rtl:rotate-180">arrow_back</span> {t('builder.back_to_leads')}
          </Link>
          <div className="space-y-1">
             <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase leading-none">{t('builder.inspect_logic')}</h1>
                <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{t('builder.built_published')}</span>
             </div>
             <p className="text-neutral-400 font-medium">{t('builder.bespoke_for')} <span className="text-black font-bold">{request.athleteName}</span> {t('builder.by')} <span className="text-accent font-bold">{t('builder.coach_name', { name: coach.name.split(' ')[0] })}</span></p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <button onClick={() => navigate('/admin/messages?coachId=' + coach.id)} className="px-8 py-4 border border-neutral-100 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-neutral-50 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">chat</span>
              {t('coach.message')}
           </button>
           <button className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-red-500 transition shadow-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">warning</span>
              {t('builder.flag_revision')}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Navigation */}
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300">{t('builder.architecture_phases')}</h3>
              <div className="space-y-2">
                 {[1,2,3,4,5,6].map(w => (
                    <button 
                      key={w}
                      onClick={() => setActiveWeek(w)}
                      className={`w-full text-start px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition ${activeWeek === w ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-50'}`}
                    >
                      {t('builder.week_n', { n: w })}
                    </button>
                 ))}
              </div>
           </div>

           <div className="bg-neutral-900 rounded-[2.5rem] p-8 text-white space-y-4 overflow-hidden relative shadow-2xl">
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{t('builder.coach_narrative')}</p>
                 <p className="text-xs font-medium leading-relaxed italic text-neutral-300 mt-2">
                    {t('builder.viewer_narrative')}
                 </p>
              </div>
              <span className="material-symbols-outlined text-[100px] absolute -bottom-6 -end-6 text-white/5 select-none rotate-12">stylus</span>
           </div>
        </div>

        {/* Logic Viewer */}
        <div className="lg:col-span-9 space-y-10">
           <div className="bg-white rounded-[3.5rem] p-12 border border-neutral-100 shadow-2xl space-y-12">
              <div className="flex justify-between items-end border-b border-neutral-50 pb-8">
                 <h2 className="text-4xl font-black font-display uppercase tracking-tight text-black">{t('builder.week_programming', { n: activeWeek })}</h2>
                 <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">{t('builder.protocol', { v: 'V3.1.2' })}</p>
              </div>

              <div className="space-y-10">
                 {mockProgram.map((day) => (
                    <div key={day.day} className="space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center font-black shadow-lg shadow-accent/20">
                             {day.day}
                          </div>
                          <h3 className="text-2xl font-black uppercase text-black font-display">{day.title}</h3>
                       </div>

                       <div className="grid gap-4">
                          {day.exercises.map((ex, i) => (
                             <div key={i} className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-8 group hover:bg-white hover:border-black transition">
                                <div className="space-y-1">
                                   <p className="text-xl font-black text-black uppercase tracking-tight">{ex.name}</p>
                                   <p className="text-xs font-medium text-neutral-400 italic">"{ex.note}"</p>
                                </div>
                                <div className="flex gap-4">
                                   {[
                                      { l: t('workout.sets'), v: ex.sets },
                                      { l: t('workout.reps_short'), v: ex.reps },
                                      { l: t('workout.rest'), v: ex.rest }
                                   ].map(stat => (
                                      <div key={stat.l} className="bg-white px-6 py-3 rounded-2xl border border-neutral-100 min-w-[80px] text-center shadow-sm">
                                         <p className="text-[8px] font-black text-neutral-300 uppercase mb-1">{stat.l}</p>
                                         <p className="text-sm font-black text-black uppercase">{stat.v}</p>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomWorkoutViewer;
