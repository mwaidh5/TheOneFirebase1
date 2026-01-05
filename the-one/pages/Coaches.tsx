
import React from 'react';
import { Link } from 'react-router-dom';
import { COACHES } from '../constants';

const Coaches: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-left pb-40">
      <div className="space-y-6 mb-24">
        <span className="inline-block px-4 py-1.5 rounded-full border border-black/10 bg-neutral-50 text-[10px] font-black tracking-[0.2em] uppercase w-fit">The IronPulse Faculty</span>
        <h1 className="text-6xl md:text-8xl font-black font-display uppercase tracking-tight text-black leading-[0.9]">Meet the <br /><span className="text-accent">Architects.</span></h1>
        <p className="text-xl text-neutral-500 max-w-2xl font-medium leading-relaxed">
          Learn from elite professionals who have built athletes from the ground up. Our staff combines deep competitive history with advanced physiological data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
        {COACHES.map(coach => (
          <Link key={coach.id} to={`/coaches/${coach.id}`} className="group flex flex-col gap-10">
            {/* Massive Image Container */}
            <div className="relative overflow-hidden rounded-[3.5rem] aspect-[3/4] shadow-2xl transition-all group-hover:shadow-[0_40px_100px_rgba(0,0,0,0.2)]">
              <img src={coach.avatar} alt={coach.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
              
              {/* Bespoke Availability Badge */}
              {coach.isBespokeAuthorized && (
                <div className="absolute top-10 right-10 flex items-center gap-2 bg-white/20 backdrop-blur-2xl border border-white/30 px-5 py-2.5 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-700">
                  <span className="material-symbols-outlined text-white text-lg filled">architecture</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Offers Custom Coaching</span>
                </div>
              )}

              <div className="absolute bottom-12 left-12 right-12 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">{coach.title}</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-white">
                     <span className="material-symbols-outlined text-[14px] filled text-yellow-400">star</span>
                     <span className="text-[10px] font-black">{coach.rating}</span>
                  </div>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-white font-display uppercase leading-none tracking-tighter group-hover:text-accent transition-colors">{coach.name}</h2>
              </div>
            </div>

            {/* Coach Details Below Image */}
            <div className="px-6 grid grid-cols-2 gap-12 border-l-4 border-neutral-100 group-hover:border-accent transition-colors">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Primary Modality</p>
                <p className="text-xl font-black text-black uppercase tracking-tight">{coach.specialization}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Experience</p>
                <p className="text-xl font-black text-black uppercase tracking-tight">{coach.experience}</p>
              </div>
              <div className="col-span-2">
                <p className="text-neutral-500 font-medium leading-relaxed italic line-clamp-2">"{coach.bio}"</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bespoke CTA Section */}
      <div className="mt-40">
        <div className="bg-black rounded-[4rem] p-12 md:p-24 text-white relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="relative z-10 max-w-2xl space-y-10">
            <div className="space-y-4">
              <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black tracking-[0.2em] uppercase w-fit text-accent">Personalized Programming</span>
              <h2 className="text-5xl md:text-7xl font-black font-display uppercase tracking-tight leading-[0.95]">
                Need Custom <br />Coaching?
              </h2>
              <p className="text-xl text-neutral-400 font-medium leading-relaxed">
                Connect with our head architects to build a bespoke training cycle designed exclusively for your biomechanics and competitive objectives.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent shadow-inner">
                  <span className="material-symbols-outlined text-xl">architecture</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest">1:1 Programming</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent shadow-inner">
                  <span className="material-symbols-outlined text-xl">reviews</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest">Video Feedback</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent shadow-inner">
                  <span className="material-symbols-outlined text-xl">query_stats</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest">Weekly Audits</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 shrink-0">
             <Link to="/custom-course" className="h-24 px-12 bg-white text-black rounded-[2.5rem] flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-accent hover:text-white transition-all shadow-2xl hover:-translate-y-2">
                Purchase a Custom Plan
                <span className="material-symbols-outlined text-2xl">arrow_forward</span>
             </Link>
          </div>

          {/* Decorative Elements */}
          <span className="material-symbols-outlined text-[300px] absolute -bottom-20 -right-20 text-white/5 select-none rotate-12">design_services</span>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        </div>
      </div>
    </div>
  );
};

export default Coaches;
