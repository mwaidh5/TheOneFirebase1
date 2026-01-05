
import React, { useState, useRef, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MediaAsset } from '../../types';

interface MediaLibraryProps {
  library: MediaAsset[];
  setLibrary: React.Dispatch<React.SetStateAction<MediaAsset[]>>;
}

const AdminMediaLibrary: React.FC<MediaLibraryProps> = ({ library, setLibrary }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedImageForAi, setSelectedImageForAi] = useState<string | null>(null);
  const [aiTab, setAiTab] = useState<'generate' | 'edit'>('generate');
  const [filterType, setFilterType] = useState<'ALL' | 'image' | 'video'>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'WORKOUT' | 'GENERAL' | 'PROFILE'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'NAME'>('NEWEST');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = useMemo(() => {
    let assets = [...library];
    if (filterType !== 'ALL') assets = assets.filter(a => a.type === filterType);
    if (filterCategory !== 'ALL') assets = assets.filter(a => a.category === filterCategory);
    
    if (sortBy === 'NEWEST') {
      assets.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      assets.sort((a, b) => a.name.localeCompare(b.name));
    }
    return assets;
  }, [library, filterType, filterCategory, sortBy]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result as string;
      setLibrary([...library, { 
        id: Math.random().toString(), 
        type: file.type.startsWith('video') ? 'video' : 'image', 
        data, 
        name: file.name,
        category: 'WORKOUT',
        createdAt: Date.now()
      }]);
    };
    reader.readAsDataURL(file);
  };

  const runAiTask = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let contents;
      if (aiTab === 'generate') {
        contents = { parts: [{ text: aiPrompt }] };
      } else if (selectedImageForAi) {
        const base64Data = selectedImageForAi.split(',')[1];
        contents = {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/png' } },
            { text: aiPrompt }
          ]
        };
      } else {
        throw new Error('Please select an image to edit.');
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents,
        config: { imageConfig: { aspectRatio: '1:1' } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const newImage = `data:image/png;base64,${part.inlineData.data}`;
          setLibrary([{ 
            id: Math.random().toString(), 
            type: 'image', 
            data: newImage, 
            name: `AI ${aiTab}: ${aiPrompt.slice(0, 15)}...`,
            category: 'WORKOUT',
            createdAt: Date.now()
          }, ...library]);
          setAiPrompt('');
          setSelectedImageForAi(null);
          break;
        }
      }
    } catch (error) {
      console.error('AI Task Failed:', error);
      alert('AI Generation failed. Please check your prompt and try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-24 text-left animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Media Studio</h1>
          <p className="text-neutral-400 font-medium">Internal asset management and AI creative laboratory.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center gap-2"
        >
          <span className="material-symbols-outlined">upload_file</span>
          Internal Upload
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} accept="image/*,video/mp4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm min-h-[600px] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <h2 className="text-xl font-bold font-display uppercase tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-accent">gallery_thumbnail</span>
                Asset Gallery
              </h2>
              <div className="flex flex-wrap gap-4">
                <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
                  <option value="ALL">All Types</option>
                  <option value="image">Images Only</option>
                  <option value="video">Videos Only</option>
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
                  <option value="ALL">All Categories</option>
                  <option value="WORKOUT">Workout Assets</option>
                  <option value="GENERAL">General Assets</option>
                  <option value="PROFILE">Profile Assets</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
                  <option value="NEWEST">Newest First</option>
                  <option value="NAME">Name A-Z</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="group relative aspect-square rounded-3xl overflow-hidden border border-neutral-50 bg-neutral-50 hover:shadow-xl transition-all cursor-pointer shadow-sm">
                  {asset.type === 'image' ? (
                    <img src={asset.data} alt={asset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black text-white">
                      <span className="material-symbols-outlined text-4xl">video_file</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-black shadow-sm">{asset.category}</span>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                    <p className="text-[10px] font-black text-white uppercase truncate mb-2">{asset.name}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setAiTab('edit');
                          setSelectedImageForAi(asset.data);
                        }}
                        className="flex-1 py-2 bg-white text-black text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-accent hover:text-white"
                      >
                        AI Edit
                      </button>
                      <button 
                        onClick={() => setLibrary(library.filter(l => l.id !== asset.id))}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-neutral-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-8 sticky top-10 overflow-hidden border border-white/5">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <h2 className="text-2xl font-black font-display uppercase tracking-tight">AI Laboratory</h2>
              </div>

              <div className="flex p-1 bg-white/5 rounded-2xl mb-8">
                <button onClick={() => setAiTab('generate')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aiTab === 'generate' ? 'bg-accent text-white' : 'text-neutral-500 hover:text-white'}`}>Create New</button>
                <button onClick={() => setAiTab('edit')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aiTab === 'edit' ? 'bg-accent text-white' : 'text-neutral-500 hover:text-white'}`}>Smart Edit</button>
              </div>

              {aiTab === 'edit' && (
                <div className="mb-8 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Target Image</p>
                  <div className="aspect-video rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative group">
                    {selectedImageForAi ? (
                      <>
                        <img src={selectedImageForAi} className="w-full h-full object-cover" />
                        <button onClick={() => setSelectedImageForAi(null)} className="absolute top-4 right-4 bg-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-8">
                        <span className="material-symbols-outlined text-3xl text-neutral-700 mb-2">image_search</span>
                        <p className="text-[10px] font-bold text-neutral-600 uppercase">Select from gallery to edit</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{aiTab === 'generate' ? 'Generation Prompt' : 'Editing Instructions'}</p>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={aiTab === 'generate' ? "e.g., A cinematic wide shot of an athlete doing muscle ups." : "e.g., Remove the background and make it high-contrast black and white."}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none min-h-[150px] transition-all"
                />
              </div>

              <div className="pt-8">
                <button 
                  onClick={runAiTask}
                  disabled={isAiLoading || !aiPrompt || (aiTab === 'edit' && !selectedImageForAi)}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl flex items-center justify-center gap-4 ${isAiLoading ? 'bg-neutral-800 text-neutral-500' : 'bg-accent text-white hover:bg-blue-600'}`}
                >
                  {isAiLoading ? (
                    <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> AI Working...</>
                  ) : (
                    <><span className="material-symbols-outlined">flare</span> {aiTab === 'generate' ? 'Generate Asset' : 'Apply Magic Edit'}</>
                  )}
                </button>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMediaLibrary;
