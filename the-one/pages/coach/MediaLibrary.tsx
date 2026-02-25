
import React, { useState, useRef, useMemo } from 'react';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { GoogleGenAI } from '@google/genai';
import { MediaAsset, User } from '../../types';

interface MediaLibraryProps {
  library: MediaAsset[];
  setLibrary: React.Dispatch<React.SetStateAction<MediaAsset[]>>;
  currentUser: User;
}

const CoachMediaLibrary: React.FC<MediaLibraryProps> = ({ library, setLibrary, currentUser }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedImageForAi, setSelectedImageForAi] = useState<string | null>(null);
  const [aiTab, setAiTab] = useState<'generate' | 'edit'>('generate');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayAssets = useMemo(() => {
    return library.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           asset.creatorName?.toLowerCase().includes(searchQuery.toLowerCase());
      const isMine = asset.creatorId === currentUser.id;
      const isPublic = asset.isPublic === true;
      return matchesSearch && (isMine || isPublic);
    });
  }, [library, currentUser, searchQuery]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const assetId = Math.random().toString(36).substr(2, 9);
      const storagePath = `media/${assetId}/${file.name}`;
      const storageRef = ref(storage, storagePath);

      // Upload to Firebase Storage
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const newAsset: MediaAsset = { 
        id: assetId, 
        type: file.type.startsWith('video') ? 'video' : 'image', 
        data: downloadURL, 
        name: file.name,
        category: 'WORKOUT',
        createdAt: Date.now(),
        creatorId: currentUser.id,
        creatorName: `${currentUser.firstName} ${currentUser.lastName}`,
        isPublic: false,
        storagePath: storagePath
      };

      await setDoc(doc(db, 'media', assetId), newAsset);
      setLibrary(prev => [newAsset, ...prev]);
    } catch (error) {
        console.error("Error uploading to media library:", error);
        alert("Failed to save to media library.");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  const deleteAsset = async (asset: MediaAsset) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
        try {
            await deleteDoc(doc(db, 'media', asset.id));
            if (asset.storagePath) {
                const storageRef = ref(storage, asset.storagePath);
                await deleteObject(storageRef).catch(err => console.warn("Could not delete from storage", err));
            }
            // Sync is handled by listener in App.tsx but we can optimistic update
             setLibrary(prev => prev.filter(l => l.id !== asset.id));
        } catch (error) {
            console.error("Error deleting asset:", error);
            alert("Failed to delete asset.");
        }
    }
  };

  const runAiTask = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);

    try {
      // Note: This requires a valid API key in environment variables
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_GENAI_API_KEY });
      
      let contents;
      if (aiTab === 'generate') {
        contents = { parts: [{ text: aiPrompt }] };
      } else if (selectedImageForAi) {
         // If selectedImageForAi is a URL (from storage), we need to fetch it
         let base64Data = '';
         if (selectedImageForAi.startsWith('http')) {
             try {
                 const response = await fetch(selectedImageForAi);
                 const blob = await response.blob();
                 const reader = new FileReader();
                 base64Data = await new Promise((resolve) => {
                     reader.onloadend = () => resolve(reader.result as string);
                     reader.readAsDataURL(blob);
                 });
                 base64Data = base64Data.split(',')[1];
             } catch (e) {
                 console.error("Failed to fetch image for AI", e);
                 throw new Error("Failed to load image for AI processing");
             }
         } else {
             base64Data = selectedImageForAi.split(',')[1];
         }

        contents = {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/png' } },
            { text: aiPrompt }
          ]
        };
      } else {
        throw new Error('Please select an image to edit.');
      }

      // Note: Model availability depends on your API key permissions
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash', 
        contents,
        // config: { imageConfig: { aspectRatio: '1:1' } } // Removing unsupported config for basic text model, need specific image model
      });
      
      // MOCK RESPONSE FOR DEMO since we might not have full image gen capabilities configured
      // In a real app with image gen model access, you'd parse the image data.
      // For text-to-text models, this won't return an image. 
      // Assuming this part needs backend integration for real image gen.
      
      // Fallback/Mock behavior for now to prevent crashing if API doesn't return image
      const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
          alert(`AI Response (Text): ${generatedText}`);
      } else {
          alert("AI generation completed but no output format supported yet.");
      }

    } catch (error) {
      console.error('AI Task Failed:', error);
      alert('AI Generation failed. Please check API configuration.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-24 text-left animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Coach Media Studio</h1>
          <p className="text-neutral-400 font-medium">Your personal vault for movement demos and bespoke assets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input 
              type="text" 
              placeholder="Search gallery..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-100 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold shadow-sm outline-none focus:border-black transition-all"
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
                <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Uploading...
                </>
            ) : (
                <>
                <span className="material-symbols-outlined">upload_file</span>
                Upload File
                </>
            )}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} accept="image/*,video/mp4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm min-h-[600px] flex flex-col">
            <h2 className="text-xl font-bold font-display uppercase tracking-tight flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-accent">gallery_thumbnail</span>
              Movement & Asset Gallery
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {displayAssets.map(asset => (
                <div key={asset.id} className="group relative aspect-square rounded-3xl overflow-hidden border border-neutral-50 bg-neutral-50 hover:shadow-xl transition-all cursor-pointer shadow-sm">
                  {asset.type === 'image' ? (
                    <img src={asset.data} alt={asset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black text-white relative">
                      <video src={asset.data} className="w-full h-full object-cover" muted loop onMouseOver={e => (e.target as HTMLVideoElement).play()} onMouseOut={e => (e.target as HTMLVideoElement).pause()} />
                      <span className="material-symbols-outlined text-4xl absolute pointer-events-none">video_file</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-black shadow-sm">{asset.category}</span>
                    {asset.isPublic && (
                      <span className="px-2 py-1 bg-accent/20 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-accent shadow-sm">Global</span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                    <p className="text-[10px] font-black text-white uppercase truncate mb-2">{asset.name}</p>
                    <div className="flex gap-2">
                      {asset.type === 'image' && (
                        <button 
                          onClick={() => {
                            setAiTab('edit');
                            setSelectedImageForAi(asset.data);
                          }}
                          className="flex-1 py-2 bg-white text-black text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-accent hover:text-white"
                        >
                          AI Edit
                        </button>
                      )}
                      {asset.creatorId === currentUser.id && (
                        <button 
                          onClick={() => deleteAsset(asset)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {displayAssets.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <span className="material-symbols-outlined text-6xl text-neutral-100">collections</span>
                  <p className="text-neutral-300 font-black uppercase tracking-[0.2em]">Gallery empty or no results</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-neutral-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-8 sticky top-10 overflow-hidden border border-white/5">
            <div className="relative z-10 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-8">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <h2 className="text-2xl font-black font-display uppercase tracking-tight">AI Studio</h2>
              </div>

              <div className="flex p-1 bg-white/5 rounded-2xl mb-8">
                <button onClick={() => setAiTab('generate')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aiTab === 'generate' ? 'bg-accent text-white' : 'text-neutral-500 hover:text-white'}`}>Create</button>
                <button onClick={() => setAiTab('edit')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aiTab === 'edit' ? 'bg-accent text-white' : 'text-neutral-500 hover:text-white'}`}>Edit</button>
              </div>

              {aiTab === 'edit' && (
                <div className="mb-8 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Target Asset</p>
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
                        <p className="text-[10px] font-bold text-neutral-600 uppercase">Select asset to refine</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={aiTab === 'generate' ? "e.g., A CrossFit athlete performing a clean and jerk in a dark box." : "e.g., Change the lighting to sunset and add neon accents."}
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
                    <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Modeling...</>
                  ) : (
                    <><span className="material-symbols-outlined">flare</span> Deploy AI</>
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

export default CoachMediaLibrary;
