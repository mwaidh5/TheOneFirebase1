
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(new Date().toLocaleTimeString());

  const runSystemScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScan(new Date().toLocaleTimeString());
    }, 2000);
  };

  const systemMetrics = [
    { name: 'Core Kernel', status: 'Optimal', health: 100, latency: '12ms', icon: 'terminal' },
    { name: 'Athlete Database', status: 'Online', health: 98, latency: '45ms', icon: 'database' },
    { name: 'Application Cache', status: 'Buffered', health: 94, latency: '2ms', icon: 'speed' },
    { name: 'SindiPay Gateway', status: 'Connected', health: 100, latency: '120ms', icon: 'account_balance' },
    { name: 'AI Logic Core', status: 'Ready', health: 100, latency: '850ms', icon: 'auto_awesome' },
    { name: 'Media CDN', status: 'Operational', health: 95, latency: '28ms', icon: 'cloud_done' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-display tracking-tight text-black uppercase leading-none">System Oversight</h2>
          <p className="text-neutral-400 font-medium">Monitoring platform performance and coaching quality.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/admin/activity" className="px-6 py-4 bg-white border border-neutral-200 text-black font-black text-[10px] rounded-xl hover:bg-neutral-50 transition-all shadow-sm uppercase tracking-widest flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">history</span>
             Audit Log
          </Link>
          <button 
            onClick={() => setIsStatusOpen(true)}
            className="px-6 py-4 bg-black text-white font-black text-[10px] rounded-xl hover:bg-neutral-800 shadow-xl transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[18px]">emergency_share</span>
            Platform Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {[
          { label: 'Active Athletes', val: '1,240', trend: '+5%', color: 'text-accent', icon: 'groups' },
          { label: 'Coach Published', val: '12', sub: 'Past 7 days', color: 'text-purple-600', icon: 'school' },
          { label: 'Custom Revenue', val: '$4,250', trend: '+18%', color: 'text-green-600', icon: 'payments' },
          { label: 'Cycle Leads', val: '4', sub: 'Pending Review', color: 'text-orange-600', icon: 'architecture' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-8">
              <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
              <div className={`w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform shadow-inner`}>
                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-black text-black font-display tracking-tighter">{stat.val}</p>
              {stat.trend ? (
                <span className="text-green-600 text-[10px] font-black uppercase tracking-widest">{stat.trend}</span>
              ) : (
                <span className="text-neutral-300 text-[10px] font-black uppercase tracking-widest">{stat.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-left">
        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-12">
                 <h3 className="text-2xl font-black font-display uppercase tracking-tight">Financial Velocity</h3>
                 <div className="flex p-1 bg-neutral-50 rounded-xl">
                    <button className="px-4 py-2 bg-white text-black shadow-sm rounded-lg text-[9px] font-black uppercase tracking-widest">Revenue</button>
                    <button className="px-4 py-2 text-neutral-400 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Growth</button>
                 </div>
              </div>
              <div className="h-80 w-full bg-neutral-50/50 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-neutral-100">
                <span className="material-symbols-outlined text-6xl text-neutral-100 mb-4 animate-pulse">monitoring</span>
                <p className="text-neutral-200 font-black uppercase tracking-[0.4em] italic text-sm">Real-time Data Stream Enabled</p>
              </div>
           </div>
           <span className="material-symbols-outlined text-[200px] absolute -bottom-20 -right-20 text-neutral-50 select-none rotate-12 opacity-30">bar_chart</span>
        </div>

        <div className="lg:col-span-4 bg-white rounded-[3rem] border border-neutral-100 shadow-2xl flex flex-col h-full overflow-hidden">
          <div className="p-8 border-b border-neutral-50 flex items-center justify-between bg-neutral-50/30">
            <h3 className="text-lg font-black font-display uppercase tracking-tight">Platform Pulse</h3>
            <Link to="/admin/activity" className="text-accent text-[9px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
              Live Feed <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-2">
            {[
              { type: 'BUILD', text: 'Coach Mercer finalized Sarah Jenkins custom plan.', time: '2m ago', color: 'text-accent' },
              { type: 'LEAD', text: 'New custom intake from Bruce Wayne (CrossFit).', time: '12m ago', color: 'text-orange-500' },
              { type: 'ORDER', text: 'Success: Payment for #ORD-9281 confirmed.', time: '45m ago', color: 'text-green-500' },
              { type: 'AUTH', text: 'Site settings logic updated via AI Architect.', time: '2h ago', color: 'text-purple-500' },
            ].map((ev, i) => (
              <div key={i} className="px-8 py-6 hover:bg-neutral-50 transition-all border-b border-neutral-50 last:border-0 relative group">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-neutral-50 ${ev.color}`}>{ev.type}</span>
                  <span className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest">• {ev.time}</span>
                </div>
                <p className="text-xs font-bold text-black leading-relaxed group-hover:text-accent transition-colors">{ev.text}</p>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                   <span className="material-symbols-outlined text-neutral-300">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-black text-white rounded-b-[3rem] flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-[20px] filled">auto_awesome</span>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest">Architect Tip</p>
                <p className="text-[9px] font-medium text-neutral-400">Coaches have published 3 new tracks this morning. Audit requested.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Platform Status Modal */}
      {isStatusOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-neutral-950 w-full max-w-2xl rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col border border-white/10">
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                 <div className="text-left space-y-1">
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Infrastructure Diagnostic</p>
                    <h3 className="text-3xl font-black font-display uppercase text-white leading-none">System Health</h3>
                 </div>
                 <button 
                  onClick={() => setIsStatusOpen(false)} 
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-red-500 hover:border-red-500 transition-all group"
                 >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar text-left">
                 <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4">
                       <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'}`}></div>
                       <p className="text-xs font-black uppercase text-white tracking-widest">
                          {isScanning ? 'Synchronizing Kernels...' : 'All Systems Nominal'}
                       </p>
                    </div>
                    <button 
                      onClick={runSystemScan}
                      disabled={isScanning}
                      className="px-5 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                      {isScanning ? 'Scanning...' : 'Refresh Pulse'}
                    </button>
                 </div>

                 <div className="grid gap-4">
                    {systemMetrics.map((m, i) => (
                       <div key={m.name} className="flex items-center gap-6 p-5 bg-white/[0.02] hover:bg-white/5 rounded-2xl border border-white/5 transition-all group">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                             <span className="material-symbols-outlined text-2xl">{m.icon}</span>
                          </div>
                          <div className="flex-grow">
                             <div className="flex justify-between items-end mb-2">
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">{m.name}</h4>
                                <span className="text-[10px] font-black text-accent uppercase tracking-widest">{m.latency}</span>
                             </div>
                             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                   className={`h-full bg-accent transition-all duration-1000 ease-out ${isScanning ? 'w-0' : ''}`} 
                                   style={{ width: isScanning ? '0%' : `${m.health}%` }}
                                ></div>
                             </div>
                          </div>
                          <div className="text-right min-w-[80px]">
                             <p className="text-[9px] font-black text-neutral-500 uppercase mb-0.5">Status</p>
                             <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">{m.status}</p>
                          </div>
                       </div>
                    ))}
                 </div>

                 <div className="p-6 bg-accent/10 rounded-2xl border border-accent/20 flex gap-4 items-start">
                    <span className="material-symbols-outlined text-accent animate-pulse">security</span>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-accent uppercase tracking-widest">End-to-End Encryption</p>
                       <p className="text-xs text-white/60 leading-relaxed">System communication is authorized via 256-bit logic signatures. No unauthorized egress detected.</p>
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/5 shrink-0 flex justify-between items-center">
                 <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Last Intelligence Audit: {lastScan}</p>
                 <div className="flex gap-4">
                    <span className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                       <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                    </span>
                    <span className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                       <span className="w-2 h-2 rounded-full bg-white/10"></span> Standby
                    </span>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
