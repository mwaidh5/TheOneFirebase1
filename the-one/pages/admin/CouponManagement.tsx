
import React, { useState } from 'react';
import { useT } from '../../i18n/I18nContext';

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
  const { t } = useT();
  const statusLabel = (s: Coupon['status']) =>
    s === 'ACTIVE' ? t('admin.common.active') : s === 'EXPIRED' ? t('admin.coupons.expired') : t('admin.common.inactive');
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
    <div className="space-y-12 text-start pb-40 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase leading-none">{t('admin.coupons.title')}</h1>
          <p className="text-neutral-400 font-medium">{t('admin.coupons.subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-accent transition shadow-xl flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          {t('admin.coupons.create')}
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-2xl">
         <table className="w-full text-start">
            <thead className="bg-neutral-50 border-b border-neutral-100">
               <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('admin.coupons.code')}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('admin.coupons.reward')}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('admin.common.status')}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('admin.coupons.usage')}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-end">{t('admin.common.actions')}</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
               {coupons.map(c => (
                 <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-8 py-6">
                       <p className="font-black text-black uppercase text-lg tracking-widest font-mono" dir="ltr">{c.code}</p>
                       <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{t('admin.coupons.expires')} <span dir="ltr">{c.expiryDate}</span></p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-black">
                         {t('admin.coupons.off', { value: c.type === 'PERCENTAGE' ? `${c.value}%` : `$${c.value}` })}
                       </p>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                         c.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-400'
                       }`}>
                         {statusLabel(c.status)}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-black">{t('admin.coupons.times', { n: c.usageCount })}</p>
                    </td>
                    <td className="px-8 py-6 text-end">
                       <button 
                        onClick={() => setCoupons(coupons.filter(x => x.id !== c.id))}
                        aria-label={t('common.delete')}
                        title={t('common.delete')}
                        className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-300 hover:bg-red-500 hover:text-white transition flex items-center justify-center shadow-sm"
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                 <h3 className="text-2xl font-black font-display uppercase text-black">{t('admin.coupons.new_title')}</h3>
                 <button onClick={() => setIsModalOpen(false)} aria-label={t('common.close')} className="w-12 h-12 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition shadow-sm">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>

              <form onSubmit={handleCreate} className="p-10 space-y-8 text-start">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ms-1">{t('admin.coupons.promo_code')}</label>
                    <input 
                      type="text" required
                      value={newCoupon.code}
                      onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                      placeholder={t('admin.coupons.promo_ph')}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black uppercase text-lg tracking-widest focus:border-black outline-none"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ms-1">{t('admin.coupons.reward_type')}</label>
                       <select 
                         value={newCoupon.type}
                         onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})}
                         className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-bold outline-none focus:border-black appearance-none"
                       >
                          <option value="PERCENTAGE">{t('admin.coupons.percentage')}</option>
                          <option value="FIXED">{t('admin.coupons.fixed')}</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ms-1">{t('admin.coupons.reward_value')}</label>
                       <input 
                         type="number" required
                         value={newCoupon.value}
                         onChange={e => setNewCoupon({...newCoupon, value: parseInt(e.target.value)})}
                         className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black text-lg focus:border-black outline-none"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ms-1">{t('admin.coupons.expiry_date')}</label>
                    <input 
                      type="date"
                      value={newCoupon.expiryDate}
                      onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-bold outline-none focus:border-black"
                    />
                 </div>

                 <button className="w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition shadow-2xl">
                    {t('admin.coupons.deploy')}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
