
import React from 'react';

const BillingHistory: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black font-display uppercase tracking-tight text-black mb-12">Billing History</h1>
      <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Date</th>
              <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Course</th>
              <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Amount</th>
              <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {[1, 2, 3].map(i => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                <td className="px-8 py-6 text-sm font-medium">May {i + 10}, 2024</td>
                <td className="px-8 py-6 text-sm font-bold text-black uppercase tracking-tight">Engine Builder 101</td>
                <td className="px-8 py-6 text-sm font-black">$149.00</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">Paid</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingHistory;
