
import React from 'react';
import { CUSTOM_DISCIPLINES, COACHES } from '../../constants';

const SupportDiagnosticLogic: React.FC = () => {
  return (
    <div className="text-left space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="space-y-1">
        <h1 className="text-4xl font-black font-display uppercase text-black leading-none tracking-tight">Diagnostic Logic</h1>
        <p className="text-neutral-400 font-medium">Explain the intake requirements for bespoke programming tracks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
           {CUSTOM_DISCIPLINES.map(discipline => (
             <div key={discipline.id} className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm space-y-10">
                <div className="flex items-center justify-between border-b border-neutral-50 pb-8">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center">
                         <span className="material-symbols-outlined text-2xl">{discipline.icon}</span>
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-black uppercase tracking-tight">{discipline.name} Bespoke</h2>
                         <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Assigned Coach: {COACHES.find(c => c.id === discipline.assignedCoachId)?.name}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-neutral-300 uppercase mb-1">Architecture Entry</p>
                      <p className="text-2xl font-black text-purple-600">${discipline.price}</p>
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
    </div>
  );
};

export default SupportDiagnosticLogic;
