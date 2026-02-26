
import React from 'react';

const CoachDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black font-display tracking-tight text-black uppercase">Welcome Back, Coach.</h2>
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
           <p className="text-4xl font-black text-black">0</p>
           <p className="text-neutral-400 text-xs font-bold mt-2">-- this week</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm hover:shadow-lg transition-all">
           <div className="flex items-center justify-between mb-4">
              <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">Completed Sessions</p>
              <span className="material-symbols-outlined text-purple-600">done_all</span>
           </div>
           <p className="text-4xl font-black text-black">0</p>
           <p className="text-neutral-400 text-xs font-bold mt-2">Past 30 days</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm hover:shadow-lg transition-all">
           <div className="flex items-center justify-between mb-4">
              <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">Course Rating</p>
              <span className="material-symbols-outlined text-yellow-500 filled">star</span>
           </div>
           <p className="text-4xl font-black text-black">--</p>
           <p className="text-neutral-400 text-xs font-bold mt-2">No reviews yet</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm">
         <h3 className="text-xl font-bold font-display uppercase tracking-tight mb-8">Recent Athlete Logs</h3>
         <div className="space-y-6">
            <p className="text-center text-xs text-neutral-400 py-10 font-bold uppercase tracking-widest">No logs available.</p>
         </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
