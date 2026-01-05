
import React, { useState, useRef, useEffect } from 'react';

interface Order {
  id: string;
  name: string;
  email: string;
  phone: string;
  product: string;
  amount: string;
  status: string;
  date: string;
  progress: number;
  lastPr: string;
}

const AdminOrders: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [viewingProgress, setViewingProgress] = useState<Order | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [orders, setOrders] = useState<Order[]>([
    { id: '#ORD-9281', name: 'John Doe', email: 'john@example.com', phone: '+1 (555) 123-4567', product: 'Engine Builder 101', amount: '$149.00', status: 'Completed', date: 'Oct 24, 2024', progress: 65, lastPr: '245lb Clean' },
    { id: '#ORD-9282', name: 'Jane Smith', email: 'jane@example.com', phone: '+1 (555) 987-6543', product: 'Olympic Lifting Clinic', amount: '$79.00', status: 'Processing', date: 'Oct 25, 2024', progress: 12, lastPr: 'N/A' },
    { id: '#ORD-9283', name: 'Mike Ross', email: 'mike@example.com', phone: '+1 (555) 444-5555', product: 'Engine Builder 101', amount: '$149.00', status: 'Completed', date: 'Oct 25, 2024', progress: 88, lastPr: '405lb Deadlift' },
    { id: '#ORD-9284', name: 'Harvey Specter', email: 'harvey@example.com', phone: '+1 (555) 777-8888', product: 'Pro Unlimited', amount: '$299.00', status: 'Refunded', date: 'Oct 26, 2024', progress: 0, lastPr: 'N/A' },
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id: string) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <div className="space-y-10 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Revenue & Orders</h1>
          <p className="text-neutral-400 font-medium">Manage transactions and monitor client lifecycle.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-neutral-400 text-lg">calendar_today</span>
            <span className="text-xs font-bold uppercase tracking-widest text-black">Last 30 Days</span>
          </div>
          <button className="px-6 py-3 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-neutral-800 transition-all shadow-xl">
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full md:w-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
          <input 
            type="text" 
            placeholder="Search by name, email, phone or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:border-black transition-all"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-100 rounded-xl py-3 px-4 text-xs font-black uppercase tracking-widest outline-none cursor-pointer focus:border-black transition-all"
          >
            <option>All Status</option>
            <option>Completed</option>
            <option>Processing</option>
            <option>Refunded</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Order ID</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Customer</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Contact Info</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Product</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {orders.map((order, i) => (
              <tr key={i} className="hover:bg-neutral-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <p className="text-xs font-black text-neutral-400 uppercase">{order.id}</p>
                  <p className="text-[10px] font-medium text-neutral-400 mt-1">{order.date}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="font-black text-black uppercase text-sm tracking-tight">{order.name}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <p className="text-xs text-neutral-400 font-medium">{order.email}</p>
                    <p className="text-xs text-neutral-500 font-black mt-1 uppercase tracking-tighter">{order.phone}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">{order.product}</p>
                  <p className="text-sm font-black text-black mt-1">{order.amount}</p>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                    order.status === 'Completed' ? 'bg-green-50 text-green-700' : 
                    order.status === 'Processing' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 relative">
                    <button 
                      onClick={() => setViewingProgress(order)}
                      className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">monitoring</span>
                      Progress
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => toggleMenu(order.id)}
                        className={`p-2 rounded-xl transition-all ${activeMenuId === order.id ? 'bg-black text-white' : 'text-neutral-300 hover:text-black hover:bg-neutral-100'}`}
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                      
                      {activeMenuId === order.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-100 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 hover:text-black transition-all">
                            <span className="material-symbols-outlined text-[18px]">receipt</span> View Invoice
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 hover:text-black transition-all">
                            <span className="material-symbols-outlined text-[18px]">mail</span> Send Reminder
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 hover:text-black transition-all text-left">
                            <span className="material-symbols-outlined text-[18px]">call</span> Call Customer
                          </button>
                          <div className="h-px bg-neutral-50 my-1"></div>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all">
                            <span className="material-symbols-outlined text-[18px]">undo</span> Refund Order
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Progression Modal (Previously implemented) */}
      {viewingProgress && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative p-12 space-y-10 text-left">
            <button 
              onClick={() => setViewingProgress(null)}
              className="absolute top-8 right-8 w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center hover:bg-black hover:text-white transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Client Progression Tracker</span>
              <h3 className="text-4xl font-black font-display uppercase text-black leading-none">{viewingProgress.name}</h3>
              <p className="text-sm text-neutral-400 font-medium">Tracking: <span className="text-black">{viewingProgress.product}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 bg-neutral-50 rounded-3xl border border-neutral-100 space-y-4">
                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Course Completion</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-black">{viewingProgress.progress}%</span>
                </div>
                <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${viewingProgress.progress}%` }}></div>
                </div>
              </div>
              <div className="p-8 bg-neutral-50 rounded-3xl border border-neutral-100 space-y-4">
                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Latest Record (PR)</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-accent shadow-sm">
                    <span className="material-symbols-outlined filled">trophy</span>
                  </div>
                  <p className="text-2xl font-black text-black uppercase tracking-tight">{viewingProgress.lastPr}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
