
import React from 'react';

const UserDetails: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="space-y-12">
        <div>
          <h1 className="text-4xl font-black font-display uppercase tracking-tight text-black mb-4">Athlete Vitals</h1>
          <p className="text-neutral-500 font-medium">Keep your biometric data updated to get the most accurate training stimulus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { label: 'Current Weight', val: '185', unit: 'lbs' },
            { label: 'Height', val: '6\'0"', unit: '' },
            { label: 'Age', val: '29', unit: 'years' },
            { label: 'Body Fat %', val: '14.5', unit: '%' },
          ].map(stat => (
            <div key={stat.label} className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 space-y-4">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{stat.label}</label>
              <div className="flex items-baseline gap-2">
                <input type="text" defaultValue={stat.val} className="bg-transparent text-3xl font-black text-black border-b border-neutral-200 focus:border-black outline-none w-24" />
                <span className="text-neutral-400 font-bold uppercase text-xs">{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-black text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl font-bold font-display uppercase">Personal Records</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Back Squat</p>
                <p className="text-2xl font-black">315 lbs</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Clean & Jerk</p>
                <p className="text-2xl font-black">245 lbs</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Fran Time</p>
                <p className="text-2xl font-black">3:42</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <span className="material-symbols-outlined text-[160px]">fitness_center</span>
          </div>
        </div>

        <button className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-neutral-800 transition-all">
          Save Vitals
        </button>
      </div>
    </div>
  );
};

export default UserDetails;
