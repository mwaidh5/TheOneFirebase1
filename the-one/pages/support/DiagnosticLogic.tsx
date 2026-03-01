
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CUSTOM_DISCIPLINES as DEFAULT_DISCIPLINES } from '../../constants';
import { CustomDiscipline, DiagnosticTest } from '../../types';

const SupportDiagnosticLogic: React.FC = () => {
  const [disciplines, setDisciplines] = useState<CustomDiscipline[]>([]);
  const [activeDiscipline, setActiveDiscipline] = useState<CustomDiscipline | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchDisciplines = async () => {
        try {
            const snap = await getDocs(collection(db, 'custom_disciplines'));
            if (snap.empty) {
                // Seed with defaults
                const batch = DEFAULT_DISCIPLINES.map(d => setDoc(doc(db, 'custom_disciplines', d.id), d));
                await Promise.all(batch);
                setDisciplines(DEFAULT_DISCIPLINES);
            } else {
                setDisciplines(snap.docs.map(d => d.data() as CustomDiscipline));
            }
        } catch (e) {
            console.error("Error fetching disciplines", e);
        }
    };
    fetchDisciplines();
  }, []);

  const handleSave = async () => {
      if (!activeDiscipline) return;
      try {
          await setDoc(doc(db, 'custom_disciplines', activeDiscipline.id), activeDiscipline);
          setDisciplines(prev => prev.map(d => d.id === activeDiscipline.id ? activeDiscipline : d));
          setIsEditing(false);
          setActiveDiscipline(null);
          alert("Configuration Saved");
      } catch (e) {
          console.error(e);
          alert("Failed to save");
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
    <div className="text-left space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="space-y-1">
        <h1 className="text-4xl font-black font-display uppercase text-black leading-none tracking-tight">Diagnostic Logic</h1>
        <p className="text-neutral-400 font-medium">Configure the intake requirements for bespoke programming tracks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
           {disciplines.map(discipline => (
             <div key={discipline.id} className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm space-y-10 relative">
                <button 
                    onClick={() => { setActiveDiscipline(discipline); setIsEditing(true); }}
                    className="absolute top-10 right-10 p-3 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-black hover:text-white transition-all"
                >
                    <span className="material-symbols-outlined">edit</span>
                </button>

                <div className="flex items-center gap-5 border-b border-neutral-50 pb-8">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">{discipline.icon}</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-black uppercase tracking-tight">{discipline.name} Bespoke</h2>
                        <p className="text-xs font-black text-neutral-300 uppercase tracking-widest mt-1">${discipline.price} / Entry</p>
                    </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-xs font-black uppercase text-black tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-600 text-[18px]">verified_user</span>
                      Mandatory Athlete Assessments
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
                                 <span className="px-2 py-0.5 bg-neutral-900 text-white text-[7px] font-black uppercase tracking-widest rounded">{test.inputType}</span>
                              </div>
                              <p className="text-xs text-neutral-500 font-medium leading-relaxed italic">"{test.instruction}"</p>
                           </div>
                        </div>
                      ))}
                      {discipline.diagnostics.length === 0 && (
                         <div className="p-8 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-200 text-neutral-300 text-[10px] font-black uppercase tracking-widest">
                            No logic defined for this modality yet.
                         </div>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-neutral-900 rounded-[2.5rem] p-10 text-white space-y-8 relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                 <h3 className="text-2xl font-black font-display uppercase tracking-tight">The Intake Process</h3>
                 <div className="space-y-6">
                    {[
                      { step: 1, title: 'Authorization', text: 'Athlete completes SindiPay checkout.' },
                      { step: 2, title: 'Capture', text: 'Athlete answers diagnostics and uploads videos.' },
                      { step: 3, title: 'Synthesis', text: 'Coach Mercer reviews and architects the cycle.' },
                      { step: 4, title: 'Live', text: 'Workout is pushed to Athlete HQ.' }
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
              <span className="material-symbols-outlined text-[140px] absolute -bottom-10 -right-10 text-white/5 rotate-12 select-none">architecture</span>
           </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && activeDiscipline && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                      <div className="space-y-1 text-left">
                          <h3 className="text-2xl font-black font-display uppercase text-black">Edit {activeDiscipline.name}</h3>
                          <p className="text-[10px] font-black uppercase text-neutral-400">Configure Intake Logic</p>
                      </div>
                      <button onClick={() => { setIsEditing(false); setActiveDiscipline(null); }} className="w-12 h-12 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar text-left">
                      {activeDiscipline.diagnostics.map((test, idx) => (
                          <div key={test.id} className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100 space-y-4">
                              <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase text-neutral-300 tracking-widest">Question {idx + 1}</span>
                                  <button onClick={() => removeTest(idx)} className="text-neutral-300 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button>
                              </div>
                              <div className="space-y-3">
                                  <input 
                                    type="text" 
                                    value={test.title} 
                                    onChange={(e) => updateTest(idx, 'title', e.target.value)} 
                                    placeholder="Question Title (e.g. 1RM Snatch)"
                                    className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-bold text-sm outline-none focus:border-black"
                                  />
                                  <textarea 
                                    rows={2}
                                    value={test.instruction} 
                                    onChange={(e) => updateTest(idx, 'instruction', e.target.value)} 
                                    placeholder="Instructions for the athlete..."
                                    className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-medium text-xs resize-none outline-none focus:border-black"
                                  />
                                  <div className="flex gap-4">
                                      <select 
                                        value={test.inputType} 
                                        onChange={(e) => updateTest(idx, 'inputType', e.target.value)}
                                        className="bg-white border border-neutral-100 rounded-xl p-3 text-xs font-bold uppercase outline-none"
                                      >
                                          <option value="TEXT">Text Answer</option>
                                          <option value="VIDEO">Video Upload</option>
                                          <option value="IMAGE">Image Upload</option>
                                      </select>
                                      <div className="flex items-center gap-2">
                                          <input 
                                            type="checkbox" 
                                            checked={test.required} 
                                            onChange={(e) => updateTest(idx, 'required', e.target.checked)}
                                            className="w-5 h-5 rounded-md border-neutral-300 text-black focus:ring-black"
                                          />
                                          <span className="text-xs font-bold uppercase text-neutral-500">Required</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                      <button onClick={addTest} className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-2xl text-[10px] font-black uppercase text-neutral-400 hover:border-black hover:text-black transition-all">+ Add Question</button>
                  </div>

                  <div className="p-8 border-t border-neutral-100 bg-neutral-50 flex gap-4">
                      <button onClick={() => { setIsEditing(false); setActiveDiscipline(null); }} className="flex-1 py-4 bg-white border border-neutral-200 rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                      <button onClick={handleSave} className="flex-[2] py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-all shadow-xl">Save Configuration</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SupportDiagnosticLogic;
