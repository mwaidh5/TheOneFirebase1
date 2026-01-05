
import React from 'react';

const CoachDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black font-display tracking-tight text-black uppercase">Welcome Back, Coach Mercer.</h2>
          <p className="text-neutral-400 font-medium">Your athletes are ready for today's programming.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white border border-neutral-200 text-black font-bold text-sm rounded-xl hover:shadow-lg transition-all shadow-sm">Review Logs</button>
          <button className="px-6 py-3 bg-black text-white font-bold text-sm rounded-xl hover:bg-neutral-800 shadow-xl transition-all flex items-center gap-2 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Build Program
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm hover:shadow-lg transition-all">
           <div className="flex items-center justify-between mb-4">
              <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">Active Athletes</p>
              <span className="material-symbols-outlined text-accent">person</span>
           </div>
           <p className="text-4xl font-black text-black">124</p>
           <p className="text-green-600 text-xs font-bold mt-2">+3 this week</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm hover:shadow-lg transition-all">
           <div className="flex items-center justify-between mb-4">
              <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">Completed Sessions</p>
              <span className="material-symbols-outlined text-purple-600">done_all</span>
           </div>
           <p className="text-4xl font-black text-black">842</p>
           <p className="text-neutral-400 text-xs font-bold mt-2">Past 30 days</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm hover:shadow-lg transition-all">
           <div className="flex items-center justify-between mb-4">
              <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">Course Rating</p>
              <span className="material-symbols-outlined text-yellow-500 filled">star</span>
           </div>
           <p className="text-4xl font-black text-black">4.9</p>
           <p className="text-neutral-400 text-xs font-bold mt-2">From 210 reviews</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm">
         <h3 className="text-xl font-bold font-display uppercase tracking-tight mb-8">Recent Athlete Logs</h3>
         <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-6 p-4 hover:bg-neutral-50 rounded-2xl transition-all">
                <div className="w-12 h-12 rounded-full bg-neutral-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                  <img src={`https://picsum.photos/100/100?random=${i+10}`} alt="Avatar" />
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-bold text-black uppercase tracking-tight">Athlete #{i + 240}</p>
                  <p className="text-xs text-neutral-500">Logged 245lb Clean & Jerk (PR!)</p>
                </div>
                <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-neutral-100 rounded-lg hover:bg-black hover:text-white transition-all">High Five</button>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
