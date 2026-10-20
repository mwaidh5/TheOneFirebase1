
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CUSTOM_DISCIPLINES as DEFAULT_DISCIPLINES } from '../../constants';
import { CustomDiscipline, DiagnosticTest, User } from '../../types';
import { useT } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';

const INPUT_LABELS: Record<string, TranslationKey> = {
  TEXT: 'support.diag.input_text',
  VIDEO: 'support.diag.input_video',
  IMAGE: 'support.diag.input_image',
};

const SupportDiagnosticLogic: React.FC = () => {
  const { t } = useT();
  const [disciplines, setDisciplines] = useState<CustomDiscipline[]>([]);
  const [activeDiscipline, setActiveDiscipline] = useState<CustomDiscipline | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDisciplines = async () => {
        try {
            const snap = await getDocs(collection(db, 'custom_disciplines'));
            if (snap.empty) {
                // Try auto-seed
                try {
                    const batch = DEFAULT_DISCIPLINES.map(d => setDoc(doc(db, 'custom_disciplines', d.id), d));
                    await Promise.all(batch);
                    setDisciplines(DEFAULT_DISCIPLINES);
                } catch (seedErr) {
                    console.error("Auto-seed failed", seedErr);
                }
            } else {
                setDisciplines(snap.docs.map(d => d.data() as CustomDiscipline));
            }
        } catch (e) {
            console.error("Error fetching disciplines", e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchCoaches = async () => {
        try {
            const q = query(collection(db, 'users'), where('role', '==', 'Coach'));
            const snap = await getDocs(q);
            setCoaches(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
        } catch (e) { console.error(e); }
    };

    fetchDisciplines();
    fetchCoaches();
  }, []);

  const manualSeed = async () => {
      setIsLoading(true);
      try {
          const batch = DEFAULT_DISCIPLINES.map(d => setDoc(doc(db, 'custom_disciplines', d.id), d));
          await Promise.all(batch);
          setDisciplines(DEFAULT_DISCIPLINES);
          alert(t('support.diag.init_success'));
      } catch (e: any) {
          console.error(e);
          alert(t('support.diag.init_error', { msg: e.message }));
      } finally {
          setIsLoading(false);
      }
  };

  const handleCreateDiscipline = async () => {
      const name = prompt(t('support.diag.new_sport_prompt'));
      if (!name) return;
      const id = name.toLowerCase().replace(/\s+/g, '-');
      
      const newDisc: CustomDiscipline = {
          id,
          name,
          icon: 'fitness_center', // Default
          price: 199,
          assignedCoachId: '',
          diagnostics: []
      };
      
      try {
          await setDoc(doc(db, 'custom_disciplines', newDisc.id), newDisc);
          setDisciplines([...disciplines, newDisc]);
      } catch (e) {
          console.error(e);
          alert(t('support.diag.create_error'));
      }
  };

  const handleDeleteDiscipline = async (id: string) => {
      if (window.confirm(t('support.diag.confirm_delete'))) {
          try {
              await deleteDoc(doc(db, 'custom_disciplines', id));
              setDisciplines(disciplines.filter(d => d.id !== id));
          } catch (e) {
              alert(t('support.diag.delete_error'));
          }
      }
  };

  const handleSave = async () => {
      if (!activeDiscipline) return;
      try {
          await setDoc(doc(db, 'custom_disciplines', activeDiscipline.id), activeDiscipline);
          setDisciplines(prev => prev.map(d => d.id === activeDiscipline.id ? activeDiscipline : d));
          setIsEditing(false);
          setActiveDiscipline(null);
          alert(t('support.diag.saved'));
      } catch (e) {
          console.error(e);
          alert(t('support.diag.save_failed'));
      }
  };

  const addTest = () => {
      if (!activeDiscipline) return;
      const newTest: DiagnosticTest = {
          id: 'd-' + Math.random().toString(36).substr(2, 5),
          title: 'New Test',
          instruction: 'Instructions here...',
          inputType: 'TEXT',
          required: true
      };
      setActiveDiscipline({
          ...activeDiscipline,
          diagnostics: [...activeDiscipline.diagnostics, newTest]
      });
  };

  const updateTest = (idx: number, field: keyof DiagnosticTest, val: any) => {
      if (!activeDiscipline) return;
      const updated = [...activeDiscipline.diagnostics];
      updated[idx] = { ...updated[idx], [field]: val };
      setActiveDiscipline({ ...activeDiscipline, diagnostics: updated });
  };

  const removeTest = (idx: number) => {
      if (!activeDiscipline) return;
      const updated = [...activeDiscipline.diagnostics];
      updated.splice(idx, 1);
      setActiveDiscipline({ ...activeDiscipline, diagnostics: updated });
  };

  return (
    <div className="text-start space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
            <h1 className="text-4xl font-black font-display uppercase text-black leading-none tracking-tight">{t('support.diag.title')}</h1>
            <p className="text-neutral-400 font-medium">{t('support.diag.subtitle')}</p>
        </div>
        <div className="flex gap-4">
            {disciplines.length === 0 && (
                <button onClick={manualSeed} className="px-6 py-3 bg-neutral-100 text-neutral-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition">{t('support.diag.init_defaults')}</button>
            )}
            <button onClick={handleCreateDiscipline} className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition shadow-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> {t('support.diag.new_sport')}
            </button>
        </div>
      </div>

      {isLoading ? (
          <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
      ) : disciplines.length === 0 ? (
          <div className="text-center py-20 bg-neutral-50 rounded-[3rem]">
              <p className="text-neutral-400 font-black uppercase tracking-widest text-xs">{t('support.diag.no_sports')}</p>
          </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
           {disciplines.map(discipline => {
             const assignedCoach = coaches.find(c => c.id === discipline.assignedCoachId);
             return (
             <div key={discipline.id} className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm space-y-10 relative group">
                <div className="absolute top-10 end-10 flex gap-2">
                    <button 
                        onClick={() => handleDeleteDiscipline(discipline.id)}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition"
                        title={t('support.diag.delete_sport')}
                        aria-label={t('support.diag.delete_sport')}
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <button 
                        onClick={() => { setActiveDiscipline(discipline); setIsEditing(true); }}
                        className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition shadow-lg flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">edit_note</span> {t('support.diag.configure')}
                    </button>
                </div>

                <div className="flex items-center gap-5 border-b border-neutral-50 pb-8">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">{discipline.icon}</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-black uppercase tracking-tight">{t('support.diag.bespoke_name', { name: discipline.name })}</h2>
                        <div className="flex gap-4 mt-1">
                             <p className="text-xs font-black text-neutral-300 uppercase tracking-widest">
                                {assignedCoach ? t('support.diag.coach_name', { name: `${assignedCoach.firstName} ${assignedCoach.lastName}` }) : t('support.diag.no_coach')}
                            </p>
                            <p dir="ltr" className="text-xs font-black text-accent uppercase tracking-widest">
                                ${discipline.price}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-xs font-black uppercase text-black tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-600 text-[18px]">verified_user</span>
                      {t('support.diag.mandatory_assessments')}
                   </h3>
                   <div className="grid gap-4">
                      {discipline.diagnostics.map((test, i) => (
                        <div key={test.id} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-start gap-6">
                           <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-purple-600 shrink-0">
                              {i + 1}
                           </div>
                           <div className="flex-grow">
                              <div className="flex items-center gap-3 mb-1">
                                 <h4 className="text-sm font-black text-black uppercase tracking-tight">{test.title}</h4>
                                 <span className="px-2 py-0.5 bg-neutral-900 text-white text-[7px] font-black uppercase tracking-widest rounded">{INPUT_LABELS[test.inputType] ? t(INPUT_LABELS[test.inputType]) : test.inputType}</span>
                              </div>
                              <p className="text-xs text-neutral-500 font-medium leading-relaxed italic">"{test.instruction}"</p>
                           </div>
                        </div>
                      ))}
                      {discipline.diagnostics.length === 0 && (
                         <div className="p-8 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-200 text-neutral-300 text-[10px] font-black uppercase tracking-widest">
                            {t('support.diag.no_logic')}
                         </div>
                      )}
                   </div>
                </div>
             </div>
           );})}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-neutral-900 rounded-[2.5rem] p-10 text-white space-y-8 relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                 <h3 className="text-2xl font-black font-display uppercase tracking-tight">{t('support.diag.intake_process')}</h3>
                 <div className="space-y-6">
                    {[
                      { step: 1, title: t('support.diag.step1_title'), text: t('support.diag.step1_text') },
                      { step: 2, title: t('support.diag.step2_title'), text: t('support.diag.step2_text') },
                      { step: 3, title: t('support.diag.step3_title'), text: t('support.diag.step3_text') },
                      { step: 4, title: t('support.diag.step4_title'), text: t('support.diag.step4_text') }
                    ].map(s => (
                      <div key={s.step} className="flex gap-4 items-start">
                         <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">{s.step}</div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-purple-400">{s.title}</p>
                            <p className="text-xs text-neutral-400 font-medium leading-relaxed">{s.text}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              <span className="material-symbols-outlined text-[140px] absolute -bottom-10 -end-10 text-white/5 rotate-12 select-none">architecture</span>
           </div>
        </div>
      </div>
      )}

      {/* Edit Modal */}
      {isEditing && activeDiscipline && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                      <div className="space-y-1 text-start">
                          <h3 className="text-2xl font-black font-display uppercase text-black">{t('support.diag.edit_name', { name: activeDiscipline.name })}</h3>
                          <p className="text-[10px] font-black uppercase text-neutral-400">{t('support.diag.configure_intake')}</p>
                      </div>
                      <button onClick={() => { setIsEditing(false); setActiveDiscipline(null); }} aria-label={t('common.close')} className="w-12 h-12 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar text-start">
                      <div className="grid grid-cols-2 gap-6">
                          {/* Coach Assignment */}
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ms-1">{t('support.diag.head_coach')}</label>
                              <select 
                                value={activeDiscipline.assignedCoachId || ''}
                                onChange={(e) => setActiveDiscipline({...activeDiscipline, assignedCoachId: e.target.value})}
                                className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-4 font-bold text-sm outline-none focus:border-black appearance-none"
                              >
                                  <option value="">{t('support.diag.select_coach')}</option>
                                  {coaches.map(coach => (
                                      <option key={coach.id} value={coach.id}>{coach.firstName} {coach.lastName}</option>
                                  ))}
                              </select>
                          </div>
                          
                          {/* Price */}
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ms-1">{t('support.diag.price_usd')}</label>
                              <input 
                                type="number" 
                                value={activeDiscipline.price} 
                                onChange={(e) => setActiveDiscipline({...activeDiscipline, price: parseInt(e.target.value)})}
                                className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-4 font-bold text-sm outline-none focus:border-black"
                              />
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <h4 className="text-sm font-black uppercase text-black">{t('support.diag.questions')}</h4>
                              <button onClick={addTest} className="text-xs font-bold uppercase text-accent hover:underline">+ {t('support.diag.add_question')}</button>
                          </div>
                          {activeDiscipline.diagnostics.map((test, idx) => (
                              <div key={test.id} className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100 space-y-4">
                                  <div className="flex justify-between items-center">
                                      <span className="text-[9px] font-black uppercase text-neutral-300 tracking-widest">{t('support.diag.question_n', { n: idx + 1 })}</span>
                                      <button onClick={() => removeTest(idx)} aria-label={t('common.delete')} className="text-neutral-300 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button>
                                  </div>
                                  <div className="space-y-3">
                                      <input 
                                        type="text" 
                                        value={test.title} 
                                        onChange={(e) => updateTest(idx, 'title', e.target.value)} 
                                        placeholder={t('support.diag.question_title_placeholder')}
                                        className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-bold text-sm outline-none focus:border-black"
                                      />
                                      <textarea 
                                        rows={2}
                                        value={test.instruction} 
                                        onChange={(e) => updateTest(idx, 'instruction', e.target.value)} 
                                        placeholder={t('support.diag.instructions_placeholder')}
                                        className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-medium text-xs resize-none outline-none focus:border-black"
                                      />
                                      <div className="flex gap-4">
                                          <select 
                                            value={test.inputType} 
                                            onChange={(e) => updateTest(idx, 'inputType', e.target.value)}
                                            className="bg-white border border-neutral-100 rounded-xl p-3 text-xs font-bold uppercase outline-none"
                                          >
                                              <option value="TEXT">{t('support.diag.opt_text')}</option>
                                              <option value="VIDEO">{t('support.diag.opt_video')}</option>
                                              <option value="IMAGE">{t('support.diag.opt_image')}</option>
                                          </select>
                                          <div className="flex items-center gap-2">
                                              <input 
                                                type="checkbox" 
                                                checked={test.required} 
                                                onChange={(e) => updateTest(idx, 'required', e.target.checked)}
                                                className="w-5 h-5 rounded-md border-neutral-300 text-black focus:ring-black"
                                              />
                                              <span className="text-xs font-bold uppercase text-neutral-500">{t('common.required')}</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="p-8 border-t border-neutral-100 bg-neutral-50 flex gap-4">
                      <button onClick={() => { setIsEditing(false); setActiveDiscipline(null); }} className="flex-1 py-4 bg-white border border-neutral-200 rounded-xl font-black uppercase tracking-widest text-[10px]">{t('common.cancel')}</button>
                      <button onClick={handleSave} className="flex-[2] py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition shadow-xl">{t('support.diag.save_config')}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SupportDiagnosticLogic;
