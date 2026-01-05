
import React from 'react';
import { COURSES, COACHES } from '../../constants';

const SupportCourseCatalog: React.FC = () => {
  return (
    <div className="text-left space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="space-y-1">
        <h1 className="text-4xl font-black font-display uppercase text-black leading-none tracking-tight">Global Catalog</h1>
        <p className="text-neutral-400 font-medium">Standardized training tracks available for immediate enrollment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {COURSES.map(course => (
          <div key={course.id} className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group">
            <div className="h-48 relative overflow-hidden shrink-0">
               <img src={course.image} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="" />
               <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[8px] font-black uppercase tracking-widest">{course.category}</div>
            </div>
            <div className="p-8 flex flex-col flex-grow space-y-6">
               <div className="space-y-2">
                  <h3 className="text-xl font-black text-black uppercase tracking-tight leading-tight">{course.title}</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Lead Coach:</span>
                     <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{course.instructor}</span>
                  </div>
               </div>
               
               <p className="text-xs text-neutral-500 font-medium leading-relaxed italic border-l-2 border-neutral-100 pl-4">"{course.description}"</p>

               <div className="grid grid-cols-2 gap-4 py-4 border-t border-neutral-50">
                  <div>
                    <p className="text-[8px] font-black text-neutral-300 uppercase mb-1">Duration</p>
                    <p className="text-sm font-black text-black">{course.duration}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-neutral-300 uppercase mb-1">Standard Price</p>
                    <p className="text-sm font-black text-accent">${course.price}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-neutral-300 uppercase mb-1">Enrollment</p>
                    <p className="text-sm font-black text-black">{course.enrollmentCount}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-neutral-300 uppercase mb-1">Skill Level</p>
                    <p className="text-sm font-black text-black">{course.level}</p>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupportCourseCatalog;
