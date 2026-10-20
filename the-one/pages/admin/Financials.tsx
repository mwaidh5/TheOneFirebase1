
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useT } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';

const DAY_KEYS: Record<string, TranslationKey> = {
  Mon: 'admin.fin.day_mon', Tue: 'admin.fin.day_tue', Wed: 'admin.fin.day_wed', Thu: 'admin.fin.day_thu',
  Fri: 'admin.fin.day_fri', Sat: 'admin.fin.day_sat', Sun: 'admin.fin.day_sun',
};

const data = [
  { name: 'Mon', rev: 4000 },
  { name: 'Tue', rev: 3000 },
  { name: 'Wed', rev: 2000 },
  { name: 'Thu', rev: 2780 },
  { name: 'Fri', rev: 1890 },
  { name: 'Sat', rev: 2390 },
  { name: 'Sun', rev: 3490 },
];

const AdminFinancials: React.FC = () => {
  const { t, isRtl } = useT();
  const chartData = data.map(d => ({ ...d, name: t(DAY_KEYS[d.name]) }));
  return (
    <div className="space-y-12 text-start pb-40 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase leading-none">{t('admin.fin.title')}</h1>
          <p className="text-neutral-400 font-medium">{t('admin.fin.subtitle')}</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white border border-neutral-100 rounded-xl px-6 py-3 flex items-center gap-3 shadow-sm">
              <span className="material-symbols-outlined text-green-500 filled">account_balance_wallet</span>
              <span className="text-sm font-black text-black">{t('admin.fin.total_payouts', { amount: '$42,240.00' })}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('admin.fin.net_revenue'), val: '$12,450', trend: '+12%', color: 'text-accent', icon: 'payments' },
          { label: t('admin.fin.avg_order'), val: '$185', trend: '+5%', color: 'text-purple-600', icon: 'shopping_basket' },
          { label: t('admin.fin.churn'), val: '2.4%', trend: '-0.5%', color: 'text-green-600', icon: 'sync' },
          { label: t('admin.fin.refund_rate'), val: '0.8%', trend: t('admin.dash.metric_optimal'), color: 'text-orange-600', icon: 'undo' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
              <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-300">
                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
              </div>
            </div>
            <p className={`text-4xl font-black text-black font-display tracking-tighter`} dir="ltr">{stat.val}</p>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${stat.trend.includes('+') ? 'text-green-600' : 'text-neutral-400'}`}><span dir="ltr">{stat.trend}</span> {t('admin.fin.vs_last_month')}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-2xl space-y-10">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black font-display uppercase tracking-tight">{t('admin.fin.revenue_velocity')}</h3>
              <div className="flex gap-2">
                 <span className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest"><div className="w-3 h-3 bg-accent rounded-full"></div> {t('admin.fin.gross')}</span>
              </div>
           </div>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#137fec" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" reversed={isRtl} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#bbb'}} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '20px'}}
                    itemStyle={{fontWeight: 900, color: '#137fec', textTransform: 'uppercase', fontSize: '12px'}}
                  />
                  <Area type="monotone" dataKey="rev" name={t('admin.fin.revenue')} stroke="#137fec" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 bg-black rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
           <div className="relative z-10 space-y-6">
              <h3 className="text-2xl font-black font-display uppercase leading-tight">{t('admin.fin.revenue_line1')} <br />{t('admin.fin.revenue_line2')}</h3>
              <div className="space-y-6">
                 {[
                   { label: t('admin.fin.bespoke_cycles'), val: '65%', color: 'bg-accent' },
                   { label: t('admin.fin.standard_courses'), val: '25%', color: 'bg-white' },
                   { label: t('admin.fin.coach_tips'), val: '10%', color: 'bg-neutral-700' }
                 ].map(i => (
                   <div key={i.label} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="text-neutral-400">{i.label}</span>
                         <span dir="ltr">{i.val}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                         <div className={`h-full ${i.color} rounded-full`} style={{ width: i.val }}></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           <span className="material-symbols-outlined text-[160px] absolute -bottom-10 -end-10 text-white/5 rotate-12 select-none">pie_chart</span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-2xl">
         <div className="p-8 border-b border-neutral-50 flex justify-between items-center bg-neutral-50/30">
            <h3 className="text-lg font-black font-display uppercase tracking-tight">{t('admin.fin.recent_ledger')}</h3>
            <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">{t('admin.fin.download_report')}</button>
         </div>
         <table className="w-full text-start">
            <thead className="bg-neutral-50/50">
               <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('admin.fin.transaction')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('admin.fin.method')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-end">{t('admin.common.amount')}</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
               {[
                 { name: 'Sarah Jenkins', product: 'Bespoke Muay Thai', date: '2m ago', method: 'SindiPay', amount: '+$350.00' },
                 { name: 'Mark Ruffalo', product: 'Engine Builder 101', date: '1h ago', method: 'Stripe', amount: '+$149.00' },
                 { name: 'Diana Prince', product: 'Subscription Renewal', date: '4h ago', method: 'SindiPay', amount: '+$299.00' },
               ].map((tx, i) => (
                 <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-8 py-6">
                       <p className="font-black text-black uppercase text-sm tracking-tight">{tx.name}</p>
                       <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{tx.product} • {tx.date}</p>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1 bg-neutral-100 rounded-lg text-[9px] font-black uppercase text-neutral-500">{tx.method}</span>
                    </td>
                    <td className="px-8 py-6 text-end">
                       <p className="text-lg font-black text-green-600" dir="ltr">{tx.amount}</p>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default AdminFinancials;
