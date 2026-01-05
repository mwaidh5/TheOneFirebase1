
import React, { useState, useEffect } from 'react';
import { CustomDiscipline } from '../../types';
import { CUSTOM_DISCIPLINES, COACHES } from '../../constants';

interface SiteSettings {
  logo: string;
  heroImage: string;
  missionImage: string;
  heroHeadline: string;
  heroSubline: string;
}

interface AdminSiteSettingsProps {
  siteSettings: SiteSettings;
  setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
  library: { id: string; type: 'image' | 'video'; data: string; name: string }[];
  setLibrary: React.Dispatch<React.SetStateAction<{ id: string; type: 'image' | 'video'; data: string; name: string }[]>>;
}

const AdminSiteSettings: React.FC<AdminSiteSettingsProps> = ({ siteSettings, setSiteSettings, library, setLibrary }) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activePickerKey, setActivePickerKey] = useState<keyof SiteSettings | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [cacheSize, setCacheSize] = useState('142.4 MB');

  const [disciplines, setDisciplines] = useState<CustomDiscipline[]>(CUSTOM_DISCIPLINES);

  const openPicker = (key: keyof SiteSettings) => {
    setActivePickerKey(key);
    setIsPickerOpen(true);
  };

  const selectFromLibrary = (data: string) => {
    if (activePickerKey) {
      setSiteSettings({ ...siteSettings, [activePickerKey]: data });
      setIsPickerOpen(false);
      setActivePickerKey(null);
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const purgeCache = () => {
    if (window.confirm("Purge all system cache? This will force-reload all assets and terminate active background syncs.")) {
      setIsPurging(true);
      setTimeout(() => {
        setIsPurging(false);
        setCacheSize('0.0 KB');
        alert("Cache purged successfully. All application buffers have been cleared.");
      }, 2000);
    }
  };

  const updateDiscipline = (id: string, field: keyof CustomDiscipline, val: any) => {
    setDisciplines(disciplines.map(d => d.id === id ? { ...d, [field]: val } : d));
  };

  const addDiscipline = () => {
    const newD: CustomDiscipline = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Modality',
      icon: 'fitness_center',
      price: 299,
      assignedCoachId: COACHES[0].id,
      diagnostics: []
    };
    setDisciplines([...disciplines, newD]);
  };

  const removeDiscipline = (id: string) => {
    if (window.confirm("Permanently remove this custom course from the catalog?")) {
      setDisciplines(disciplines.filter(d => d.id !== id));
    }
  };

  return (
    <div className="space-y-12 pb-40 text-left relative animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Platform Infrastructure</h1>
          <p className="text-neutral-400 font-medium">Control global assets, performance logic, and the Bespoke catalog.</p>
        </div>
        <button 
          onClick={handleSave}
          className="px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-accent transition-all shadow-xl disabled:opacity-50"
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? 'Updating Ledger...' : saveStatus === 'saved' ? 'Success' : 'Authorize Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          
          {/* Custom Course Catalog Manager */}
          <section className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-2xl space-y-10">
            <div className="flex justify-between items-center border-b border-neutral-50 pb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-display uppercase tracking-tight flex items-center gap-3 text-black">
                  <span className="material-symbols-outlined text-accent filled">architecture</span> Bespoke Course Catalog
                </h2>
                <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest">Disciplines are auto-assigned to coaches for maximum efficiency.</p>
              </div>
              <button 
                onClick={addDiscipline}
                className="px-6 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span> Add Custom Track
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {disciplines.map((d) => (
                <div key={d.id} className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 hover:border-black transition-all flex flex-col lg:flex-row items-center gap-10 group">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-white shadow-xl flex items-center justify-center text-accent shrink-0">
                    <span className="material-symbols-outlined text-3xl">{d.icon}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-grow w-full">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-neutral-300 uppercase tracking-widest ml-1">Discipline Name</label>
                       <input 
                         type="text" value={d.name} onChange={e => updateDiscipline(d.id, 'name', e.target.value)}
                         className="w-full bg-white border border-neutral-100 rounded-xl p-4 font-black uppercase text-sm outline-none focus:border-black"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-neutral-300 uppercase tracking-widest ml-1">Assigned Head Coach</label>
                       <select 
                         value={d.assignedCoachId} onChange={e => updateDiscipline(d.id, 'assignedCoachId', e.target.value)}
                         className="w-full bg-white border border-neutral-100 rounded-xl p-4 font-bold text-xs outline-none focus:border-black appearance-none"
                       >
                         {COACHES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-neutral-300 uppercase tracking-widest ml-1">Entry Price ($)</label>
                       <input 
                         type="number" value={d.price} onChange={e => updateDiscipline(d.id, 'price', parseInt(e.target.value))}
                         className="w-full bg-white border border-neutral-100 rounded-xl p-4 font-black text-accent text-sm outline-none focus:border-accent"
                       />
                    </div>
                  </div>

                  <div className="shrink-0 flex gap-2">
                     <button 
                       onClick={() => removeDiscipline(d.id)}
                       className="w-12 h-12 rounded-xl bg-white border border-neutral-100 text-neutral-300 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                     >
                        <span className="material-symbols-outlined">delete</span>
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Core Branding Section */}
          <section className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-2xl space-y-10">
            <h2 className="text-2xl font-black font-display uppercase tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-accent">palette</span> Global Brand Assets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Site Logo</label>
                  <div 
                    onClick={() => openPicker('logo')}
                    className="block w-full h-48 rounded-[2rem] border-2 border-dashed border-neutral-100 bg-neutral-50 flex items-center justify-center relative group cursor-pointer overflow-hidden transition-all hover:border-black"
                  >
                    {siteSettings.logo ? <img src={siteSettings.logo} className="max-w-[70%] max-h-[70%] object-contain" alt="Logo" /> : <span className="material-symbols-outlined text-4xl text-neutral-200">add_circle</span>}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Primary Hero Backdrop</label>
                  <div 
                    onClick={() => openPicker('heroImage')}
                    className="block w-full h-48 rounded-[2rem] border-2 border-dashed border-neutral-100 bg-neutral-50 overflow-hidden relative group cursor-pointer transition-all hover:border-black"
                  >
                    <img src={siteSettings.heroImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Hero" />
                  </div>
               </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-10">
          {/* Cache & Performance Section */}
          <section className="bg-white p-8 rounded-[3rem] border border-neutral-100 shadow-2xl space-y-8">
            <div className="space-y-1">
              <h2 className="text-lg font-black font-display uppercase tracking-tight flex items-center gap-3 text-black">
                <span className="material-symbols-outlined text-accent filled">speed</span> System Performance
              </h2>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Manage application-level buffers.</p>
            </div>

            <div className="space-y-6">
               <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Current Cache Size</p>
                    <p className="text-xl font-black text-black">{cacheSize}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-accent">
                     <span className="material-symbols-outlined">storage</span>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <p className="text-[10px] font-black uppercase text-black">Auto-Optimize Media</p>
                     <div className="w-10 h-5 bg-accent rounded-full relative cursor-pointer"><div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div></div>
                  </div>
                  <div className="flex items-center justify-between px-2">
                     <p className="text-[10px] font-black uppercase text-black">Enable Edge Buffering</p>
                     <div className="w-10 h-5 bg-accent rounded-full relative cursor-pointer"><div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div></div>
                  </div>
               </div>

               <button 
                  onClick={purgeCache}
                  disabled={isPurging}
                  className="w-full py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-100"
               >
                  {isPurging ? (
                     <><div className="w-3 h-3 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div> Flushing Data...</>
                  ) : (
                     <><span className="material-symbols-outlined text-sm">delete_sweep</span> Purge System Cache</>
                  )}
               </button>
            </div>
            
            <p className="text-[8px] font-medium text-neutral-400 leading-relaxed text-center px-4">
               Purging the cache will clear all temporary pre-rendered assets and background analytics buffers.
            </p>
          </section>

          <section className="bg-neutral-900 p-8 rounded-[3rem] shadow-2xl space-y-6 text-white overflow-hidden relative">
             <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-black font-display uppercase tracking-tight">Sync Status</h3>
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">Edge Node: SG-V1</p>
                </div>
             </div>
             <span className="material-symbols-outlined text-[100px] absolute -bottom-6 -right-6 text-white/5 -rotate-12">sync</span>
          </section>
        </div>
      </div>

      {/* Media Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
            <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left">
              <div>
                <h3 className="text-3xl font-black font-display uppercase tracking-tight">Gallery Logic</h3>
                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Select an internal asset to deploy.</p>
              </div>
              <button onClick={() => setIsPickerOpen(false)} className="w-14 h-14 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 sm:grid-cols-4 gap-6 no-scrollbar">
              {library.map(asset => (
                <div 
                  key={asset.id} 
                  onClick={() => selectFromLibrary(asset.data)}
                  className="group relative aspect-square rounded-[2rem] overflow-hidden border border-neutral-100 bg-neutral-50 cursor-pointer hover:ring-4 hover:ring-accent transition-all shadow-xl"
                >
                  <img src={asset.data} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={asset.name} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-[9px] font-black uppercase text-white bg-accent px-4 py-2 rounded-full">Apply</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSiteSettings;
