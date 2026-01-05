
import React, { useState } from 'react';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  usageCount: number;
  expiryDate: string;
}

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: '1', code: 'IRON10', type: 'PERCENTAGE', value: 10, status: 'ACTIVE', usageCount: 142, expiryDate: '2024-12-31' },
    { id: '2', code: 'LAUNCH50', type: 'FIXED', value: 50, status: 'ACTIVE', usageCount: 89, expiryDate: '2024-11-15' },
    { id: '3', code: 'SUMMER25', type: 'PERCENTAGE', value: 25, status: 'EXPIRED', usageCount: 210, expiryDate: '2024-08-30' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '',
    type: 'PERCENTAGE',
    value: 0,
    expiryDate: '',
    status: 'ACTIVE'
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Coupon = {
      id: Math.random().toString(36).substr(2, 9),
      code: newCoupon.code!.toUpperCase(),
      type: newCoupon.type as any,
      value: newCoupon.value!,
      status: 'ACTIVE',
      usageCount: 0,
      expiryDate: newCoupon.expiryDate || 'N/A'
    };
    setCoupons([item, ...coupons]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-12 text-left pb-40 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase leading-none">Promotion Strategy</h1>
          <p className="text-neutral-400 font-medium">Manage promotional codes and incentives for the IronPulse store.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-accent transition-all shadow-xl flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-2xl">
         <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-100">
               <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Code</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Reward</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Usage</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
               {coupons.map(c => (
                 <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-8 py-6">
                       <p className="font-black text-black uppercase text-lg tracking-widest font-mono">{c.code}</p>
                       <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Expires: {c.expiryDate}</p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-black">
                         {c.type === 'PERCENTAGE' ? `${c.value}% OFF` : `$${c.value} OFF`}
                       </p>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                         c.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-400'
                       }`}>
                         {c.status}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-black">{c.usageCount} Times</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                        onClick={() => setCoupons(coupons.filter(x => x.id !== c.id))}
                        className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                       >
                          <span className="material-symbols-outlined text-lg">delete</span>
                       </button>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                 <h3 className="text-2xl font-black font-display uppercase text-black">New Master Coupon</h3>
                 <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>

              <form onSubmit={handleCreate} className="p-10 space-y-8 text-left">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Promo Code</label>
                    <input 
                      type="text" required
                      value={newCoupon.code}
                      onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. PERFORMANCE20"
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black uppercase text-lg tracking-widest focus:border-black outline-none"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Reward Type</label>
                       <select 
                         value={newCoupon.type}
                         onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})}
                         className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-bold outline-none focus:border-black appearance-none"
                       >
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FIXED">Fixed Amount ($)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Reward Value</label>
                       <input 
                         type="number" required
                         value={newCoupon.value}
                         onChange={e => setNewCoupon({...newCoupon, value: parseInt(e.target.value)})}
                         className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black text-lg focus:border-black outline-none"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Expiry Date</label>
                    <input 
                      type="date"
                      value={newCoupon.expiryDate}
                      onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-bold outline-none focus:border-black"
                    />
                 </div>

                 <button className="w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all shadow-2xl">
                    Deploy Promotional Logic
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
