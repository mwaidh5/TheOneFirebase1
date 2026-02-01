
import React, { useState } from 'react';
import { WOD_TEMPLATES } from '../../constants';

interface WOD {
  day: string;
  date: string;
  title: string;
  type: string;
  intensity: string;
}

const CoachProgramming: React.FC = () => {
  const [wods, setWods] = useState<WOD[]>([
    { day: 'Mon', date: 'Oct 28', title: 'Metcon Madness', type: 'Endurance', intensity: 'High' },
    { day: 'Tue', date: 'Oct 29', title: 'Heavy Day: Back Squat', type: 'Strength', intensity: 'Elite' },
    { day: 'Wed', date: 'Oct 30', title: 'Skill Session: Ring Muscle-ups', type: 'Gymnastics', intensity: 'Technical' },
  ]);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [editingWod, setEditingWod] = useState<{idx: number, wod: WOD} | null>(null);

  const handleEditWod = (idx: number) => {
    setEditingWod({ idx, wod: { ...wods[idx] } });
  };

  const saveEditedWod = () => {
    if (editingWod) {
      const newWods = [...wods];
      newWods[editingWod.idx] = editingWod.wod;
      setWods(newWods);
      setEditingWod(null);
    }
  };

  const deployTemplate = (tmpl: typeof WOD_TEMPLATES[0]) => {
    const newWod: WOD = {
      day: 'TBD',
      date: 'Next',
      title: tmpl.name,
      type: tmpl.type,
      intensity: 'Moderate'
    };
    setWods([...wods, newWod]);
    setIsLibraryOpen(false);
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-20 text-left animate-in fade-in duration-500 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black font-display tracking-tight text-black uppercase">WOD Programming</h1>
          <p className="text-neutral-400 text-sm md:text-base font-medium">Design daily training sessions.</p>
        </div>
        <button className="w-full md:w-auto px-6 md:px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">calendar_add_on</span>
          Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-bold font-display uppercase tracking-tight">Upcoming</h2>
              <div className="flex gap-1 md:gap-2">
                <button className="p-2 rounded-lg bg-neutral-50 text-neutral-400"><span className="material-symbols-outlined text-base">chevron_left</span></button>
                <button className="p-2 rounded-lg bg-neutral-50 text-neutral-400"><span className="material-symbols-outlined text-base">chevron_right</span></button>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              {wods.map((wod, i) => (
                <div key={i} onClick={() => handleEditWod(i)} className="flex items-center gap-4 md:gap-8 p-4 md:p-6 bg-neutral-50 rounded-2xl md:rounded-3xl border border-neutral-100 hover:border-black transition-all group cursor-pointer">
                  <div className="text-center w-12 md:w-16 shrink-0">
                    <p className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest">{wod.day}</p>
                    <p className="text-base md:text-xl font-black text-black leading-tight">{wod.date.split(' ').pop()}</p>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm md:text-lg font-black text-black uppercase tracking-tight truncate max-w-[150px] md:max-w-none">{wod.title}</h3>
                    <div className="flex items-center gap-2 md:gap-4 mt-0.5 md:mt-1">
                      <span className="text-[8px] md:text-[10px] font-black text-accent uppercase tracking-widest">{wod.type}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-neutral-300 group-hover:text-black text-xl">edit</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <div 
            onClick={() => setIsLibraryOpen(true)}
            className="bg-black text-white p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden group cursor-pointer"
          >
            <h3 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight leading-none mb-3 md:mb-4 relative z-10">Templates</h3>
            <p className="text-neutral-400 text-xs md:text-sm mb-6 md:mb-10 relative z-10">Benchmark workouts.</p>
            <button className="w-full py-3 md:py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl md:rounded-2xl relative z-10 hover:bg-neutral-100">Open Library</button>
            <span className="material-symbols-outlined text-[100px] md:text-[140px] absolute -bottom-5 md:-bottom-10 -right-5 md:-right-10 text-white/5 group-hover:scale-110 transition-transform duration-1000">menu_book</span>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-4 md:space-y-6">
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-neutral-400">Cycles</h4>
            <div className="space-y-3">
              <div className="p-4 bg-accent/5 rounded-xl md:rounded-2xl flex justify-between items-center border border-accent/10">
                <div className="truncate">
                  <p className="text-[10px] md:text-xs font-black text-black uppercase tracking-tight">John Doe</p>
                  <p className="text-[8px] md:text-[9px] font-bold text-accent uppercase tracking-widest">Building Phase</p>
                </div>
                <span className="material-symbols-outlined text-accent text-lg">groups</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WOD Editor Modal (Compact) */}
      {editingWod && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden relative">
              <div className="p-6 md:p-10 border-b border-neutral-100 flex justify-between items-center">
                 <h3 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight">Edit Session</h3>
                 <button onClick={() => setEditingWod(null)} className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center"><span className="material-symbols-outlined text-xl">close</span></button>
              </div>
              <div className="p-6 md:p-10 space-y-4 md:space-y-6">
                 <div className="space-y-1">
                    <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Title</label>
                    <input 
                      type="text" 
                      value={editingWod.wod.title}
                      onChange={(e) => setEditingWod({...editingWod, wod: {...editingWod.wod, title: e.target.value}})}
                      className="w-full p-3 md:p-4 bg-neutral-50 border border-neutral-100 rounded-xl md:rounded-2xl font-bold text-sm md:text-base outline-none"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Type</label>
                      <input 
                        type="text" 
                        value={editingWod.wod.type}
                        onChange={(e) => setEditingWod({...editingWod, wod: {...editingWod.wod, type: e.target.value}})}
                        className="w-full p-3 md:p-4 bg-neutral-50 border border-neutral-100 rounded-xl md:rounded-2xl font-bold text-sm md:text-base outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Level</label>
                      <select 
                        value={editingWod.wod.intensity}
                        onChange={(e) => setEditingWod({...editingWod, wod: {...editingWod.wod, intensity: e.target.value}})}
                        className="w-full p-3 md:p-4 bg-neutral-50 border border-neutral-100 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none appearance-none"
                      >
                         <option>Low</option>
                         <option>Moderate</option>
                         <option>High</option>
                      </select>
                    </div>
                 </div>
              </div>
              <div className="p-6 md:p-10 bg-neutral-50 border-t border-neutral-100 flex gap-3 md:gap-4">
                 <button onClick={() => setEditingWod(null)} className="flex-1 py-3 md:py-4 border border-neutral-200 text-neutral-400 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px]">Cancel</button>
                 <button onClick={saveEditedWod} className="flex-[2] py-3 md:py-4 bg-black text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-lg flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm md:text-base">save</span>
                    Save
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Library Modal (Compact) */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-lg animate-in fade-in duration-300">
           <div className="bg-neutral-900 w-full max-w-4xl rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] border border-white/5">
              <div className="p-8 md:p-12 border-b border-white/5 flex justify-between items-center shrink-0">
                 <h3 className="text-xl md:text-3xl font-black font-display uppercase tracking-tight text-white">WOD Library</h3>
                 <button onClick={() => setIsLibraryOpen(false)} className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {WOD_TEMPLATES.map(tmpl => (
                       <div key={tmpl.id} className="p-6 md:p-8 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 hover:border-accent transition-all group flex flex-col">
                          <h4 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight mb-2 font-display">{tmpl.name}</h4>
                          <button 
                            onClick={() => deployTemplate(tmpl)}
                            className="mt-4 md:mt-8 w-full py-3 md:py-4 bg-white text-black rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-xl"
                          >
                            Deploy
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CoachProgramming;
