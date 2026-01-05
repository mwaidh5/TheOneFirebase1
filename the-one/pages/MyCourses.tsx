
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COURSES, COACHES } from '../constants';

const MyCourses: React.FC = () => {
  const navigate = useNavigate();

  // Simulation: User Alex owns crs1. 
  // We filter courses that the user "owns" based on simulation ID or check if purchase flag exists
  const isEnrolledInDefault = true; // In a real app, this is fetched from a database
  const ownedCourses = isEnrolledInDefault ? COURSES.filter(c => c.id === 'crs1') : [];

  const handleMessageCoach = (instructorName: string) => {
    const coach = COACHES.find(c => c.name.includes(instructorName.split(' ')[0]));
    if (coach) {
      navigate(`/profile/messages?coachId=${coach.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-left animate-in fade-in duration-500 min-h-[80vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="space-y-2">
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Athlete Headquarters</span>
          <h1 className="text-5xl font-black tracking-tight text-black font-display uppercase">My Enrolled Tracks</h1>
          <p className="text-neutral-400 font-medium max-w-xl">Continue your progression across your personalized training and educational cycles.</p>
        </div>
        <Link to="/courses" className="px-8 py-4 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">explore</span>
          Browse All Programs
        </Link>
      </div>

      {ownedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {ownedCourses.map(course => (
            <div key={course.id} className="bg-white rounded-[3rem] overflow-hidden border border-neutral-100 shadow-sm group hover:shadow-2xl transition-all duration-500 flex flex-col relative">
              <div className="relative h-64 overflow-hidden shrink-0">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-6 left-6 flex gap-2">
                  <span className="bg-white/90 backdrop-blur-md text-black text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">{course.category}</span>
                  <span className="bg-green-500 text-white text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">Enrolled</span>
                </div>
                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-lg">
                    <img src={COACHES.find(c => c.name.includes(course.instructor.split(' ')[0]))?.avatar} alt="Coach" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Lead: {course.instructor}</span>
                </div>
              </div>
              
              <div className="p-10 space-y-8 flex-grow flex flex-col">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-black uppercase tracking-tight font-display leading-tight">{course.title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Progress</span>
                      <span className="text-sm font-black text-black">65%</span>
                    </div>
                    <div className="w-full bg-neutral-50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-black h-full w-[65%] rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 flex gap-3">
                   <Link to={`/workout/${course.id}`} className="flex-1 bg-black text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all text-center shadow-lg">
                      Resume Training
                   </Link>
                   <button 
                     onClick={() => handleMessageCoach(course.instructor)}
                     className="px-4 py-4 bg-neutral-50 text-neutral-400 rounded-xl hover:bg-accent hover:text-white transition-all border border-neutral-100 flex items-center justify-center group"
                   >
                     <span className="material-symbols-outlined text-[18px] filled">chat</span>
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-neutral-50 rounded-[2rem] flex items-center justify-center text-neutral-200">
            <span className="material-symbols-outlined text-4xl">school</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase text-neutral-400 tracking-tight">No active enrollments</h2>
            <p className="text-neutral-400 font-medium max-w-sm">Browse our training tracks to start your path to elite performance.</p>
          </div>
          <Link to="/courses" className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-neutral-800 transition-all">
            Explore Programs
          </Link>
        </div>
      )}
    </div>
  );
};

/* Added missing default export */
export default MyCourses;
