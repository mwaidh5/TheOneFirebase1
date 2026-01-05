
import React, { useState, useMemo } from 'react';

type ActivityType = 'REVENUE' | 'ATHLETE' | 'SYSTEM' | 'AI';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user: { name: string; avatar: string; email: string };
  time: string;
  timestamp: number; // For time filtering
  data?: string;
  details?: {
    metaId?: string;
    status?: string;
    source?: string;
    impact?: string;
    technicalLog?: string;
  };
}

const AdminActivityFeed: React.FC = () => {
  const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D'>('24H');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const activities: Activity[] = [
    {
      id: 'act-1',
      type: 'REVENUE',
      title: 'New Enrollment',
      description: 'John Doe enrolled in Engine Builder 101',
      user: { name: 'John Doe', avatar: 'https://picsum.photos/100/100?random=1', email: 'john@doe.com' },
      time: 'Just now',
      timestamp: Date.now(),
      data: '$149.00',
      details: { metaId: 'ORD-9921', status: 'PAID', source: 'SindiPay Gateway', impact: 'Monthly Revenue' }
    },
    {
      id: 'act-2',
      type: 'ATHLETE',
      title: 'New Personal Record',
      description: 'Mike Ross logged a 405lb Deadlift',
      user: { name: 'Mike Ross', avatar: 'https://picsum.photos/100/100?random=2', email: 'mike@ross.com' },
      time: '12 minutes ago',
      timestamp: Date.now() - 12 * 60000,
      data: 'PR +15lb',
      details: { metaId: 'LOG-882', status: 'VERIFIED', source: 'Mobile App', impact: 'Athlete Milestone' }
    },
    {
      id: 'act-3',
      type: 'AI',
      title: 'AI Asset Generated',
      description: 'New hero imagery generated via Laboratory',
      user: { name: 'Admin Master', avatar: 'https://picsum.photos/100/100?random=admin', email: 'admin@pulse.com' },
      time: '45 minutes ago',
      timestamp: Date.now() - 45 * 60000,
      details: { metaId: 'GEN-442', status: 'COMMITTED', source: 'Gemini 2.5 Flash', impact: 'Site UI Refresh', technicalLog: 'Prompt: Cinematic wide shot of barbell in a dark gym with neon lighting.' }
    },
    {
      id: 'act-4',
      type: 'SYSTEM',
      title: 'Site Branding Updated',
      description: 'Global site settings published by admin',
      user: { name: 'Admin Master', avatar: 'https://picsum.photos/100/100?random=admin', email: 'admin@pulse.com' },
      time: '2 hours ago',
      timestamp: Date.now() - 120 * 60000,
      details: { metaId: 'SYS-LOG-01', status: 'SUCCESS', source: 'CMS Panel', impact: 'Global Theme', technicalLog: 'Primary Accent Color changed from #137fec to #000000.' }
    },
    {
      id: 'act-5',
      type: 'REVENUE',
      title: 'Subscription Renewed',
      description: 'Jane Smith renewed Pro Unlimited',
      user: { name: 'Jane Smith', avatar: 'https://picsum.photos/100/100?random=5', email: 'jane@smith.com' },
      time: '4 hours ago',
      timestamp: Date.now() - 240 * 60000,
      data: '$299.00',
      details: { metaId: 'ORD-9918', status: 'PAID', source: 'Stripe Direct', impact: 'Retention' }
    }
  ];

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchesFilter = filter === 'ALL' || a.type === filter;
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           a.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           a.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery]);

  const getTypeColor = (type: ActivityType) => {
    switch (type) {
      case 'REVENUE': return 'bg-green-500';
      case 'ATHLETE': return 'bg-accent';
      case 'AI': return 'bg-purple-500';
      case 'SYSTEM': return 'bg-neutral-900';
    }
  };

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'REVENUE': return 'payments';
      case 'ATHLETE': return 'fitness_center';
      case 'AI': return 'auto_awesome';
      case 'SYSTEM': return 'settings_suggest';
    }
  };

  return (
    <div className="space-y-12 text-left pb-40 animate-in fade-in duration-500">
      {/* Header & Stats Cards */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Command Center</h1>
            <p className="text-neutral-400 font-medium">Real-time intelligence and audit logs for The One ecosystem.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex p-1 bg-white border border-neutral-100 rounded-2xl shadow-sm">
               {['24H', '7D', '30D'].map((t) => (
                 <button
                    key={t}
                    onClick={() => setTimeframe(t as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      timeframe === t ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'
                    }`}
                 >
                   {t}
                 </button>
               ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { l: 'Total Events', v: '4,102', icon: 'list_alt', c: 'text-neutral-400' },
             { l: 'Security Flags', v: '0', icon: 'security', c: 'text-green-500' },
             { l: 'AI Requests', v: '124', icon: 'bolt', c: 'text-purple-500' },
             { l: 'Error Rate', v: '0.01%', icon: 'error_outline', c: 'text-neutral-300' }
           ].map(s => (
             <div key={s.l} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center ${s.c}`}>
                   <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                </div>
                <div>
                   <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">{s.l}</p>
                   <p className="text-lg font-black text-black leading-none mt-0.5">{s.v}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-xl flex flex-col lg:flex-row gap-6 items-center">
         <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input 
              type="text" 
              placeholder="Search by athlete, order ID, or AI prompt..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold outline-none focus:border-black transition-all"
            />
         </div>
         <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar">
            {['ALL', 'REVENUE', 'ATHLETE', 'AI', 'SYSTEM'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                  filter === f ? 'bg-black text-white border-black shadow-xl' : 'bg-neutral-50 text-neutral-400 border-neutral-50 hover:border-neutral-200'
                }`}
              >
                {f}
              </button>
            ))}
         </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredActivities.map((activity, i) => (
          <div 
            key={activity.id} 
            className={`group bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center gap-6 animate-in slide-in-from-bottom-2 duration-300`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${getTypeColor(activity.type)}`}>
              <span className="material-symbols-outlined text-2xl filled">{getTypeIcon(activity.type)}</span>
            </div>

            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-50 shrink-0">
              <img src={activity.user.avatar} className="w-full h-full object-cover" alt={activity.user.name} />
            </div>

            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-neutral-50 ${getTypeColor(activity.type).replace('bg-', 'text-')}`}>{activity.type}</span>
                <span className="w-1 h-1 rounded-full bg-neutral-200"></span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${activity.time === 'Just now' ? 'text-accent animate-pulse' : 'text-neutral-300'}`}>
                  {activity.time}
                </span>
              </div>
              <h3 className="text-lg font-black text-black uppercase tracking-tight leading-none group-hover:text-accent transition-colors">
                {activity.title}
              </h3>
              <p className="text-sm text-neutral-500 font-medium mt-1">{activity.description}</p>
            </div>

            {activity.data && (
              <div className="bg-neutral-50 px-6 py-3 rounded-2xl border border-neutral-100 min-w-[120px] text-center">
                <p className="text-xl font-black text-black font-display tracking-tight">{activity.data}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
               <button 
                  onClick={() => setSelectedActivity(activity)}
                  className="px-6 py-3 rounded-xl bg-neutral-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-lg flex items-center gap-2"
               >
                  <span className="material-symbols-outlined text-lg">visibility</span>
                  Lookup
               </button>
            </div>
          </div>
        ))}

        {filteredActivities.length === 0 && (
          <div className="py-24 text-center space-y-4">
             <span className="material-symbols-outlined text-7xl text-neutral-100 animate-pulse">database_off</span>
             <p className="text-neutral-300 font-black uppercase tracking-[0.3em]">No Intelligence matching query</p>
          </div>
        )}
      </div>

      <div className="pt-10 flex justify-center">
         <button className="px-12 py-5 bg-white border border-neutral-100 text-neutral-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-black hover:text-black shadow-sm transition-all flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">history</span>
            Load Full 30-Day Audit
         </button>
      </div>

      {/* Deep Intelligence Inspector Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                 <div className="space-y-1">
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${getTypeColor(selectedActivity.type).replace('bg-', 'text-')}`}>Intelligence Detail</p>
                    <h3 className="text-3xl font-black font-display uppercase text-black leading-none">{selectedActivity.title}</h3>
                 </div>
                 <button 
                  onClick={() => setSelectedActivity(null)} 
                  className="w-12 h-12 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                 >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                 </button>
              </div>

              <div className="p-10 space-y-10">
                 {/* User Context */}
                 <div className="flex items-center gap-6 p-6 bg-neutral-50 rounded-3xl border border-neutral-100 shadow-inner">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-md shrink-0">
                       <img src={selectedActivity.user.avatar} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-xl font-black text-black uppercase tracking-tight truncate">{selectedActivity.user.name}</p>
                       <p className="text-xs text-neutral-400 font-medium truncate">{selectedActivity.user.email}</p>
                    </div>
                 </div>

                 {/* Logic Breakdown */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white border border-neutral-100 rounded-3xl space-y-1">
                       <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Entry ID</p>
                       <p className="text-sm font-black text-black font-mono">{selectedActivity.details?.metaId}</p>
                    </div>
                    <div className="p-6 bg-white border border-neutral-100 rounded-3xl space-y-1">
                       <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">System Status</p>
                       <p className="text-sm font-black text-green-600 uppercase tracking-tight">{selectedActivity.details?.status}</p>
                    </div>
                    <div className="p-6 bg-white border border-neutral-100 rounded-3xl space-y-1">
                       <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Logic Source</p>
                       <p className="text-sm font-black text-black uppercase tracking-tight">{selectedActivity.details?.source}</p>
                    </div>
                    <div className="p-6 bg-white border border-neutral-100 rounded-3xl space-y-1">
                       <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Platform Impact</p>
                       <p className="text-sm font-black text-accent uppercase tracking-tight">{selectedActivity.details?.impact}</p>
                    </div>
                 </div>

                 {/* Technical Logs (If AI/System) */}
                 {selectedActivity.details?.technicalLog && (
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em] ml-1">Contextual Logic Data</h4>
                       <div className="p-6 bg-neutral-900 rounded-[2rem] border border-white/5 font-mono text-[11px] text-accent leading-relaxed italic">
                          "{selectedActivity.details.technicalLog}"
                       </div>
                    </div>
                 )}

                 <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                    <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Detected at {selectedActivity.time}</p>
                    <div className="flex gap-3">
                       <button className="px-6 py-3 bg-neutral-50 text-neutral-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Audit User</button>
                       <button onClick={() => setSelectedActivity(null)} className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-xl">Close Insight</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityFeed;
