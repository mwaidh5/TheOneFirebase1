
import React from 'react';
import { Link } from 'react-router-dom';
import { COURSES, COACHES } from '../constants';

interface HomepageProps {
  settings: {
    heroImage: string;
    missionImage: string;
    heroHeadline: string;
    heroSubline: string;
  };
}

const Homepage: React.FC<HomepageProps> = ({ settings }) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="px-6 py-12 md:py-24 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex flex-col gap-8 flex-1 text-left">
            <div className="flex flex-col gap-6">
              <span className="inline-block px-4 py-1.5 rounded-full border border-black/10 bg-neutral-50 text-[10px] font-black tracking-[0.2em] uppercase w-fit">Elite Performance Hub</span>
              <h1 className="text-6xl md:text-8xl font-black leading-[0.95] tracking-tighter text-black font-display uppercase">
                {settings.heroHeadline.split(' ').slice(0, -1).join(' ')} <br /><span className="text-accent">{settings.heroHeadline.split(' ').pop()}</span>
              </h1>
              <p className="text-xl text-neutral-500 max-w-[520px] leading-relaxed font-medium">
                {settings.heroSubline}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/courses" className="flex items-center justify-center rounded-2xl h-16 px-10 bg-black text-white hover:bg-neutral-800 transition-all text-sm font-black uppercase tracking-widest shadow-2xl hover:-translate-y-1">
                View Courses
              </Link>
              <Link to="/coaches" className="flex items-center justify-center rounded-2xl h-16 px-10 border border-neutral-200 bg-white text-black hover:bg-neutral-50 transition-all text-sm font-black uppercase tracking-widest">
                Meet the Team
              </Link>
            </div>
          </div>
          <div className="w-full flex-1 aspect-square lg:aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative group">
            <img 
              src={settings.heroImage} 
              alt="Athlete" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Stats / Mission Section */}
      <section className="bg-neutral-50 border-y border-neutral-100 py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-left">
          <div className="space-y-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Our Core Mission</span>
            <h2 className="text-4xl md:text-6xl font-black leading-none text-black font-display uppercase tracking-tight">
              "To build a community of resilient individuals who support each other in the pursuit of excellence."
            </h2>
          </div>
          <div className="h-[500px] rounded-[3rem] overflow-hidden shadow-xl border border-white/10">
            <img src={settings.missionImage} className="w-full h-full object-cover" alt="Mission" />
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-xl transition-all space-y-6 text-left">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-accent">
              <span className="material-symbols-outlined text-3xl filled">monitoring</span>
            </div>
            <h3 className="text-2xl font-black font-display uppercase tracking-tight">Vitals Tracking</h3>
            <p className="text-neutral-500 leading-relaxed font-medium">Log your PRs, track body composition, and monitor recovery metrics in one unified dashboard.</p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-xl transition-all space-y-6 text-left">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined text-3xl filled">restaurant_menu</span>
            </div>
            <h3 className="text-2xl font-black font-display uppercase tracking-tight">Precision Fueling</h3>
            <p className="text-neutral-500 leading-relaxed font-medium">Get meal plans tailored to your training volume and caloric needs for optimal performance.</p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-xl transition-all space-y-6 text-left">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <span className="material-symbols-outlined text-3xl filled">groups</span>
            </div>
            <h3 className="text-2xl font-black font-display uppercase tracking-tight">Community Feed</h3>
            <p className="text-neutral-500 leading-relaxed font-medium">Share your wins, ask coaches questions, and connect with athletes from around the world.</p>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="text-left">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3 block">Training Tracks</span>
              <h2 className="text-black text-5xl font-black font-display uppercase tracking-tight">Elite Programming</h2>
            </div>
            <Link to="/courses" className="text-sm font-black uppercase tracking-widest text-black hover:text-accent transition-colors flex items-center gap-2">
              Browse All Programs <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          
          {COURSES.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {COURSES.map(course => (
                <Link key={course.id} to={`/courses/${course.id}`} className="group flex flex-col rounded-[2.5rem] border border-neutral-100 bg-white overflow-hidden hover:shadow-2xl transition-all duration-500">
                  <div className="h-72 overflow-hidden relative">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                    <div className="absolute top-6 left-6">
                      <span className="bg-white/90 backdrop-blur-md text-black text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">{course.category}</span>
                    </div>
                  </div>
                  <div className="p-10 flex flex-col gap-6 flex-grow text-left">
                    <div className="flex justify-between items-start">
                      <h3 className="text-black text-2xl font-bold leading-[1.1] font-display uppercase tracking-tight">{course.title}</h3>
                    </div>
                    <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2 font-medium">{course.description}</p>
                    <div className="mt-auto pt-8 flex items-center justify-between border-t border-neutral-50">
                      <span className="text-neutral-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">schedule</span> {course.duration}
                      </span>
                      <span className="font-black text-2xl text-black font-display">${course.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-neutral-100">
               <p className="text-neutral-300 font-black uppercase tracking-[0.3em]">No featured courses published yet</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto rounded-[4rem] bg-black p-12 md:p-24 relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
          <div className="relative z-10 space-y-10 max-w-3xl">
            <h2 className="text-5xl md:text-7xl font-black tracking-tight font-display uppercase leading-tight text-white">Ready to start <br /><span className="text-accent">your journey?</span></h2>
            <p className="text-xl text-neutral-400 font-medium">Join the next fundamentals intake and write your own story of resilience and performance.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <Link to="/courses" className="flex items-center justify-center rounded-2xl h-16 px-12 bg-white text-black hover:bg-neutral-200 text-sm font-black uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1">
                Start Training Today
              </Link>
            </div>
          </div>
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent/20 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
