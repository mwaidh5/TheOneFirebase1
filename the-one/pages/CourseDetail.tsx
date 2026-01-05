
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { COURSES, COACHES } from '../constants';
import { User } from '../types';

interface CourseDetailProps {
  currentUser: User | null;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const course = COURSES.find(c => c.id === id) || COURSES[0];
  
  // Simulation check
  const isOwned = currentUser?.id === 'u1' && id === 'crs1';
  
  const coach = COACHES.find(c => c.name.includes(course.instructor.split(' ')[0]));

  const handleCurriculumClick = (weekIdx: number) => {
    if (isOwned) {
      navigate(`/workout/${course.id}?week=${weekIdx + 1}`);
    } else {
      alert("You must enroll in this program to access its sessions.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-left animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-7/12 space-y-8">
          <div className="rounded-[3rem] overflow-hidden aspect-video shadow-2xl relative group">
            <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">{course.category}</span>
              {isOwned && (
                <span className="bg-green-500 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs filled">verified</span> Owned & Active
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-display uppercase tracking-tight text-black leading-none">{course.title}</h1>
            <p className="text-xl text-neutral-500 leading-relaxed font-medium">{course.description}</p>
          </div>

          <div className="pt-10 space-y-12">
            <div>
              <h2 className="text-2xl font-black font-display uppercase mb-8 tracking-tight">Program Curriculum</h2>
              <div className="space-y-4">
                {(course.weeks || [1, 2, 3, 4, 5, 6]).map((week, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleCurriculumClick(idx)}
                    className="flex items-center justify-between p-8 bg-neutral-50 rounded-[2rem] border border-neutral-100 group cursor-pointer hover:border-black hover:bg-white transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <span className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-sm font-black border border-neutral-100 shadow-sm">{idx + 1}</span>
                      <div>
                        <p className="font-black text-black uppercase tracking-tight">Week {idx + 1}: {typeof week === 'number' ? 'Foundations' : (week as any).days?.[0]?.title || 'Foundations'}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                          {typeof week === 'number' ? '7 Lessons' : `${(week as any).days?.length || 0} Sessions`} • Elite Coaching
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-neutral-300 group-hover:text-black transition-colors">{isOwned ? 'play_circle' : 'lock'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-5/12">
          <div className="sticky top-28 bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-2xl space-y-10">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Track Investment</p>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-black text-black font-display">${course.price}</span>
              </div>
            </div>

            <div className="space-y-4">
              {!isOwned ? (
                <button 
                  onClick={() => navigate(`/checkout?courseId=${course.id}`)}
                  className="block w-full text-center py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-neutral-800 transition-all shadow-xl hover:-translate-y-1"
                >
                  Enroll Track Now
                </button>
              ) : (
                <div className="space-y-4 animate-in zoom-in-95 duration-300">
                  <Link to={`/workout/${course.id}`} className="block w-full text-center py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-neutral-800 transition-all shadow-xl">
                    Resume Training
                  </Link>
                  <button 
                    onClick={() => coach && navigate(`/profile/messages?coachId=${coach.id}`)}
                    className="block w-full text-center py-5 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined filled">chat</span>
                    Message Coach
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
