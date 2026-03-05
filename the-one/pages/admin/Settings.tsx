
import React, { useState, useEffect } from 'react';
import { setDoc, doc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { CustomDiscipline } from '../../types';
import { COACHES } from '../../constants';

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
}

const AdminSiteSettings: React.FC<AdminSiteSettingsProps> = ({ siteSettings, setSiteSettings, library }) => {
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activePickerKey, setActivePickerKey] = useState<keyof SiteSettings | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [cacheSize, setCacheSize] = useState('142.4 MB'); // Mock value, in real app would calculate

  // Sync local state if parent state changes (e.g., initial load from Firestore)
  useEffect(() => {
    setLocalSettings(siteSettings);
  }, [siteSettings]);

  const openPicker = (key: keyof SiteSettings) => {
    setActivePickerKey(key);
    setIsPickerOpen(true);
  };

  const selectFromLibrary = (data: string) => {
    if (activePickerKey) {
      setLocalSettings({ ...localSettings, [activePickerKey]: data });
      setIsPickerOpen(false);
      setActivePickerKey(null);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // 1. Persist to Firestore
      await setDoc(doc(db, 'settings', 'site'), localSettings, { merge: true });
      
      // 2. Update Global App State (this will trigger updates across the site)
      setSiteSettings(localSettings);
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(`Failed to save site settings: ${(error as Error).message}`);
      setSaveStatus('idle');
    }
  };

  const purgeCache = async () => {
    if (window.confirm("Purge all system cache? This will force-reload all assets, clear local storage, and terminate active sessions.")) {
      setIsPurging(true);
      
      try {
          // 1. Clear Local Storage
          localStorage.clear();
          
          // 2. Clear Session Storage
          sessionStorage.clear();
          
          // 3. Clear Browser Cache Storage (Service Workers/Assets)
          if ('caches' in window) {
              const keys = await caches.keys();
              await Promise.all(keys.map(key => caches.delete(key)));
          }

          setCacheSize('0.0 KB');
          
          setTimeout(() => {
            setIsPurging(false);
            alert("Cache purged successfully. The application will now reload.");
            window.location.reload();
          }, 1500);
      } catch (e) {
          console.error("Cache purge failed", e);
          setIsPurging(false);
          alert("Failed to purge complete cache.");
      }
    }
  };

  return (
    <div className="space-y-12 pb-40 text-left relative animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Platform Infrastructure</h1>
          <p className="text-neutral-400 font-medium">Control global assets and system performance.</p>
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
          
          {/* Global Brand Assets Section */}
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
                    {localSettings.logo ? <img src={localSettings.logo} className="max-w-[70%] max-h-[70%] object-contain" alt="Logo" /> : <span className="material-symbols-outlined text-4xl text-neutral-200">add_circle</span>}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Primary Hero Backdrop</label>
                  <div 
                    onClick={() => openPicker('heroImage')}
                    className="block w-full h-48 rounded-[2rem] border-2 border-dashed border-neutral-100 bg-neutral-50 overflow-hidden relative group cursor-pointer transition-all hover:border-black"
                  >
                    {localSettings.heroImage ? (
                        <img src={localSettings.heroImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Hero" />
                    ) : (
                        <span className="material-symbols-outlined text-4xl text-neutral-200">add_photo_alternate</span>
                    )}
                  </div>
               </div>
            </div>
            
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Hero Headline</label>
               <input 
                 type="text" 
                 value={localSettings.heroHeadline}
                 onChange={(e) => setLocalSettings({...localSettings, heroHeadline: e.target.value})}
                 className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-5 px-8 text-sm font-black uppercase outline-none focus:ring-4 focus:ring-accent/10 transition-all"
               />
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-10">
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
          </section>

          <section className="bg-neutral-900 p-8 rounded-[3rem] shadow-2xl space-y-6 text-white overflow-hidden relative">
             <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-black font-display uppercase tracking-tight">Sync Status</h3>
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">Cloud Node Active</p>
                </div>
             </div>
             <span className="material-symbols-outlined text-[100px] absolute -bottom-6 -right-6 text-white/5 -rotate-12">sync</span>
          </section>
        </div>
      </div>

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
