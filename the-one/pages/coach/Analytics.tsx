
import React from 'react';

const CoachAnalytics: React.FC = () => {
  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Coach Insights</h1>
          <p className="text-neutral-400 font-medium">Data-driven performance monitoring for your athletes.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-neutral-400">analytics</span>
            <span className="text-sm font-bold">Comprehensive View</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Avg Workout Time', val: '42m', sub: '-2m vs last mo', color: 'text-blue-600' },
          { label: 'Session Completion', val: '88%', sub: '+4% improvement', color: 'text-green-600' },
          { label: 'Total PRs Logged', val: '245', sub: 'Past 30 days', color: 'text-purple-600' },
          { label: 'Engagement Rate', val: '92%', sub: 'High Retention', color: 'text-orange-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4">{stat.label}</p>
            <p className={`text-4xl font-black ${stat.color} font-display mb-2`}>{stat.val}</p>
            <p className="text-[10px] font-bold text-neutral-300 uppercase">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-sm">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-bold font-display uppercase tracking-tight">Athlete PR Distribution</h2>
          <div className="flex gap-4">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><div className="w-3 h-3 bg-accent rounded-full"></div> Strength</span>
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><div className="w-3 h-3 bg-black rounded-full"></div> Skill</span>
          </div>
        </div>
        <div className="h-96 w-full bg-neutral-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-neutral-200 relative overflow-hidden">
           <div className="text-neutral-300 font-black uppercase tracking-[0.4em] italic text-2xl select-none opacity-20">Analytics Visualization</div>
           {/* Decorative elements for the placeholder */}
           <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/5 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default CoachAnalytics;
