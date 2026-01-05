
import React from 'react';
import { Link } from 'react-router-dom';
import { COURSES } from '../../constants';

const AdminCourses: React.FC = () => {
  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Training Programs</h1>
          <p className="text-neutral-400 font-medium">Create, edit, and publish training courses.</p>
        </div>
        <Link to="/admin/courses/new" className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          New Course
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {COURSES.map(course => (
          <div key={course.id} className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-lg flex flex-col group">
            <div className="h-48 relative overflow-hidden">
              <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-4 right-4 flex gap-2">
                <Link to={`/admin/courses/edit/${course.id}`} className="bg-white/90 p-2 rounded-xl text-black hover:bg-white transition-all shadow-sm">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </Link>
                <button className="bg-red-500/90 p-2 rounded-xl text-white hover:bg-red-600 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{course.category}</span>
              </div>
            </div>
            <div className="p-8 flex flex-col flex-grow gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold font-display uppercase tracking-tight text-black">{course.title}</h3>
                  <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Instructor: {course.instructor}</p>
                </div>
                <p className="text-2xl font-black text-black font-display">${course.price}</p>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">{course.description}</p>
              <div className="mt-auto grid grid-cols-2 gap-4 pt-6 border-t border-neutral-50">
                <div className="flex items-center gap-3 text-neutral-400">
                  <span className="material-symbols-outlined text-lg">group</span>
                  <p className="text-xs font-bold uppercase tracking-widest">{course.enrollmentCount} Athletes</p>
                </div>
                <div className="flex items-center gap-3 text-neutral-400">
                  <span className="material-symbols-outlined text-lg">star</span>
                  <p className="text-xs font-bold uppercase tracking-widest">{course.rating} Rating</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCourses;
