
import React, { useState, useRef, useMemo } from 'react';
import { EXERCISE_LIBRARY } from '../../constants';
import { ExerciseTemplate, ExerciseFormat, MediaAsset, User, UserRole } from '../../types';

interface ExerciseLibraryProps {
  library: MediaAsset[];
  setLibrary: React.Dispatch<React.SetStateAction<MediaAsset[]>>;
  currentUser: User;
}

const CoachExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ library, setLibrary, currentUser }) => {
  const [exercises, setExercises] = useState<ExerciseTemplate[]>(EXERCISE_LIBRARY);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEx, setNewEx] = useState<Partial<ExerciseTemplate>>({ name: '', defaultFormat: 'REGULAR', description: '', isPublic: true });
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState<{ activeField: 'imageUrl' | 'videoUrl' | null }>({ activeField: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           ex.creatorName?.toLowerCase().includes(searchQuery.toLowerCase());
      const hasPermission = currentUser.role === UserRole.ADMIN || ex.isPublic || ex.creatorId === currentUser.id;
      return matchesSearch && hasPermission;
    });
  }, [exercises, currentUser, searchQuery]);

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

  const handleSave = () => {
    if (!newEx.name) return;
    
    if (editingId) {
      setExercises(exercises.map(ex => ex.id === editingId ? { ...ex, ...newEx } as ExerciseTemplate : ex));
    } else {
      const item: ExerciseTemplate = {
        id: Math.random().toString(36).substr(2, 9),
        name: newEx.name!,
        defaultFormat: (newEx.defaultFormat as ExerciseFormat) || 'REGULAR',
        description: newEx.description,
        imageUrl: newEx.imageUrl,
        videoUrl: newEx.videoUrl,
        isPublic: newEx.isPublic ?? true,
        creatorId: currentUser.id,
        creatorName: `${currentUser.firstName} ${currentUser.lastName}`
      };
      setExercises([...exercises, item]);
    }
    
    setIsAdding(false);
    setEditingId(null);
    setNewEx({ name: '', defaultFormat: 'REGULAR', description: '', isPublic: true });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isMediaPickerOpen.activeField) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result as string;
      const newAsset: MediaAsset = { 
        id: Math.random().toString(), 
        type: file.type.startsWith('video') ? 'video' : 'image', 
        data, 
        name: file.name,
        category: 'WORKOUT',
        createdAt: Date.now(),
        creatorId: currentUser.id,
        creatorName: `${currentUser.firstName} ${currentUser.lastName}`,
        isPublic: false
      };
      setLibrary([newAsset, ...library]);
      setNewEx({ ...newEx, [isMediaPickerOpen.activeField!]: data });
      setIsMediaPickerOpen({ activeField: null });
    };
    reader.readAsDataURL(file);
  };

  const selectAsset = (asset: MediaAsset) => {
    if (isMediaPickerOpen.activeField) {
      setNewEx({ ...newEx, [isMediaPickerOpen.activeField]: asset.data });
      setIsMediaPickerOpen({ activeField: null });
    }
  };

  const removeEx = (id: string) => {
    if (window.confirm("Delete this master Exercise from the library?")) {
      setExercises(exercises.filter(ex => ex.id !== id));
    }
  };

  return (
    <div className="space-y-12 text-left animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Exercise Library</h1>
          <p className="text-neutral-400 font-medium">Build your master pool of exercises with shared media assets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input 
              type="text" 
              placeholder="Search exercises..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-100 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold shadow-sm outline-none focus:border-black transition-all"
            />
          </div>
          <button 
            onClick={startAdding}
            className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            New Exercise
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayExercises.map((ex) => {
          const isOwner = currentUser.role === UserRole.ADMIN || ex.creatorId === currentUser.id;
          return (
            <div key={ex.id} className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-neutral-50 text-[10px] font-black uppercase tracking-widest rounded-lg border border-neutral-100">{ex.defaultFormat}</span>
                {isOwner && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => startEditing(ex)}
                      className="p-2 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-black hover:text-white transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button 
                      onClick={() => removeEx(ex.id)}
                      className="p-2 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
                  {ex.description || 'No guidance notes provided.'}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden mr-4">
                  <span className={`material-symbols-outlined text-[16px] shrink-0 ${ex.isPublic ? 'text-green-500' : 'text-neutral-300'}`}>
                    {ex.isPublic ? 'public' : 'lock_person'}
                  </span>
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-tight truncate max-w-[120px]">{ex.creatorName || 'Internal'}</p>
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
            <p className="text-neutral-300 font-black uppercase tracking-[0.2em]">No matching exercises found</p>
          </div>
        )}
      </div>

      {/* Builder Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="p-12 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div className="space-y-1 text-left">
                  <h3 className="text-3xl font-black font-display uppercase text-black">{editingId ? 'Refine Exercise' : 'New Master Exercise'}</h3>
                  <div className="flex items-center gap-3 mt-4 px-4 py-2 bg-white rounded-xl border border-neutral-100 w-fit">
                    <p className="text-[9px] font-black uppercase text-neutral-400">Public for all coaches?</p>
                    <div 
                        onClick={() => setNewEx({...newEx, isPublic: !newEx.isPublic})}
                        className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${newEx.isPublic ? 'bg-accent' : 'bg-neutral-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${newEx.isPublic ? 'translate-x-6' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsAdding(false)} className="w-14 h-14 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-10 no-scrollbar text-left">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Exercise Name</label>
                       <input 
                         type="text" 
                         value={newEx.name}
                         onChange={e => setNewEx({...newEx, name: e.target.value})}
                         placeholder="e.g. Kettlebell Swings"
                         className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-bold text-xl focus:border-black outline-none"
                       />
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Default Loading Style</label>
                         <select 
                           value={newEx.defaultFormat}
                           onChange={e => setNewEx({...newEx, defaultFormat: e.target.value as any})}
                           className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-bold outline-none appearance-none"
                         >
                            <option value="REGULAR">Regular Sets</option>
                            <option value="EMOM">EMOM</option>
                            <option value="AMRAP">AMRAP</option>
                            <option value="FOR_TIME">For Time</option>
                            <option value="SUPER_SET">Super Set</option>
                            <option value="DROP_SET">Drop Set</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Master Media Reference</label>
                         <div className="grid grid-cols-2 gap-4">
                           <button 
                             onClick={() => setIsMediaPickerOpen({ activeField: 'imageUrl' })}
                             className={`flex flex-col items-center justify-center gap-2 p-8 rounded-3xl transition-all shadow-sm ${
                               newEx.imageUrl ? 'bg-accent text-white' : 'bg-neutral-50 border border-neutral-100 text-neutral-400 hover:border-black hover:text-black'
                             }`}
                           >
                             <span className="material-symbols-outlined text-3xl">{newEx.imageUrl ? 'check_circle' : 'image'}</span>
                             <span className="text-[9px] font-black uppercase tracking-widest">{newEx.imageUrl ? 'Photo Attached' : 'Add Photo'}</span>
                           </button>
                           <button 
                             onClick={() => setIsMediaPickerOpen({ activeField: 'videoUrl' })}
                             className={`flex flex-col items-center justify-center gap-2 p-8 rounded-3xl transition-all shadow-sm ${
                               newEx.videoUrl ? 'bg-accent text-white' : 'bg-neutral-50 border border-neutral-100 text-neutral-400 hover:border-black hover:text-black'
                             }`}
                           >
                             <span className="material-symbols-outlined text-3xl">{newEx.videoUrl ? 'check_circle' : 'videocam'}</span>
                             <span className="text-[9px] font-black uppercase tracking-widest">{newEx.videoUrl ? 'Video Attached' : 'Add Video'}</span>
                           </button>
                         </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Standard Guidance</label>
                       <textarea 
                         rows={4}
                         value={newEx.description}
                         onChange={e => setNewEx({...newEx, description: e.target.value})}
                         placeholder="Technical cues and stimulus notes..."
                         className="w-full bg-neutral-50 border border-neutral-100 rounded-3xl p-6 text-sm font-medium resize-none focus:border-black outline-none"
                       />
                    </div>
                 </div>
              </div>

              <div className="p-12 bg-neutral-50 border-t border-neutral-100 flex gap-4">
                 <button onClick={() => setIsAdding(false)} className="flex-1 py-5 border border-neutral-200 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white">Cancel</button>
                 <button onClick={handleSave} className="flex-[2] py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-neutral-800 transition-all">
                    {editingId ? 'Save Exercise Changes' : 'Save Exercise to Library'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Shared Media Picker */}
      {isMediaPickerOpen.activeField && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left">
                 <div>
                    <h3 className="text-2xl font-black font-display uppercase tracking-tight">Select Exercise Asset</h3>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Master Library Source</p>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 shadow-lg"
                    >
                      <span className="material-symbols-outlined text-[18px]">upload</span> New Upload
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,video/mp4" />
                    </button>
                    <button onClick={() => setIsMediaPickerOpen({ activeField: null })} className="w-12 h-12 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 sm:grid-cols-4 gap-6 no-scrollbar text-center">
                 {library.filter(a => a.creatorId === currentUser.id || a.isPublic).map(asset => (
                    <div 
                       key={asset.id}
                       onClick={() => selectAsset(asset)}
                       className="group relative aspect-square rounded-[2rem] overflow-hidden border border-neutral-100 bg-neutral-50 cursor-pointer hover:ring-4 hover:ring-accent transition-all shadow-sm"
                    >
                       {asset.type === 'image' ? (
                          <img src={asset.data} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={asset.name} />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white">
                             <span className="material-symbols-outlined text-4xl">video_file</span>
                          </div>
                       )}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-[10px] font-black uppercase text-white tracking-widest px-4 py-2 bg-accent rounded-full">Apply to Master</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CoachExerciseLibrary;
