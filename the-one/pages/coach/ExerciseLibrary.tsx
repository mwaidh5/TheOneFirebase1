
import React, { useState, useRef, useMemo } from 'react';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExerciseTemplate, ExerciseFormat, MediaAsset, User, UserRole } from '../../types';
import heic2any from 'heic2any';
import { useT } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';

const FORMAT_LABELS: Record<string, TranslationKey> = {
  REGULAR: 'coach.format.regular',
  EMOM: 'coach.format.emom',
  SUPER_SET: 'coach.format.super_set',
  CIRCUIT: 'coach.format.circuit',
  DROP_SET: 'coach.format.drop_set',
  AMRAP: 'coach.format.amrap',
  FOR_TIME: 'coach.format.for_time',
  HIIT: 'coach.format.hiit',
  CARDIO: 'coach.format.cardio',
  MAX_EFFORT: 'coach.format.max_effort',
  HOLD: 'coach.format.hold',
};

interface ExerciseLibraryProps {
  library: MediaAsset[];
  currentUser: User;
  exerciseLibrary: ExerciseTemplate[];
}

const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        } else {
            reject(new Error("Canvas context failed"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const CoachExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ library, currentUser, exerciseLibrary }) => {
  const { t } = useT();
  const formatLabel = (f?: string) => (f && FORMAT_LABELS[f] ? t(FORMAT_LABELS[f]) : f || '');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEx, setNewEx] = useState<Partial<ExerciseTemplate>>({ name: '', defaultFormat: 'REGULAR', description: '', isPublic: true });
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState<{ activeField: 'imageUrl' | 'videoUrl' | null }>({ activeField: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayExercises = useMemo(() => {
    return exerciseLibrary.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           ex.creatorName?.toLowerCase().includes(searchQuery.toLowerCase());
      // Strict filtering: Only Admin sees all; Coach sees only their own.
      const hasPermission = currentUser.role === UserRole.ADMIN || ex.creatorId === currentUser.id || ex.isPublic === true;
      return matchesSearch && hasPermission;
    });
  }, [exerciseLibrary, currentUser, searchQuery]);

  const startAdding = () => {
    setEditingId(null);
    setNewEx({ name: '', defaultFormat: 'REGULAR', description: '', isPublic: true });
    setIsAdding(true);
  };

  const startEditing = (ex: ExerciseTemplate) => {
    setEditingId(ex.id);
    setNewEx({ ...ex });
    setIsAdding(true);
  };

  const cleanObject = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(cleanObject);
    if (typeof obj === 'object' && obj !== null) {
      const res: any = {};
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (val !== undefined) {
          res[key] = cleanObject(val);
        }
      });
      return res;
    }
    return obj;
  };

  const handleSave = async () => {
    if (!newEx.name) return;
    
    const id = editingId || Math.random().toString(36).substr(2, 9);
    
    // Explicitly handle all fields
    const item: ExerciseTemplate = {
      id,
      name: newEx.name || '',
      defaultFormat: (newEx.defaultFormat as ExerciseFormat) || 'REGULAR',
      description: newEx.description || '',
      imageUrl: newEx.imageUrl || undefined,
      videoUrl: newEx.videoUrl || undefined,
      isPublic: newEx.isPublic ?? true,
      creatorId: newEx.creatorId || currentUser.id,
      creatorName: newEx.creatorName || `${currentUser.firstName} ${currentUser.lastName}`
    };

    const finalItem = cleanObject(item);

    try {
      await setDoc(doc(db, 'exercises', id), finalItem);
      // Alert removed
      setIsAdding(false);
      setEditingId(null);
      setNewEx({ name: '', defaultFormat: 'REGULAR', description: '', isPublic: true });
    } catch (error) {
      console.error("Error saving exercise:", error);
      alert(t('coach.exercises.save_failed'));
    }
  };

  const uploadMedia = async (dataUrl: string, type: 'image' | 'video', fileName: string) => {
      const assetId = Math.random().toString(36).substr(2, 9);
      const newAsset: MediaAsset = { 
        id: assetId, 
        type: type, 
        data: dataUrl, 
        name: fileName,
        category: 'WORKOUT',
        createdAt: Date.now(),
        creatorId: currentUser.id,
        creatorName: `${currentUser.firstName} ${currentUser.lastName}`,
        isPublic: false
      };
      
      try {
        console.log("Uploading media asset...", assetId);
        await setDoc(doc(db, 'media', assetId), newAsset);
        console.log("Media asset uploaded successfully.");
        
        // Update the state to reflect the new image immediately in the UI
        setNewEx(prev => ({ ...prev, [isMediaPickerOpen.activeField!]: dataUrl }));
        
        // Close the picker
        setIsMediaPickerOpen({ activeField: null });
        
      } catch (error: any) {
        console.error("Error uploading media:", error);
        alert(t('coach.media.upload_failed', { msg: error.message }));
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file || !isMediaPickerOpen.activeField) return;

    // Handle HEIC
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        try {
            const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.7 });
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            file = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
        } catch (err) {
            console.error("HEIC conversion failed", err);
            // Continue with original file if conversion fails (might be handled by canvas if supported)
        }
    }

    if (file.type.startsWith('image/')) {
        try {
            // Compress to max width 800px, quality 0.7
            const compressedDataUrl = await compressImage(file, 800, 0.7);
            uploadMedia(compressedDataUrl, 'image', file.name);
        } catch (err) {
            console.error("Compression failed", err);
            alert(t('coach.media.process_failed'));
        }
    } else if (file.type.startsWith('video/')) {
        // Video check - Limit to ~750KB for Firestore
        if (file.size > 750 * 1024) { 
             alert(t('coach.media.video_too_large'));
             return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
             uploadMedia(reader.result as string, 'video', file.name);
        };
        reader.readAsDataURL(file);
    } else {
        alert(t('coach.media.unsupported_type'));
    }
  };

  const selectAsset = (asset: MediaAsset) => {
    if (isMediaPickerOpen.activeField) {
      setNewEx({ ...newEx, [isMediaPickerOpen.activeField]: asset.data });
      setIsMediaPickerOpen({ activeField: null });
    }
  };

  const removeEx = async (id: string) => {
    if (window.confirm(t('coach.exercises.confirm_delete'))) {
      try {
        await deleteDoc(doc(db, 'exercises', id));
        // Alert removed
      } catch (error) {
        console.error("Error removing exercise:", error);
        alert(t('coach.exercises.remove_failed'));
      }
    }
  };

  return (
    <div className="space-y-12 text-start animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">{t('coach.exercises.title')}</h1>
          <p className="text-neutral-400 font-medium">{t('coach.exercises.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input 
              type="text" 
              placeholder={t('coach.exercises.search_placeholder')} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-100 rounded-2xl py-3.5 ps-12 pe-6 text-sm font-bold shadow-sm outline-none focus:border-black transition"
            />
          </div>
          <button 
            onClick={startAdding}
            className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition shadow-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            {t('coach.exercises.new')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayExercises.map((ex) => {
          const isOwner = currentUser.role === UserRole.ADMIN || ex.creatorId === currentUser.id;
          return (
            <div key={ex.id} className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm hover:shadow-2xl transition group relative overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-neutral-50 text-[10px] font-black uppercase tracking-widest rounded-lg border border-neutral-100">{formatLabel(ex.defaultFormat)}</span>
                {isOwner && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => startEditing(ex)}
                      aria-label={t('common.edit')}
                      title={t('common.edit')}
                      className="p-2 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-black hover:text-white transition shadow-sm"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button 
                      onClick={() => removeEx(ex.id)}
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                      className="p-2 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-red-500 hover:text-white transition shadow-sm"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 flex-grow">
                <h3 className="text-2xl font-black text-black uppercase tracking-tight leading-none">{ex.name}</h3>
                {ex.imageUrl && (
                  <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-inner bg-neutral-100 border border-neutral-100 mb-2">
                     <img src={ex.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
                <p className="text-sm text-neutral-400 font-medium line-clamp-3 italic leading-relaxed">
                  {ex.description || t('coach.exercises.no_notes')}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden me-4">
                  <span className={`material-symbols-outlined text-[16px] shrink-0 ${ex.isPublic ? 'text-green-500' : 'text-neutral-300'}`}>
                    {ex.isPublic ? 'public' : 'lock_person'}
                  </span>
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-tight truncate max-w-[120px]">{ex.creatorName || t('coach.exercises.internal')}</p>
                </div>
                 <div className="flex items-center gap-3 shrink-0">
                    <div className={`flex items-center gap-1 ${ex.imageUrl ? 'text-accent' : 'text-neutral-200'}`}>
                      <span className="material-symbols-outlined text-[18px]">image</span>
                    </div>
                    <div className={`flex items-center gap-1 ${ex.videoUrl ? 'text-accent' : 'text-neutral-200'}`}>
                      <span className="material-symbols-outlined text-[18px]">movie</span>
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
        {displayExercises.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-neutral-100">search_off</span>
            <p className="text-neutral-300 font-black uppercase tracking-[0.2em]">{t('coach.exercises.empty')}</p>
          </div>
        )}
      </div>

      {/* Builder Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="p-12 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div className="space-y-1 text-start">
                  <h3 className="text-3xl font-black font-display uppercase text-black">{editingId ? t('coach.exercises.edit_title') : t('coach.exercises.new_title')}</h3>
                  <div className="flex items-center gap-3 mt-4 px-4 py-2 bg-white rounded-xl border border-neutral-100 w-fit">
                    <p className="text-[9px] font-black uppercase text-neutral-400">{t('coach.exercises.public_q')}</p>
                    <div 
                        onClick={() => setNewEx({...newEx, isPublic: !newEx.isPublic})}
                        className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${newEx.isPublic ? 'bg-accent' : 'bg-neutral-200'}`}
                      >
                        <div className={`absolute top-1 start-0 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${newEx.isPublic ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'}`}></div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsAdding(false)} aria-label={t('common.close')} className="w-14 h-14 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition shadow-sm">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-10 no-scrollbar text-start">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ms-1">{t('coach.exercises.name')}</label>
                       <input 
                         type="text" 
                         value={newEx.name}
                         onChange={e => setNewEx({...newEx, name: e.target.value})}
                         placeholder={t('coach.exercises.name_placeholder')}
                         className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-bold text-xl focus:border-black outline-none"
                       />
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ms-1">{t('coach.exercises.default_style')}</label>
                         <select 
                           value={newEx.defaultFormat}
                           onChange={e => setNewEx({...newEx, defaultFormat: e.target.value as any})}
                           className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-bold outline-none appearance-none"
                         >
                            <option value="REGULAR">{t('coach.format.regular')}</option>
                            <option value="EMOM">{t('coach.format.emom')}</option>
                            <option value="AMRAP">{t('coach.format.amrap')}</option>
                            <option value="FOR_TIME">{t('coach.format.for_time')}</option>
                            <option value="SUPER_SET">{t('coach.format.super_set')}</option>
                            <option value="DROP_SET">{t('coach.format.drop_set')}</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ms-1">{t('coach.exercises.media_ref')}</label>
                         <div className="grid grid-cols-2 gap-4">
                           <button 
                             onClick={() => setIsMediaPickerOpen({ activeField: 'imageUrl' })}
                             className={`flex flex-col items-center justify-center gap-2 p-8 rounded-3xl transition shadow-sm ${
                               newEx.imageUrl ? 'bg-accent text-white' : 'bg-neutral-50 border border-neutral-100 text-neutral-400 hover:border-black hover:text-black'
                             }`}
                           >
                             <span className="material-symbols-outlined text-3xl">{newEx.imageUrl ? 'check_circle' : 'image'}</span>
                             <span className="text-[9px] font-black uppercase tracking-widest">{newEx.imageUrl ? t('coach.exercises.photo_attached') : t('coach.exercises.add_photo')}</span>
                           </button>
                           <button 
                             onClick={() => setIsMediaPickerOpen({ activeField: 'videoUrl' })}
                             className={`flex flex-col items-center justify-center gap-2 p-8 rounded-3xl transition shadow-sm ${
                               newEx.videoUrl ? 'bg-accent text-white' : 'bg-neutral-50 border border-neutral-100 text-neutral-400 hover:border-black hover:text-black'
                             }`}
                           >
                             <span className="material-symbols-outlined text-3xl">{newEx.videoUrl ? 'check_circle' : 'videocam'}</span>
                             <span className="text-[9px] font-black uppercase tracking-widest">{newEx.videoUrl ? t('coach.exercises.video_attached') : t('coach.exercises.add_video')}</span>
                           </button>
                         </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ms-1">{t('coach.exercises.guidance')}</label>
                       <textarea 
                         rows={4}
                         value={newEx.description}
                         onChange={e => setNewEx({...newEx, description: e.target.value})}
                         placeholder={t('coach.exercises.guidance_placeholder')}
                         className="w-full bg-neutral-50 border border-neutral-100 rounded-3xl p-6 text-sm font-medium resize-none focus:border-black outline-none"
                       />
                    </div>
                 </div>
              </div>

              <div className="p-12 bg-neutral-50 border-t border-neutral-100 flex gap-4">
                 <button onClick={() => setIsAdding(false)} className="flex-1 py-5 border border-neutral-200 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white">{t('common.cancel')}</button>
                 <button onClick={handleSave} className="flex-[2] py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-neutral-800 transition">
                    {editingId ? t('coach.exercises.save_changes') : t('coach.exercises.save_new')}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Shared Media Picker */}
      {isMediaPickerOpen.activeField && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-start">
                 <div>
                    <h3 className="text-2xl font-black font-display uppercase tracking-tight">{t('coach.exercises.select_asset')}</h3>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('coach.exercises.library_source')}</p>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition flex items-center gap-2 shadow-lg"
                    >
                      <span className="material-symbols-outlined text-[18px]">upload</span> {t('coach.media.new_upload')}
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,video/mp4" />
                    </button>
                    <button onClick={() => setIsMediaPickerOpen({ activeField: null })} aria-label={t('common.close')} className="w-12 h-12 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-sm">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 sm:grid-cols-4 gap-6 no-scrollbar text-center">
                 {library.filter(a => a.creatorId === currentUser.id || (currentUser.role === UserRole.ADMIN && a.isPublic)).map(asset => (
                    <div 
                       key={asset.id}
                       onClick={() => selectAsset(asset)}
                       className="group relative aspect-square rounded-[2rem] overflow-hidden border border-neutral-100 bg-neutral-50 cursor-pointer hover:ring-4 hover:ring-accent transition shadow-sm"
                    >
                       {asset.type === 'image' ? (
                          <img src={asset.data} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={asset.name} />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white">
                             <span className="material-symbols-outlined text-4xl">video_file</span>
                          </div>
                       )}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-[10px] font-black uppercase text-white tracking-widest px-4 py-2 bg-accent rounded-full">{t('coach.exercises.apply_master')}</span>
                       </div>
                    </div>
                 ))}
                 {library.filter(a => a.creatorId === currentUser.id || (currentUser.role === UserRole.ADMIN && a.isPublic)).length === 0 && <p className="col-span-full text-center text-xs text-neutral-400 py-10">{t('coach.media.none_found')}</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CoachExerciseLibrary;
