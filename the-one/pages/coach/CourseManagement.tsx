
import React from 'react';
import { Link } from 'react-router-dom';
import { COURSES } from '../../constants';

const CoachCourses: React.FC = () => {
  // Mocking only courses for this specific coach
  const coachCourses = COURSES.filter(c => c.instructor === 'Alex Mercer');

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">My Programs</h1>
          <p className="text-neutral-400 font-medium">Manage and monitor your active training tracks.</p>
        </div>
        <Link to="/coach/courses/new" className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Create New Track
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {coachCourses.map(course => (
          <div key={course.id} className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-lg flex flex-col group">
            <div className="h-48 relative overflow-hidden">
              <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-4 right-4 flex gap-2">
                <Link to={`/coach/courses/edit/${course.id}`} className="bg-white/90 p-2 rounded-xl text-black hover:bg-white transition-all shadow-sm">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </Link>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{course.category}</span>
              </div>
            </div>
            <div className="p-8 flex flex-col flex-grow gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold font-display uppercase tracking-tight text-black">{course.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="material-symbols-outlined text-neutral-300 text-sm">schedule</span>
                     <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{course.duration}</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-black font-display">${course.price}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 py-6 border-y border-neutral-50">
                <div className="text-center">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Athletes</p>
                  <p className="text-lg font-black text-black">{course.enrollmentCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Rating</p>
                  <p className="text-lg font-black text-black">{course.rating}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xs font-black text-green-600 uppercase">Live</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Link to={`/coach/courses/edit/${course.id}`} className="flex-1 py-3 bg-neutral-50 text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-100 transition-all text-center">
                  Edit Track
                </Link>
                <button className="px-4 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-all shadow-md">
                   <span className="material-symbols-outlined text-lg">analytics</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty State / Add New Card */}
        <Link to="/coach/courses/new" className="bg-neutral-50 rounded-[2.5rem] border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center p-12 text-neutral-300 hover:border-black hover:text-black transition-all group min-h-[400px]">
           <span className="material-symbols-outlined text-6xl mb-4 group-hover:rotate-90 transition-transform duration-500">add</span>
           <p className="text-sm font-black uppercase tracking-[0.2em]">Build Another track</p>
        </Link>
      </div>
    </div>
  );
};

export default CoachCourses;
