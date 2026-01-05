
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminAddUser: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-20">
      <div className="space-y-1">
        <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-neutral-400 hover:text-black text-xs font-black uppercase tracking-widest mb-6 transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Users
        </button>
        <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Register New Athlete</h1>
        <p className="text-neutral-400 font-medium">Create a new profile for a CrossFit athlete.</p>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-10">
        <div className="flex items-center gap-8 pb-10 border-b border-neutral-100">
          <div className="w-24 h-24 rounded-[2rem] bg-neutral-50 border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-300 gap-1 cursor-pointer hover:border-black hover:text-black transition-all">
            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
            <span className="text-[10px] font-black uppercase">Upload</span>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-black font-display uppercase">Athlete Portrait</p>
            <p className="text-sm text-neutral-400">JPG or PNG. Max size 2MB.</p>
          </div>
        </div>

        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">First Name</label>
              <input type="text" placeholder="John" className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-5 text-black focus:ring-2 focus:ring-black outline-none font-medium transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Last Name</label>
              <input type="text" placeholder="Doe" className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-5 text-black focus:ring-2 focus:ring-black outline-none font-medium transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Email Address</label>
            <input type="email" placeholder="athlete@example.com" className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-5 text-black focus:ring-2 focus:ring-black outline-none font-medium transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Athlete Level</label>
              <select className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-5 text-black focus:ring-2 focus:ring-black outline-none font-bold transition-all appearance-none">
                <option>Beginner</option>
                <option>Intermediate / RX</option>
                <option>Elite</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Role</label>
              <select className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-5 text-black focus:ring-2 focus:ring-black outline-none font-bold transition-all appearance-none">
                <option>Client</option>
                <option>Coach</option>
                <option>Admin</option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-neutral-800 shadow-xl transition-all">
              Create Athlete Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAddUser;
