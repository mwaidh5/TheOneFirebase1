
import React, { useState, useRef, useEffect } from 'react';
import { DiagnosticTest, CustomDiscipline } from '../../types';
import { CUSTOM_DISCIPLINES, MOCK_COACH_USER } from '../../constants';

const Dropdown: React.FC<{
  value: string;
  options: { label: string; value: string; icon: string }[];
  onChange: (val: string) => void;
  label: string;
}> = ({ value, options, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <label className="text-[9px] font-black text-neutral-300 uppercase ml-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border rounded-xl p-3.5 flex items-center justify-between transition-all hover:border-black ${
          isOpen ? 'border-black ring-2 ring-black/5 shadow-sm' : 'border-neutral-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-neutral-400 text-[18px]">{activeOption.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-black">{activeOption.label}</span>
        </div>
        <span className={`material-symbols-outlined text-neutral-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-[100] top-full mt-2 w-full bg-white border border-neutral-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors ${
                value === opt.value ? 'bg-neutral-50' : ''
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${value === opt.value ? 'text-accent' : 'text-neutral-300'}`}>
                {opt.icon}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${value === opt.value ? 'text-accent' : 'text-neutral-500'}`}>
                {opt.label}
              </span>
              {value === opt.value && <span className="material-symbols-outlined ml-auto text-accent text-sm">check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CoachGlobalQuestions: React.FC = () => {
  // Coach manages test templates for their assigned GAMES (Disciplines)
  const [assignedGames, setAssignedGames] = useState<CustomDiscipline[]>(
    CUSTOM_DISCIPLINES.filter(d => d.assignedCoachId === MOCK_COACH_USER.id)
  );

  const [activeGameId, setActiveGameId] = useState<string | null>(assignedGames[0]?.id || null);
  const activeGame = assignedGames.find(g => g.id === activeGameId);

  const addTest = (gameId: string) => {
    setAssignedGames(assignedGames.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          diagnostics: [...(g.diagnostics || []), { id: Math.random().toString(), title: 'New Master Test', instruction: '', inputType: 'TEXT', required: true }]
        };
      }
      return g;
    }));
  };

  const updateTest = (gameId: string, tId: string, field: keyof DiagnosticTest, val: any) => {
    setAssignedGames(assignedGames.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          diagnostics: g.diagnostics?.map(t => t.id === tId ? { ...t, [field]: val } : t)
        };
      }
      return g;
    }));
  };

  const removeTest = (gameId: string, tId: string) => {
    setAssignedGames(assignedGames.map(g => {
      if (g.id === gameId) {
        return { ...g, diagnostics: g.diagnostics?.filter(t => t.id !== tId) };
      }
      return g;
    }));
  };

  const saveMasterDiagnostics = () => {
    alert(`Master diagnostics for "${activeGame?.name}" committed to global catalog. All future purchasers of this track will receive these requirements.`);
  };

  const inputOptions = [
    { label: 'Text Input', value: 'TEXT', icon: 'notes' },
    { label: 'Video Capture', value: 'VIDEO', icon: 'videocam' },
    { label: 'Photo Upload', value: 'IMAGE', icon: 'photo_camera' }
  ];

  return (
    <div className="space-y-12 text-left animate-in fade-in duration-500 pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Master Diagnostics</h1>
          <p className="text-neutral-400 font-medium">Engineer the assessment logic for the games assigned to your coaching roster.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Discipline Selection */}
        <div className="lg:col-span-4 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300 ml-5">Assigned Games</p>
          {assignedGames.map(game => (
            <button 
              key={game.id} 
              onClick={() => setActiveGameId(game.id)}
              className={`w-full text-left p-8 rounded-[2.5rem] border transition-all flex justify-between items-center ${activeGameId === game.id ? 'bg-black text-white border-black shadow-2xl' : 'bg-white border-neutral-100 hover:border-black hover:shadow-xl text-neutral-400 hover:text-black'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`material-symbols-outlined text-2xl ${activeGameId === game.id ? 'text-accent' : 'text-neutral-200'}`}>{game.icon}</span>
                <div className="space-y-1">
                  <p className={`text-lg font-black uppercase tracking-tight leading-none ${activeGameId === game.id ? 'text-white' : 'text-black'}`}>{game.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{game.diagnostics?.length || 0} Test Vectors</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-xl">{activeGameId === game.id ? 'done_all' : 'chevron_right'}</span>
            </button>
          ))}
        </div>

        {/* Diagnostic Vector Editor */}
        <div className="lg:col-span-8">
           {activeGame ? (
             <div className="bg-white rounded-[3.5rem] p-12 border border-neutral-100 shadow-2xl space-y-12 animate-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-end border-b border-neutral-50 pb-8 text-left">
                   <div className="space-y-4">
                      <span className="px-4 py-1.5 bg-accent/10 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest">Logic Source: {activeGame.name}</span>
                      <h2 className="text-4xl font-black text-black uppercase font-display leading-none tracking-tight">Requirement Logic</h2>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => addTest(activeGame.id)} className="px-8 py-4 bg-neutral-50 text-black border border-neutral-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-sm">Add Test Block</button>
                      <button onClick={saveMasterDiagnostics} className="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-neutral-800 transition-all">Push to Catalog</button>
                   </div>
                </div>

                <div className="space-y-8">
                   {activeGame.diagnostics?.map((test) => (
                      <div key={test.id} className="p-10 bg-neutral-50 rounded-[3rem] border border-neutral-100 space-y-10 relative group shadow-sm hover:border-black transition-all">
                         <button 
                           onClick={() => removeTest(activeGame.id, test.id)}
                           className="absolute top-8 right-8 text-neutral-300 hover:text-red-500 transition-colors"
                         >
                            <span className="material-symbols-outlined">delete</span>
                         </button>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
                            <div className="space-y-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest ml-1">Requirement Descriptor</label>
                                  <input 
                                    type="text" value={test.title} 
                                    onChange={e => updateTest(activeGame.id, test.id, 'title', e.target.value)} 
                                    placeholder="e.g. Aerobic Threshold Assessment"
                                    className="w-full bg-white border border-neutral-100 rounded-2xl p-5 font-black uppercase text-sm outline-none focus:border-black" 
                                  />
                               </div>
                               <Dropdown 
                                  label="Required Input Strategy"
                                  value={test.inputType}
                                  options={inputOptions}
                                  onChange={(val) => updateTest(activeGame.id, test.id, 'inputType', val as any)}
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest ml-1">Athlete Directives</label>
                               <textarea 
                                 rows={6} value={test.instruction} 
                                 onChange={e => updateTest(activeGame.id, test.id, 'instruction', e.target.value)} 
                                 placeholder="Explicit instructions on how to perform and record the test..." 
                                 className="w-full bg-white border border-neutral-100 rounded-3xl p-6 text-sm font-medium resize-none outline-none focus:border-black shadow-inner" 
                               />
                            </div>
                         </div>
                      </div>
                   ))}
                   {(!activeGame.diagnostics || activeGame.diagnostics.length === 0) && (
                     <div className="py-32 text-center border-2 border-dashed border-neutral-100 rounded-[3.5rem] text-neutral-200">
                        <span className="material-symbols-outlined text-6xl mb-4">analytics</span>
                        <p className="font-black uppercase tracking-widest text-xs">Awaiting Master Test Vector Creation</p>
                     </div>
                   )}
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-neutral-100 py-48">
                <span className="material-symbols-outlined text-[120px] mb-6 opacity-20">shield_person</span>
                <p className="font-black uppercase tracking-widest text-sm opacity-50">Select an Assigned Game track to manage its Master Intelligence Tests</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CoachGlobalQuestions;
