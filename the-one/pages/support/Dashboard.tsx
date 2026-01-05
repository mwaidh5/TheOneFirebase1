
import React from 'react';

const SupportDashboard: React.FC = () => {
  return (
    <div className="text-left space-y-12 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-4xl font-black font-display uppercase text-black leading-none tracking-tight">Support Overview</h1>
        <p className="text-neutral-400 font-medium">Monitoring client satisfaction and platform queries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Open Tickets', val: '12', color: 'text-purple-600', icon: 'chat_bubble' },
          { label: 'Avg Response', val: '4m', color: 'text-accent', icon: 'timer' },
          { label: 'Resolved (24h)', val: '45', color: 'text-green-600', icon: 'check_circle' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{stat.label}</p>
              <span className={`material-symbols-outlined ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`}>{stat.icon}</span>
            </div>
            <p className="text-4xl font-black text-black">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-sm space-y-8">
          <h2 className="text-xl font-black font-display uppercase tracking-tight">Priority Resolution Queue</h2>
          <div className="space-y-4">
             {[
               { user: 'Bruce Wayne', issue: 'SindiPay timeout on Custom Muay Thai', time: '12m ago', priority: 'HIGH' },
               { user: 'Clark Kent', issue: 'Course "Engine Builder" video not loading', time: '45m ago', priority: 'MEDIUM' },
               { user: 'Peter Parker', issue: 'Diagnostic upload failing (HEVC format)', time: '2h ago', priority: 'HIGH' }
             ].map((ticket, i) => (
               <div key={i} className="flex items-center justify-between p-6 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-purple-200 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 shadow-inner"></div>
                    <div>
                      <p className="text-sm font-black text-black uppercase tracking-tight">{ticket.user}</p>
                      <p className="text-xs text-neutral-500 font-medium">{ticket.issue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${ticket.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{ticket.priority}</span>
                    <p className="text-[9px] font-bold text-neutral-300 mt-1">{ticket.time}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-purple-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
           <div className="relative z-10 space-y-6">
              <h2 className="text-2xl font-black font-display uppercase leading-tight">Need Admin <br />Escalation?</h2>
              <p className="text-purple-100 text-sm font-medium leading-relaxed">System-wide issues should be logged via the Infrastructure Pulse for immediate Kernel review.</p>
              <button className="w-full py-4 bg-white text-purple-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-100 transition-all shadow-xl">Notify Admin Master</button>
           </div>
           <span className="material-symbols-outlined text-[160px] absolute -bottom-10 -right-10 text-white/5 rotate-12 select-none">emergency</span>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
