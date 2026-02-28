
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface CustomCourseProps {
  currentUser: User | null;
}

const CustomCourse: React.FC<CustomCourseProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const sports = [
    { id: 'crossfit', name: 'CrossFit', icon: 'fitness_center', desc: "High-intensity functional movements for complete athletic performance." },
    { id: 'muaythai', name: 'Muay Thai', icon: 'sports_mma', desc: "Strike with power and precision. Conditioning for fighters." },
    { id: 'bodybuilding', name: 'Body Building', icon: 'accessibility_new', desc: "Hypertrophy focused programming for aesthetic excellence." },
    { id: 'strength', name: 'Strength & Conditioning', icon: 'bolt', desc: "Raw power development for sports performance." },
    { id: 'powerlifting', name: 'Powerlifting', icon: 'weight', desc: "Master the big three. Strength specific periodization." },
    { id: 'general', name: 'General Fitness', icon: 'reorder', desc: "Sustainable health and wellness for everyday life." }
  ];

  const handleSelect = (id: string) => {
    navigate(`/checkout?courseId=custom-${id}`);
  };

  const handleContactSupport = () => {
    // If logged in, go to profile messages with support context
    if (currentUser) {
        navigate('/profile/messages?coachId=support');
    } else {
        // If not logged in, maybe go to contact page or login
        navigate('/login?redirect=/profile/messages?coachId=support');
    }
  };

  return (
    <div className="flex-grow bg-white flex flex-col items-center justify-center p-6 text-left animate-in fade-in duration-700">
      <div className="w-full max-w-6xl space-y-12 py-12">
        <div className="space-y-6 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black font-display uppercase tracking-tight text-black leading-none">Custom Programming</h1>
          <p className="text-neutral-500 font-medium text-lg leading-relaxed">
            Select your discipline. Our expert coaches will build a bespoke training cycle tailored specifically to your goals after enrollment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => handleSelect(sport.id)}
              className="group p-8 rounded-[2.5rem] border border-neutral-100 bg-neutral-50 hover:bg-black hover:border-black transition-all text-left flex flex-col justify-between h-full shadow-sm hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:bg-neutral-800 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-black group-hover:text-white transition-colors">{sport.icon}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black font-display uppercase tracking-tight text-black group-hover:text-white transition-colors">{sport.name}</h3>
                  <p className="text-sm font-medium text-neutral-500 group-hover:text-neutral-400 transition-colors leading-relaxed">
                    {sport.desc}
                  </p>
                </div>
              </div>
              
              <div className="pt-8 mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent group-hover:text-white transition-colors">
                <span>Select Program</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-neutral-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden text-center shadow-2xl">
           <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tight">How it works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                 <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-black text-white mb-2">1</div>
                    <p className="font-bold uppercase text-sm">Select & Enroll</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">Choose your sport and complete the secure checkout process.</p>
                 </div>
                 <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-black text-white mb-2">2</div>
                    <p className="font-bold uppercase text-sm">Coach Connection</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">You'll be assigned a dedicated coach and complete a detailed intake.</p>
                 </div>
                 <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-black text-white mb-2">3</div>
                    <p className="font-bold uppercase text-sm">Execute Cycle</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">Receive your custom plan and start training with ongoing feedback.</p>
                 </div>
              </div>
              <button 
                onClick={handleContactSupport}
                className="mt-8 px-8 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs hover:bg-neutral-200 transition-all"
              >
                Contact Support
              </button>
           </div>
           <span className="material-symbols-outlined text-[300px] absolute -bottom-32 -right-20 text-white/5 rotate-12 select-none">architecture</span>
        </div>
      </div>
    </div>
  );
};

export default CustomCourse;
