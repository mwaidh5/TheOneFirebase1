
import React, { useState, useRef, useMemo } from 'react';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { MediaAsset, User } from '../../types';

interface MediaLibraryProps {
  library: MediaAsset[];
  setLibrary: React.Dispatch<React.SetStateAction<MediaAsset[]>>;
  currentUser: User;
}

const CoachMediaLibrary: React.FC<MediaLibraryProps> = ({ library, setLibrary, currentUser }) => {
  const [isUploading, setIsUploading] = useState(false);
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

      <div className="grid grid-cols-1 gap-10">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm min-h-[600px] flex flex-col">
            <h2 className="text-xl font-bold font-display uppercase tracking-tight flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-accent">gallery_thumbnail</span>
              Movement & Asset Gallery
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
                      {asset.creatorId === currentUser.id && (
                        <button 
                          onClick={() => deleteAsset(asset)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex-1 flex items-center justify-center"
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
      </div>
    </div>
  );
};

export default CoachMediaLibrary;
