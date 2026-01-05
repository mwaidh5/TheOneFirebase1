
import React, { useState } from 'react';

interface Subscription {
  id: string;
  athleteName: string;
  plan: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'REFUNDED';
  price: string;
  renewal: string;
  gateway: string;
}

const SupportSubscriptions: React.FC = () => {
  const [search, setSearch] = useState('');

  const subscriptions: Subscription[] = [
    { id: '#SUB-9021', athleteName: 'Alex Johnson', plan: 'Engine Builder 101', status: 'ACTIVE', price: '$149.00', renewal: 'Nov 12, 2024', gateway: 'SindiPay' },
    { id: '#SUB-8821', athleteName: 'Mark Ruffalo', plan: 'Pro Unlimited', status: 'ACTIVE', price: '$299.00', renewal: 'Dec 01, 2024', gateway: 'Stripe' },
    { id: '#SUB-7712', athleteName: 'Sarah Jenkins', plan: 'Muay Thai Custom', status: 'PENDING', price: '$350.00', renewal: 'N/A', gateway: 'SindiPay' },
    { id: '#SUB-6623', athleteName: 'John Doe', plan: 'Bodybuilding Track', status: 'EXPIRED', price: '$99.00', renewal: 'Oct 10, 2024', gateway: 'SindiPay' }
  ];

  const filtered = subscriptions.filter(s => 
    s.athleteName.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="text-left space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display uppercase text-black leading-none tracking-tight">Athlete Subscriptions</h1>
          <p className="text-neutral-400 font-medium">Verify enrollments and resolve billing discrepancy reports.</p>
        </div>
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
          <input 
            type="text" 
            placeholder="Search Athlete or ID..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-neutral-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-sm outline-none focus:border-purple-600 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-xl overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-100">
               <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Reference ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Athlete</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Track / Plan</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Gateway</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
               {filtered.map(sub => (
                 <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-8 py-6">
                       <p className="text-xs font-black text-neutral-300 uppercase tracking-tight">{sub.id}</p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-black uppercase tracking-tight">{sub.athleteName}</p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-xs font-bold text-neutral-600 uppercase">{sub.plan}</p>
                       <p className="text-[10px] text-neutral-400 mt-1">{sub.price} • Renewal: {sub.renewal}</p>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                         sub.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                         sub.status === 'PENDING' ? 'bg-orange-50 text-orange-600' :
                         'bg-neutral-100 text-neutral-500'
                       }`}>
                         {sub.status}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-neutral-300">payments</span>
                          <span className="text-[10px] font-bold text-neutral-500">{sub.gateway}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-sm">
                          Verify Payment
                       </button>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
         {filtered.length === 0 && (
           <div className="py-24 text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-neutral-100">receipt_long</span>
              <p className="text-neutral-300 font-black uppercase tracking-widest">No matching records found</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default SupportSubscriptions;
