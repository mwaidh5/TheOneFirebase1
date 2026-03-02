
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserRole } from '../../types';

const AdminAddUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    level: 'Beginner',
    systemRole: UserRole.CLIENT,
    status: 'Active' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName) return;

    try {
        const userId = 'u-' + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, 'users', userId), {
            id: userId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone || '',
            role: formData.systemRole,
            level: formData.level,
            memberSince: new Date().getFullYear().toString(),
            avatar: `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=random`,
            status: formData.status,
            createdAt: serverTimestamp(),
            enrolledCourseIds: []
        });
        
        alert(`Profile created for ${formData.firstName}`);
        navigate('/admin/users');
    } catch (error) {
        console.error("Error creating user", error);
        alert("Failed to create user.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-12 pb-20 px-4 md:px-0">
      <div className="space-y-1">
        <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-neutral-400 hover:text-black text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 md:mb-6 transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>
        <h1 className="text-2xl md:text-4xl font-black font-display tracking-tight text-black uppercase">Add Athlete</h1>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-8 md:space-y-10">
        <form className="space-y-6 md:space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-neutral-400 ml-1">First Name</label>
              <input 
                type="text" required
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                placeholder="John" 
                className="w-full rounded-xl md:rounded-2xl border border-neutral-100 bg-neutral-50 p-4 md:p-5 text-black outline-none font-bold transition-all" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Last Name</label>
              <input 
                type="text" required
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                placeholder="Doe" 
                className="w-full rounded-xl md:rounded-2xl border border-neutral-100 bg-neutral-50 p-4 md:p-5 text-black outline-none font-bold transition-all" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Email Address</label>
            <input 
                type="email" required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="athlete@example.com" 
                className="w-full rounded-xl md:rounded-2xl border border-neutral-100 bg-neutral-50 p-4 md:p-5 text-black outline-none font-bold transition-all" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Level</label>
              <select 
                value={formData.level}
                onChange={e => setFormData({...formData, level: e.target.value})}
                className="w-full rounded-xl md:rounded-2xl border border-neutral-100 bg-neutral-50 p-4 md:p-5 text-black font-black uppercase text-[10px] outline-none"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Elite</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-neutral-400 ml-1">System Role</label>
              <select 
                value={formData.systemRole}
                onChange={e => setFormData({...formData, systemRole: e.target.value as UserRole})}
                className="w-full rounded-xl md:rounded-2xl border border-neutral-100 bg-neutral-50 p-4 md:p-5 text-black font-black uppercase text-[10px] outline-none"
              >
                <option value={UserRole.CLIENT}>Client</option>
                <option value={UserRole.COACH}>Coach</option>
                <option value={UserRole.SUPPORT}>Support</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" className="w-full py-4 md:py-6 bg-black text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm shadow-xl hover:bg-neutral-800 transition-all">
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAddUser;
