
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
    alert(`${tmpl.name} deployed to drafting pool.`);
  };

  return (
    <div className="space-y-12 pb-20 text-left animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">WOD Programming</h1>
          <p className="text-neutral-400 font-medium">Design and publish daily training sessions.</p>
        </div>
        <button className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">calendar_add_on</span>
          Schedule Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold font-display uppercase tracking-tight">Upcoming WODs</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-neutral-50 text-neutral-400 hover:text-black">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="p-2 rounded-lg bg-neutral-50 text-neutral-400 hover:text-black">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {wods.map((wod, i) => (
                <div key={i} className="flex items-center gap-8 p-6 bg-neutral-50 rounded-3xl border border-neutral-100 hover:border-black transition-all group cursor-pointer">
                  <div className="text-center w-16">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{wod.day}</p>
                    <p className="text-xl font-black text-black leading-tight">{wod.date.split(' ').pop()}</p>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-black text-black uppercase tracking-tight">{wod.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] font-black text-accent uppercase tracking-widest">{wod.type}</span>
                      <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">• {wod.intensity} Intensity</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleEditWod(i)}
                    className="opacity-0 group-hover:opacity-100 transition-all px-4 py-2 bg-white border border-neutral-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div 
            onClick={() => setIsLibraryOpen(true)}
            className="bg-black text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group cursor-pointer"
          >
            <h3 className="text-2xl font-black font-display uppercase tracking-tight leading-none mb-4 relative z-10">WOD Templates</h3>
            <p className="text-neutral-400 text-sm mb-10 relative z-10">Choose from a library of benchmark workouts and strength templates.</p>
            <button className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl relative z-10 hover:bg-neutral-100 transition-all">Open Library</button>
            <span className="material-symbols-outlined text-[140px] absolute -bottom-10 -right-10 text-white/5 group-hover:scale-110 transition-transform duration-1000">menu_book</span>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">Collaborative Cycles</h4>
            <div className="space-y-4">
              <div className="p-5 bg-accent/5 rounded-2xl flex justify-between items-center border border-accent/10">
                <div>
                  <p className="text-xs font-black text-black uppercase tracking-tight">John Doe (Bespoke)</p>
                  <p className="text-[9px] font-bold text-accent uppercase tracking-widest">Building Phase</p>
                </div>
                <span className="material-symbols-outlined text-accent">groups</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WOD Editor Modal */}
      {editingWod && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center">
                 <h3 className="text-2xl font-black font-display uppercase tracking-tight">Edit Scheduled WOD</h3>
                 <button onClick={() => setEditingWod(null)} className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center hover:bg-black hover:text-white transition-all"><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">WOD Title</label>
                    <input 
                      type="text" 
                      value={editingWod.wod.title}
                      onChange={(e) => setEditingWod({...editingWod, wod: {...editingWod.wod, title: e.target.value}})}
                      className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Type</label>
                      <input 
                        type="text" 
                        value={editingWod.wod.type}
                        onChange={(e) => setEditingWod({...editingWod, wod: {...editingWod.wod, type: e.target.value}})}
                        className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Intensity</label>
                      <select 
                        value={editingWod.wod.intensity}
                        onChange={(e) => setEditingWod({...editingWod, wod: {...editingWod.wod, intensity: e.target.value}})}
                        className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-2xl font-bold focus:ring-2 focus:ring-black outline-none transition-all appearance-none"
                      >
                         <option>Low</option>
                         <option>Moderate</option>
                         <option>High</option>
                         <option>Elite</option>
                         <option>Technical</option>
                      </select>
                    </div>
                 </div>
              </div>
              <div className="p-10 bg-neutral-50 border-t border-neutral-100 flex gap-4">
                 <button onClick={() => setEditingWod(null)} className="flex-1 py-4 border border-neutral-200 text-neutral-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                 <button onClick={saveEditedWod} className="flex-[2] py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">Save Session Updates</button>
              </div>
           </div>
        </div>
      )}

      {/* Library Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg animate-in fade-in duration-300">
           <div className="bg-neutral-900 w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] border border-white/5">
              <div className="p-12 border-b border-white/5 flex justify-between items-center shrink-0">
                 <div className="space-y-1">
                    <h3 className="text-3xl font-black font-display uppercase tracking-tight text-white">Elite WOD Library</h3>
                    <p className="text-neutral-500 font-medium uppercase text-[10px] tracking-[0.2em]">Select a benchmark to deploy to schedule</p>
                 </div>
                 <button onClick={() => setIsLibraryOpen(false)} className="w-14 h-14 rounded-2xl bg-white/5 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {WOD_TEMPLATES.map(tmpl => (
                       <div key={tmpl.id} className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-accent hover:bg-white/10 transition-all group flex flex-col">
                          <div className="flex justify-between items-start mb-6">
                             <span className="px-3 py-1 bg-accent/20 text-accent text-[8px] font-black uppercase tracking-widest rounded-lg">{tmpl.category}</span>
                             <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">{tmpl.type}</span>
                          </div>
                          <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2 font-display">{tmpl.name}</h4>
                          <p className="text-neutral-400 text-sm font-medium mb-10 leading-relaxed italic">"{tmpl.description}"</p>
                          <button 
                            onClick={() => deployTemplate(tmpl)}
                            className="mt-auto w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-xl"
                          >
                            Deploy Template
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
