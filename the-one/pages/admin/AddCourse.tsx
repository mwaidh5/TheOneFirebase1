
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { COURSES } from '../../constants';

const AdminAddCourse: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: 'Endurance',
    level: 'Intermediate',
    price: 149,
    duration: '6 Weeks',
    instructor: 'Alex Mercer',
    image: ''
  });

  const [exercises, setExercises] = useState([
    { id: '1', name: '', sets: 3, reps: '10', rest: '60s', imageUrl: '', videoUrl: '' }
  ]);

  useEffect(() => {
    if (isEdit) {
      const existing = COURSES.find(c => c.id === id);
      if (existing) {
        setCourseData({
          title: existing.title,
          description: existing.description,
          category: existing.category,
          level: existing.level,
          price: existing.price,
          duration: existing.duration,
          instructor: existing.instructor,
          image: existing.image
        });
      }
    }
  }, [id, isEdit]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'course' | 'exercise_img' | 'exercise_vid', index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'course') {
        setCourseData({ ...courseData, image: base64String });
      } else if (index !== undefined) {
        const newExercises = [...exercises];
        if (target === 'exercise_img') newExercises[index].imageUrl = base64String;
        if (target === 'exercise_vid') newExercises[index].videoUrl = base64String;
        setExercises(newExercises);
      }
    };
    reader.readAsDataURL(file);
  };

  const addExercise = () => {
    setExercises([...exercises, { 
      id: Math.random().toString(), 
      name: '', sets: 3, reps: '10', rest: '60s', imageUrl: '', videoUrl: '' 
    }]);
  };

  const removeExercise = (exId: string) => {
    setExercises(exercises.filter(e => e.id !== exId));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="space-y-1">
        <button onClick={() => navigate('/admin/courses')} className="flex items-center gap-2 text-neutral-400 hover:text-black text-xs font-black uppercase tracking-widest mb-6 transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Courses
        </button>
        <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">
          {isEdit ? 'Update Training Track' : 'Create New Track'}
        </h1>
        <p className="text-neutral-400 font-medium">Upload local media and design your elite curriculum.</p>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-12">
        {/* Core Info */}
        <section className="space-y-10">
           <h2 className="text-lg font-black uppercase tracking-widest text-black border-l-4 border-accent pl-4">1. Track Identity</h2>
           
           <div className="relative group">
              <label className="block w-full h-64 rounded-[2rem] bg-neutral-50 border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-300 gap-1 cursor-pointer hover:border-black hover:text-black transition-all overflow-hidden">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'course')} />
                {courseData.image ? (
                  <img src={courseData.image} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Course Cover</span>
                    <span className="text-[10px] opacity-50 font-bold uppercase mt-2">Internal Storage (JPG/PNG)</span>
                  </>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest">
                   Replace Media
                </div>
              </label>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2 md:col-span-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Program Name</label>
               <input 
                 type="text" 
                 value={courseData.title}
                 onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                 placeholder="e.g., Strength Engine" 
                 className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black font-bold focus:ring-2 focus:ring-black outline-none text-xl" 
               />
             </div>
             {/* ... Other fields same as before ... */}
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Category</label>
               <select 
                 value={courseData.category}
                 onChange={(e) => setCourseData({...courseData, category: e.target.value})}
                 className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black font-bold focus:ring-2 focus:ring-black outline-none appearance-none"
               >
                 <option>Endurance</option>
                 <option>Weightlifting</option>
                 <option>Gymnastics</option>
                 <option>Nutrition</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Lead Instructor</label>
               <select 
                 value={courseData.instructor}
                 onChange={(e) => setCourseData({...courseData, instructor: e.target.value})}
                 className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black font-bold focus:ring-2 focus:ring-black outline-none appearance-none"
               >
                 <option>Alex Mercer</option>
                 <option>Sarah Jenkins</option>
                 <option>Mike Ross</option>
               </select>
             </div>
           </div>
        </section>

        {/* Exercise Builder */}
        <section className="space-y-8">
          <div className="flex justify-between items-center">
             <h2 className="text-lg font-black uppercase tracking-widest text-black border-l-4 border-accent pl-4">2. Movement Library</h2>
             <button onClick={addExercise} className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 hover:bg-accent/5 px-4 py-2 rounded-full transition-all">
                <span className="material-symbols-outlined text-lg">add_circle</span> Add Movement
             </button>
          </div>
          
          <div className="space-y-6">
            {exercises.map((ex, index) => (
              <div key={ex.id} className="p-8 bg-neutral-50 rounded-3xl border border-neutral-100 space-y-6 relative group animate-in slide-in-from-bottom-2 duration-300 shadow-sm">
                <button onClick={() => removeExercise(ex.id)} className="absolute top-6 right-6 text-neutral-300 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined">delete</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300">Exercise Name</label>
                      <input type="text" placeholder="e.g. Snatch Pull" className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-bold text-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1 text-center">
                        <label className="text-[10px] font-bold uppercase text-neutral-300">Sets</label>
                        <input type="number" defaultValue={ex.sets} className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-black text-center" />
                      </div>
                      <div className="space-y-1 text-center">
                        <label className="text-[10px] font-bold uppercase text-neutral-300">Reps</label>
                        <input type="text" defaultValue={ex.reps} className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-black text-center" />
                      </div>
                      <div className="space-y-1 text-center">
                        <label className="text-[10px] font-bold uppercase text-neutral-300">Rest</label>
                        <input type="text" defaultValue={ex.rest} className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-black text-center" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Exercise Image Upload */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300">Visual Ref (Image)</label>
                      <label className="flex items-center gap-3 p-3 bg-white border border-neutral-100 rounded-xl cursor-pointer hover:border-black transition-all">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'exercise_img', index)} />
                        <span className="material-symbols-outlined text-neutral-300">{ex.imageUrl ? 'check_circle' : 'image'}</span>
                        <span className="text-[10px] font-bold uppercase truncate">{ex.imageUrl ? 'Image Saved' : 'Select File'}</span>
                      </label>
                    </div>
                    {/* Exercise Video Upload */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300">Form Demo (Video)</label>
                      <label className="flex items-center gap-3 p-3 bg-white border border-neutral-100 rounded-xl cursor-pointer hover:border-black transition-all">
                        <input type="file" accept="video/mp4" className="hidden" onChange={(e) => handleFileUpload(e, 'exercise_vid', index)} />
                        <span className="material-symbols-outlined text-neutral-300">{ex.videoUrl ? 'check_circle' : 'videocam'}</span>
                        <span className="text-[10px] font-bold uppercase truncate">{ex.videoUrl ? 'Video Saved' : 'Select MP4'}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-6 border-t border-neutral-100 flex gap-4">
           <button onClick={() => navigate('/admin/courses')} className="flex-1 py-5 border border-neutral-200 text-neutral-400 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-neutral-50 transition-all">
             Cancel
           </button>
           <button className="flex-[2] py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-neutral-800 shadow-xl transition-all">
             {isEdit ? 'Save Changes' : 'Publish Program'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAddCourse;
